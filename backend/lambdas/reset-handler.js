'use strict';
/**
 * Lambda HTTP para RESETEAR el sistema en la nube: deja ventas e historiales
 * en CERO. NO borra productos, categorías, usuarios, mesas ni deliveryZones.
 *
 * Seguridad: solo rol admin del sistema (claim del JWT). Pensada como respaldo
 * del botón "Resetear sistema (nube)" del frontend; el frontend ya puede
 * hacerlo enviando 'delete' por WebSocket, pero esta Lambda lo hace del lado
 * servidor de forma masiva y consistente.
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient, QueryCommand, BatchWriteCommand, GetCommand, PutCommand,
} = require('@aws-sdk/lib-dynamodb');
const { tenantFromEvent, roleFromEvent } = require('./auth-jwt');

const TABLE = process.env.TABLE_NAME || 'combatti-pos';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Colecciones que se ponen en CERO (ventas e historiales).
const COLLECTIONS_TO_CLEAR = ['orders', 'kitchenTickets', 'deletedOrders', 'historicalSales', 'movements'];
// Se conservan intactas: products, categories, users, tables, deliveryZones, supplies.

const pk = (tenant, coll) => (tenant && tenant !== 'default' ? `TENANT#${tenant}#${coll}` : coll);
const json = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });

async function clearCollection(tenant, coll) {
  let deleted = 0;
  let lastKey;
  do {
    const res = await ddb.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': pk(tenant, coll) },
      ExclusiveStartKey: lastKey,
    }));
    const items = res.Items || [];
    for (let i = 0; i < items.length; i += 25) {
      const batch = items.slice(i, i + 25).map((it) => ({
        DeleteRequest: { Key: { PK: it.PK, SK: it.SK } },
      }));
      if (batch.length) {
        await ddb.send(new BatchWriteCommand({ RequestItems: { [TABLE]: batch } }));
        deleted += batch.length;
      }
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return deleted;
}

exports.handler = async (event) => {
  const role = roleFromEvent(event);
  if (!['admin', 'system-admin', 'Administrador', 'AdminSistema'].includes(role)) {
    return json(403, { error: 'Solo el administrador del sistema puede resetear.' });
  }
  const tenant = tenantFromEvent(event);

  const result = {};
  for (const coll of COLLECTIONS_TO_CLEAR) {
    result[coll] = await clearCollection(tenant, coll);
  }

  // Reset de la config de caja (cerrada, sin cuadres) conservando el resto.
  const cfgRes = await ddb.send(new GetCommand({ TableName: TABLE, Key: { PK: pk(tenant, 'config'), SK: 'config' } }));
  const cfg = (cfgRes.Item && cfgRes.Item.data) ? cfgRes.Item.data : {};
  const prevHist = (cfg.cash && Array.isArray(cfg.cash.history)) ? cfg.cash.history.map((r) => r.id).filter(Boolean) : [];
  cfg.cash = {
    ...(cfg.cash || {}),
    open: false, openedAt: null, openedBy: '', openedByUser: '', openingAmount: 0,
    history: [],
    deletedHistoryIds: Array.from(new Set([...((cfg.cash && cfg.cash.deletedHistoryIds) || []), ...prevHist])),
  };
  cfg._seq = Date.now();
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: { PK: pk(tenant, 'config'), SK: 'config', data: cfg, updatedAt: Date.now() },
  }));

  return json(200, { ok: true, message: 'Sistema reseteado: ventas e historiales en cero (productos intactos).', deleted: result });
};
