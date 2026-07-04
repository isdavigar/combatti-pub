'use strict';
/**
 * Lambda del WebSocket API (rutas $connect, $disconnect y sync/$default).
 * Reproduce el protocolo que usa Restaurante.html:
 *   in : { action:'sync', type:'getConfig'|'getAll'|'putConfig'|'put'|'delete', collection, docId, payload }
 *   out: { type:'config'|'configChange'|'snapshot'|'change'|'delete', ... }
 *
 * Guarda en DynamoDB (single table) y difunde los cambios en tiempo real a
 * todas las conexiones del mismo tenant.
 *
 * Multi-tenant: el PK se prefija con el tenant (TENANT#<id>#<collection>).
 * El tenant se toma del JWT en el $connect y se guarda junto a la conexión.
 */
const {
  DynamoDBClient,
} = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient, PutCommand, DeleteCommand, GetCommand, QueryCommand,
} = require('@aws-sdk/lib-dynamodb');
const {
  ApiGatewayManagementApiClient, PostToConnectionCommand,
} = require('@aws-sdk/client-apigatewaymanagementapi');
const { tenantFromEvent } = require('./auth-jwt');

const TABLE = process.env.TABLE_NAME || 'combatti-pos';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const pk = (tenant, coll) => (tenant && tenant !== 'default' ? `TENANT#${tenant}#${coll}` : coll);
const connPk = (tenant) => pk(tenant, 'CONN');

function mgmt(event) {
  const { domainName, stage } = event.requestContext;
  return new ApiGatewayManagementApiClient({ endpoint: `https://${domainName}/${stage}` });
}

async function send(api, connectionId, payload) {
  try {
    await api.send(new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(payload)),
    }));
  } catch (err) {
    if (err.statusCode === 410) { /* conexión muerta: se limpia por TTL */ }
  }
}

// API Gateway WebSocket descarta cualquier mensaje mayor a 128 KB. Colecciones
// grandes (p.ej. `orders`, `kitchenTickets`) superaban ese límite y el snapshot
// se perdía en silencio -> los pedidos NO aparecían en otros dispositivos.
// Aquí partimos el snapshot en varios trozos por debajo del límite y los
// enviamos con chunkIndex/chunkCount para que el cliente los reensamble.
const MAX_SNAPSHOT_BYTES = 110 * 1024; // margen de seguridad bajo el límite de 128 KB

async function sendSnapshot(api, connectionId, coll, items) {
  const list = Array.isArray(items) ? items : [];
  // Agrupa items en lotes que no superen el tamaño máximo por mensaje.
  const chunks = [];
  let current = [];
  let currentBytes = 2; // los corchetes del array JSON
  for (const it of list) {
    const size = Buffer.byteLength(JSON.stringify(it)) + 1; // + coma
    if (current.length && currentBytes + size > MAX_SNAPSHOT_BYTES) {
      chunks.push(current);
      current = [];
      currentBytes = 2;
    }
    current.push(it);
    currentBytes += size;
  }
  // Siempre enviamos al menos un trozo (aunque la colección esté vacía).
  if (current.length || chunks.length === 0) chunks.push(current);

  const chunkCount = chunks.length;
  for (let i = 0; i < chunkCount; i++) {
    await send(api, connectionId, {
      type: 'snapshot',
      collection: coll,
      items: chunks[i],
      chunkIndex: i,
      chunkCount,
    });
  }
}

async function broadcast(event, tenant, payload, exceptConnId) {
  const api = mgmt(event);
  const conns = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: { ':pk': connPk(tenant) },
  }));
  await Promise.all((conns.Items || [])
    .filter((c) => c.SK !== exceptConnId)
    .map((c) => send(api, c.SK, payload)));
}

exports.handler = async (event) => {
  const { routeKey, connectionId } = event.requestContext;

  // --- $connect: registra la conexión con su tenant ---
  if (routeKey === '$connect') {
    const tenant = tenantFromEvent(event);
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: { PK: connPk(tenant), SK: connectionId, tenant, connectedAt: Date.now() },
    }));
    return { statusCode: 200 };
  }

  // --- $disconnect: elimina la conexión ---
  if (routeKey === '$disconnect') {
    // Buscar en cualquier tenant (barrido simple: intentar borrar por defecto).
    const tenant = tenantFromEvent(event);
    await ddb.send(new DeleteCommand({
      TableName: TABLE, Key: { PK: connPk(tenant), SK: connectionId },
    })).catch(() => {});
    return { statusCode: 200 };
  }

  // --- sync ($default): mensajes de datos ---
  let msg = {};
  try { msg = JSON.parse(event.body || '{}'); } catch (_) { msg = {}; }
  const tenant = tenantFromEvent(event);
  const api = mgmt(event);
  const type = msg.type;

  if (type === 'getConfig') {
    const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: { PK: pk(tenant, 'config'), SK: 'config' } }));
    await send(api, connectionId, { type: 'config', payload: res.Item ? res.Item.data : null });
    return { statusCode: 200 };
  }

  if (type === 'getAll') {
    const coll = msg.collection;
    const res = await ddb.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': pk(tenant, coll) },
    }));
    const items = (res.Items || []).map((it) => it.data).filter(Boolean);
    // Enviar en trozos < 128 KB (ver sendSnapshot) para que no se pierda.
    await sendSnapshot(api, connectionId, coll, items);
    return { statusCode: 200 };
  }

  if (type === 'putConfig') {
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: { PK: pk(tenant, 'config'), SK: 'config', data: msg.payload, updatedAt: Date.now() },
    }));
    await broadcast(event, tenant, { type: 'configChange', payload: msg.payload }, connectionId);
    return { statusCode: 200 };
  }

  if (type === 'put') {
    const { collection, docId, payload } = msg;
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: { PK: pk(tenant, collection), SK: String(docId), data: payload, updatedAt: Date.now() },
    }));
    await broadcast(event, tenant, { type: 'change', collection, payload }, connectionId);
    return { statusCode: 200 };
  }

  if (type === 'delete') {
    const { collection, docId } = msg;
    await ddb.send(new DeleteCommand({
      TableName: TABLE, Key: { PK: pk(tenant, collection), SK: String(docId) },
    }));
    await broadcast(event, tenant, { type: 'delete', collection, docId }, connectionId);
    return { statusCode: 200 };
  }

  return { statusCode: 200 };
};
