/**
 * Cloudflare Pages Function — proxy de /api/** hacia el backend (gateway).
 *
 * Mantiene el frontend y la API en el MISMO origen (sin CORS): las llamadas a
 * `/api/...` del Angular se reenvían al gateway desplegado.
 *
 * Configura en Cloudflare Pages la variable de entorno:
 *   BACKEND_URL = https://api.tu-dominio.com   (URL pública del gateway)
 *
 * Nota: para WebSocket (/ws, tiempo real) usa una conexión directa al gateway;
 * el proxy de Pages Functions no es adecuado para WebSocket.
 */
export async function onRequest({ request, env, params }) {
  const backend = env.BACKEND_URL;
  if (!backend) {
    return new Response(
      JSON.stringify({ error: 'BACKEND_URL no está configurado en Cloudflare Pages' }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    );
  }

  const url = new URL(request.url);
  const path = Array.isArray(params.path) ? params.path.join('/') : params.path || '';
  const target = `${backend.replace(/\/+$/, '')}/api/${path}${url.search}`;

  // Reenvía método, cabeceras (incluida Authorization) y cuerpo tal cual.
  return fetch(new Request(target, request));
}
