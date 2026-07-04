# Backend serverless (referencia) — Combatti POS

> ⚠️ **Importante:** tu POS **ya tiene un backend serverless en producción y funcionando**
> (API Gateway WebSocket `wss://4qf3jjqn3j.execute-api.us-east-1.amazonaws.com/production/`
> + DynamoDB tabla `combatti-pos`). Esta carpeta es la **reproducción/documentación**
> de esa arquitectura para que puedas **mantenerla, versionarla y redeployarla** si lo
> necesitas. **No cambies el endpoint del frontend salvo que despliegues este backend en
> uno nuevo.**

## Arquitectura (estilo Loggro Restobar)

```
Frontend (Restaurante.html, Vanilla JS)
        │  WebSocket (STOMP-less, JSON)
        ▼
API Gateway (WebSocket API)  ── $connect / $disconnect / sync ──►  Lambda sync-handler
        │                                                                │
        │  postToConnection (tiempo real a todos los dispositivos)       ▼
        └──────────────────────────────────────────────────►     DynamoDB  combatti-pos
                                                                  (Single Table Design)
```

- **Tiempo real multi-dispositivo:** cada cambio se guarda en DynamoDB y se
  reenvía por WebSocket a las demás conexiones del mismo restaurante (tenant).
- **Single Table Design:** una sola tabla guarda todas las colecciones.

## Modelo de datos (Single Table Design)

Tabla **`combatti-pos`**:

| Atributo    | Tipo   | Descripción                                              |
|-------------|--------|----------------------------------------------------------|
| `PK` (HASH) | String | Colección: `orders`, `tables`, `users`, `config`, `historicalSales`, `movements`, `kitchenTickets`, `deletedOrders`, `deliveryZones`, `CONN` |
| `SK` (RANGE)| String | Id del item (`docId`) o `connectionId` para conexiones   |
| `data`      | Map    | El objeto del item (el `payload` que envía el frontend)  |
| `updatedAt` | Number | Epoch ms de la última escritura                          |

> **Multi-tenant:** hoy la tabla es de **un restaurante**. Para varios, prefija
> `PK` con el tenant: `TENANT#<tenantId>#orders`. El `tenantId` se extrae del
> JWT (claim `tenant_id`) en el `$connect`. Ver `lambdas/sync-handler.js`.

## Protocolo WebSocket (lo que envía/espera el frontend)

Mensajes que **envía** el frontend (`action: "sync"`):

| type        | Campos                          | Efecto                                  |
|-------------|---------------------------------|-----------------------------------------|
| `getConfig` | —                               | Devuelve `{type:'config', payload}`     |
| `getAll`    | `collection`                    | Devuelve `{type:'snapshot', collection, items}` |
| `putConfig` | `payload`                       | Guarda config y difunde `configChange`  |
| `put`       | `collection, docId, payload`    | Guarda item y difunde `change`          |
| `delete`    | `collection, docId`             | Borra item y difunde `delete`           |

Mensajes que **recibe** el frontend: `config`, `configChange`, `snapshot`, `change`, `delete`.

## Despliegue

```bash
cd backend
./infra/dynamodb-table.sh          # crea la tabla (si no existe)
# Empaqueta y despliega las Lambdas + la WebSocket API con tu IaC preferida
# (SAM, Serverless Framework o consola). Ver infra/README-deploy.md
```

## Archivos

- `infra/dynamodb-table.sh` — crea la tabla DynamoDB (single-table).
- `lambdas/sync-handler.js` — Lambda del WebSocket (connect/disconnect/sync).
- `lambdas/reset-handler.js` — Lambda para **resetear** ventas e historiales
  (deja todo en cero, **mantiene productos**). Solo admin.
- `lambdas/auth-jwt.js` — helper para extraer `tenant_id`/rol del JWT.
