/**
 * Configuración de entorno. `apiBaseUrl` es relativa ("/api") para funcionar
 * tanto en desarrollo (proxy a localhost:8080) como en producción (nginx
 * reenvía /api al gateway).
 */
export const environment = {
  production: true,
  apiBaseUrl: '/api',
};
