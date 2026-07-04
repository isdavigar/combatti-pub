import { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const db = new DynamoDBClient({ region: "us-east-1" });
const TABLE = "combatti-pos";

export const handler = async (event) => {
  const { requestContext, body } = event;
  const routeKey = requestContext.routeKey;
  const connectionId = requestContext.connectionId;
  const domain = requestContext.domainName;
  const stage = requestContext.stage;
  const endpoint = `https://${domain}/${stage}`;

  try {
    if (routeKey === "$connect") {
      await db.send(new PutItemCommand({
        TableName: TABLE,
        Item: marshall({ PK: "CONN", SK: connectionId, connectedAt: Date.now() })
      }));
      return { statusCode: 200 };
    }

    if (routeKey === "$disconnect") {
      await db.send(new DeleteItemCommand({
        TableName: TABLE,
        Key: marshall({ PK: "CONN", SK: connectionId })
      }));
      return { statusCode: 200 };
    }

    // All other messages (sync, $default)
    const data = JSON.parse(body || "{}");
    const msgType = data.type || data.action || "";

    if (msgType === "put") {
      const { collection, docId, payload } = data;
      await db.send(new PutItemCommand({
        TableName: TABLE,
        Item: marshall({ PK: collection, SK: docId, data: payload, updatedAt: Date.now() }, { removeUndefinedValues: true })
      }));
      await broadcast(endpoint, connectionId, { type: "change", collection, docId, payload });
      return { statusCode: 200, body: "ok" };
    }

    if (msgType === "delete") {
      const { collection, docId } = data;
      await db.send(new DeleteItemCommand({
        TableName: TABLE,
        Key: marshall({ PK: collection, SK: docId })
      }));
      await broadcast(endpoint, connectionId, { type: "remove", collection, docId });
      return { statusCode: 200, body: "ok" };
    }

    if (msgType === "getAll") {
      const { collection } = data;
      const result = await db.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: marshall({ ":pk": collection })
      }));
      const items = (result.Items || []).map(i => { const u = unmarshall(i); let d = u.data || u; if(typeof d === 'string') try { d = JSON.parse(d); } catch(_){} return d; });
      const api = new ApiGatewayManagementApiClient({ endpoint });

      // API Gateway descarta cualquier mensaje mayor a 128 KB. Colecciones
      // grandes (p.ej. orders/kitchenTickets) superaban ese limite y el snapshot
      // se perdia en silencio -> los pedidos no aparecian en otros dispositivos.
      // Partimos el snapshot en trozos < 128 KB y los enviamos con
      // chunkIndex/chunkCount para que el cliente los reensamble.
      const MAX_BYTES = 110 * 1024; // margen de seguridad bajo el limite de 128 KB
      const chunks = [];
      let current = [];
      let currentBytes = 2; // corchetes del array JSON
      for (const it of items) {
        const size = Buffer.byteLength(JSON.stringify(it)) + 1; // + coma
        if (current.length && currentBytes + size > MAX_BYTES) {
          chunks.push(current); current = []; currentBytes = 2;
        }
        current.push(it); currentBytes += size;
      }
      // Siempre al menos un trozo (aunque la coleccion este vacia).
      if (current.length || chunks.length === 0) chunks.push(current);

      const chunkCount = chunks.length;
      for (let idx = 0; idx < chunkCount; idx++) {
        await api.send(new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({ type: "snapshot", collection, items: chunks[idx], chunkIndex: idx, chunkCount })
        }));
      }
      return { statusCode: 200, body: "ok" };
    }

    if (msgType === "putConfig") {
      const { payload } = data;
      await db.send(new PutItemCommand({
        TableName: TABLE,
        Item: marshall({ PK: "CONFIG", SK: "business", data: payload, updatedAt: Date.now() }, { removeUndefinedValues: true })
      }));
      await broadcast(endpoint, connectionId, { type: "configChange", payload });
      return { statusCode: 200, body: "ok" };
    }

    if (msgType === "getConfig") {
      const result = await db.send(new GetItemCommand({
        TableName: TABLE,
        Key: marshall({ PK: "CONFIG", SK: "business" })
      }));
      const item = result.Item ? unmarshall(result.Item) : null;
      const api = new ApiGatewayManagementApiClient({ endpoint });
      await api.send(new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify({ type: "config", payload: typeof item?.data === 'string' ? JSON.parse(item.data) : (item?.data || null) })
      }));
      return { statusCode: 200, body: "ok" };
    }

    return { statusCode: 200, body: "no-op" };
  } catch (err) {
    console.error("Error:", err);
    return { statusCode: 500, body: err.message };
  }
};

async function broadcast(endpoint, senderConnectionId, message) {
  const result = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: marshall({ ":pk": "CONN" })
  }));
  const connections = (result.Items || []).map(i => unmarshall(i));
  const api = new ApiGatewayManagementApiClient({ endpoint });
  const msg = JSON.stringify(message);
  
  for (const conn of connections) {
    if (conn.SK === senderConnectionId) continue;
    try {
      await api.send(new PostToConnectionCommand({ ConnectionId: conn.SK, Data: msg }));
    } catch (e) {
      if (e.statusCode === 410 || e.$metadata?.httpStatusCode === 410) {
        await db.send(new DeleteItemCommand({ TableName: TABLE, Key: marshall({ PK: "CONN", SK: conn.SK }) }));
      }
    }
  }
}
