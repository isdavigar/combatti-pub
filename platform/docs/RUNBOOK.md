# Runbook de puesta en producción — Combatti POS

Guía para desplegar la plataforma y migrar los datos del POS anterior.

## Arquitectura del despliegue

| Componente | Tecnología | Dónde se despliega |
|------------|-----------|--------------------|
| Frontend (Angular) | Estático (SPA) | **Cloudflare Pages** |
| Gateway + 8 microservicios | Spring Boot (Docker) | **Host de contenedores** (AWS recomendado) |
| Base de datos | PostgreSQL | **Postgres gestionada** (AWS RDS / Neon / Supabase) |
| pos-bridge | Spring Boot (Docker) | **En el local** (junto al hardware) |

> **Importante sobre Cloudflare:** Cloudflare Pages/Workers ejecuta sitios
> estáticos y JavaScript/WASM, **no** ejecuta JARs de Java/Spring Boot ni
> PostgreSQL. Por eso el frontend va a Pages, pero el backend necesita un host
> de contenedores aparte. Cloudflare queda **delante** como CDN/proxy.

---

## Parte A — Backend (Docker) en AWS

Como ya usas AWS para el sistema anterior, es el camino natural. Dos opciones:

### Opción A1 — AWS App Runner / ECS Fargate (gestionado)
1. **Base de datos:** crea una instancia **RDS for PostgreSQL** (una base `combatti`).
   Guarda el endpoint, usuario y contraseña.
2. **Imágenes:** construye y publica cada servicio en **ECR** usando los
   `Dockerfile` ya incluidos (uno por servicio + gateway). El contexto de build
   es el directorio `platform/`:
   ```bash
   # ejemplo para un servicio
   docker build -f services/auth-service/Dockerfile -t <ecr>/auth-service:latest .
   docker push <ecr>/auth-service:latest
   ```
3. **Servicios:** crea un servicio (App Runner o ECS Fargate) por cada módulo,
   inyectando las variables de entorno de la sección [Secretos](#secretos).
4. **Red:** el `gateway` (puerto 8080) es el único que se expone públicamente;
   los demás servicios se comunican en la red privada por nombre/host.

### Opción A2 — VPS con Docker Compose (más simple)
En una EC2 (o cualquier VPS) con Docker:
```bash
git clone https://github.com/isdavigar/combatti-pub
cd combatti-pub/platform/infra
# define los secretos en un archivo .env (ver abajo)
docker compose up -d --build
```
Esto levanta Postgres + los 8 servicios + gateway + pos-bridge. Expón solo el
puerto 8080 (gateway) detrás de un reverse-proxy con TLS (Caddy/Nginx) o de
Cloudflare.

### Alternativas no-AWS
**Railway**, **Render** o **Fly.io** despliegan los `Dockerfile` directamente y
ofrecen Postgres gestionada; son la vía más rápida si no quieres administrar AWS.

---

## Parte B — Frontend en Cloudflare Pages

El proyecto ya está conectado a Cloudflare Pages. Configuración de build:

- **Root directory:** `platform/frontend`
- **Build command:** `npm ci && npm run build`
- **Build output directory:** `dist/combatti-web/browser`

### Enrutar `/api` y `/ws` hacia el backend
El frontend usa `apiBaseUrl = '/api'` (relativo). En producción hay que llevar
ese `/api` hasta el gateway. Dos formas:

**B1 — Proxy con Cloudflare Pages Functions (recomendado, mismo origen).**
Se incluye `platform/frontend/functions/api/[[path]].js`, que reenvía
`/api/*` al backend. Solo debes definir en Pages la variable de entorno
`BACKEND_URL` con la URL pública del gateway (p. ej. `https://api.combatti.tu-dominio.com`).
Así no hay CORS y todo queda bajo el dominio de Pages.

**B2 — URL absoluta + CORS.** Alternativamente, apunta el frontend al gateway
con una URL absoluta y habilita CORS en el gateway con
`CORS_ALLOWED_ORIGINS=https://tu-sitio.pages.dev`. Para WebSocket (`/ws`),
el navegador se conecta directamente al gateway.

> **WebSocket (tiempo real):** el proxy de Pages Functions no es ideal para
> WebSocket; si usas B1, considera exponer `/ws` del gateway en un subdominio y
> conectar el realtime ahí, o usa la opción B2 para `/ws`.

---

## Secretos

Configura estas variables en cada servicio (App Runner/ECS/compose `.env`):

| Variable | Descripción |
|----------|-------------|
| `JWT_SECRET` | **Secreto fuerte y único** (mín. 32 chars). **El mismo en todos los servicios** (firma compartida). |
| `JWT_ISSUER` | `combatti-auth` |
| `DB_URL` | `jdbc:postgresql://<host>:5432/combatti` |
| `DB_USER` / `DB_PASSWORD` | credenciales de Postgres |
| `CORS_ALLOWED_ORIGINS` | URL del frontend (Pages) si usas la opción B2 |
| `*_SERVICE_URI` | URLs internas que usa el gateway (ver `docker-compose.yml`) |
| `CATALOG_SERVICE_URI`, `ORDERS_SERVICE_URI` | usadas por `integration-service` |

> ⚠️ **Genera un `JWT_SECRET` nuevo** (no uses el valor de desarrollo). El
> mismo secreto se usa para la autenticación de usuarios y para las llamadas
> internas entre servicios.

---

## Parte C — Migración de datos del POS anterior

El POS anterior guarda los datos en el navegador (`localStorage`, claves
`combatti_*`). Para traerlos:

1. **Exportar:** abre `platform/tools/legacy-migration/export-legacy-data.html`
   en el **mismo navegador y dominio** donde usas el POS viejo (en AWS) y pulsa
   *Exportar*. Se descarga `combatti-export.json`.
2. **Importar:** con el backend ya desplegado, ejecuta el importador (Node 18+):
   ```bash
   cd platform/tools/legacy-migration
   node import-legacy.mjs --file combatti-export.json \
     --gateway https://api.combatti.tu-dominio.com \
     --user admin --password <clave-admin>
   ```
   Importa **categorías, productos, mesas y datos del negocio** (marca →
   configuración). Ver `tools/legacy-migration/README.md` para el detalle y el
   alcance (los históricos de ventas/caja no se migran; el reporting arranca
   desde cero).

---

## Parte D — Checklist de smoke test post-despliegue

- [ ] `GET https://<gateway>/api/auth/health` responde `UP`.
- [ ] Login con admin devuelve un JWT (`POST /api/auth/login`).
- [ ] **Cambia la contraseña del admin** (`admin/admin123` es solo semilla).
- [ ] El frontend (Pages) carga y permite iniciar sesión.
- [ ] Catálogo: se ven categorías y productos.
- [ ] Crear una mesa, abrir un pedido y cobrarlo; verificar en caja y reportes.
- [ ] Swagger accesible por servicio (`/swagger-ui.html`) — restríngelo o
      ciérralo en producción si no quieres exponerlo.
- [ ] Métricas en `/actuator/prometheus`; configura Prometheus/Grafana.
- [ ] `JWT_SECRET` de producción configurado y distinto del de desarrollo.
- [ ] Backups automáticos de la base de datos activados.

---

## Notas de seguridad

- Cambia el `JWT_SECRET` y la contraseña del admin antes de salir a producción.
- No expongas públicamente los puertos de los servicios internos (solo el gateway).
- Considera proteger o deshabilitar Swagger/actuator sensibles en producción.
- Las API keys de integración solo muestran su secreto al crearse; guárdalas bien.
