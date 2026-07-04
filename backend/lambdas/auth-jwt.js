'use strict';
// Helper para extraer tenant_id y rol desde un JWT (sin dependencias externas).
// El token se pasa como query string en el $connect del WebSocket:
//   wss://.../production/?token=<JWT>
// o en el header Authorization para APIs HTTP.
//
// NOTA: valida la firma con tu secreto/JWKS en producción. Aquí se decodifica
// el payload; añade la verificación de firma según tu proveedor (Cognito, etc.).

function decodeJwtPayload(token) {
  try {
    const part = String(token).split('.')[1];
    if (!part) return null;
    const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
}

// Devuelve el tenant del token, o 'default' si no hay (compat single-tenant).
function tenantFromEvent(event) {
  const qs = (event && event.queryStringParameters) || {};
  const token = qs.token || qs.jwt ||
    ((event.headers && (event.headers.Authorization || event.headers.authorization) || '').replace(/^Bearer\s+/i, ''));
  const claims = token ? decodeJwtPayload(token) : null;
  return (claims && (claims.tenant_id || claims.tenantId || claims.tid)) || process.env.DEFAULT_TENANT || 'default';
}

function roleFromEvent(event) {
  const qs = (event && event.queryStringParameters) || {};
  const token = qs.token || qs.jwt ||
    ((event.headers && (event.headers.Authorization || event.headers.authorization) || '').replace(/^Bearer\s+/i, ''));
  const claims = token ? decodeJwtPayload(token) : null;
  return (claims && (claims.role || claims.rol)) || 'user';
}

module.exports = { decodeJwtPayload, tenantFromEvent, roleFromEvent };
