/**
 * Configuración de entorno. `apiBaseUrl` es relativa ("/api") para funcionar
 * tanto en desarrollo (proxy a localhost:8080) como en producción (nginx
 * reenvía /api al gateway).
 *
 * `bridgeBaseUrl` apunta al POS Local Bridge que corre en la máquina del
 * local (hardware: impresoras, cajón monedero). Es opcional: si no está
 * disponible, la app sigue funcionando sin impresión.
 */
export const environment = {
  production: true,
  apiBaseUrl: '/api',
  bridgeBaseUrl: 'http://localhost:9100/api/pos',
};
