# Combatti Platform

Migración del POS monolítico (`Restaurante.html`) a una arquitectura profesional
cloud-native. Este monorepo contiene el backend de microservicios (Java / Spring
Boot), el API Gateway, el frontend (Angular) y la infraestructura local.

> **Estado: plataforma POS completa y operativa.** Incluye catálogo, pedidos,
> cocina (KDS), cobros, caja, reportes, gestión de usuarios (RBAC), tiempo real,
> bridge de hardware local, configuración, **API pública de integración** y
> documentación OpenAPI/Swagger. **No** incluye facturación electrónica DIAN
> (descartado por decisión del producto).

## Estructura del monorepo

```
platform/
├── pom.xml                  # POM padre (Maven multi-módulo)
├── common/                  # Librería compartida (seguridad/JWT, utilidades)
├── gateway/                 # API Gateway (Spring Cloud Gateway, valida JWT)
├── services/
│   ├── auth-service/        # Identidad: usuarios, roles, permisos, login JWT (8081)
│   ├── catalog-service/     # Catálogo: categorías y productos (8082)
│   ├── orders-service/      # Mesas, pedidos y cocina (KDS) + WebSocket (8083)
│   ├── payments-service/    # Cobros (efectivo, transferencias, mixto) (8084)
│   ├── cash-service/        # Caja: apertura/cierre/arqueo (8085)
│   ├── reporting-service/   # Reportes de ventas (solo lectura) (8086)
│   ├── settings-service/    # Configuración del negocio (8087)
│   └── integration-service/ # API pública de integración (API keys) (8088)
├── pos-bridge/              # Bridge de hardware local (ESC/POS, cajón) (9100)
├── frontend/                # Aplicación Angular (PWA cloud-native)
└── infra/
    └── docker-compose.yml   # PostgreSQL + todos los servicios + gateway
```

## Stack

| Capa        | Tecnología                                                    |
|-------------|---------------------------------------------------------------|
| Backend     | Java 21, Spring Boot 3.3, Spring Cloud Gateway, Spring Security|
| Persistencia| PostgreSQL 16 + Flyway (migraciones)                          |
| Seguridad   | JWT (jjwt), BCrypt                                            |
| Frontend    | Angular 18 (standalone components + signals)                  |
| Build       | Maven (backend), npm/Angular CLI (frontend)                   |
| Contenedores| Docker + Docker Compose                                       |
| CI          | GitHub Actions                                               |

## Cómo ejecutar en local

> Requiere Docker, Java 21 y Node 20+. **Nota:** el sandbox de Kiro no tiene
> acceso a Maven Central/npm, por eso la verificación de build se hace en CI
> (GitHub Actions) o en tu máquina local.

### Backend + base de datos (Docker Compose)

```bash
cd platform/infra
docker compose up --build
```

Esto levanta **PostgreSQL** (`localhost:5432`), los **8 microservicios**
(`8081`–`8088`), el **pos-bridge** (`9100`) y el **gateway** (`localhost:8080`),
que es el único punto de entrada de la API (`/api/**`).

### Frontend (desarrollo)

```bash
cd platform/frontend
npm ci
npm start            # ng serve -> http://localhost:4200 (proxy a localhost:8080)
```

### Credenciales por defecto (seed)

| Usuario | Contraseña | Rol           |
|---------|------------|---------------|
| `admin` | `admin123` | Administrador |

> Cambia la contraseña del admin y el secreto JWT (`JWT_SECRET`) antes de
> cualquier despliegue real.

## Endpoints (Fase 0)

| Método | Ruta (vía gateway)     | Descripción                          | Auth |
|--------|------------------------|--------------------------------------|------|
| POST   | `/api/auth/login`      | Inicia sesión, devuelve un JWT       | No   |
| GET    | `/api/auth/me`         | Datos del usuario autenticado        | Sí   |
| GET    | `/api/auth/health`     | Healthcheck del servicio             | No   |

### Administración de usuarios (auth-service, vía gateway)

| Método | Ruta                              | Descripción                         | Permiso        |
|--------|-----------------------------------|-------------------------------------|----------------|
| GET    | `/api/auth/users`                 | Lista usuarios del tenant           | `users.manage` |
| POST   | `/api/auth/users`                 | Crea usuario                        | `users.manage` |
| PUT    | `/api/auth/users/{id}`            | Actualiza nombre, roles, estado     | `users.manage` |
| POST   | `/api/auth/users/{id}/password`   | Resetea la contraseña (admin)       | `users.manage` |
| DELETE | `/api/auth/users/{id}`            | Elimina usuario (no a sí mismo)     | `users.manage` |
| GET    | `/api/auth/roles`                 | Lista roles disponibles             | `users.manage` |
| POST   | `/api/auth/me/password`           | Cambia la propia contraseña         | Autenticado    |

**Hardening**: contraseñas con BCrypt y mínimo de longitud, los hashes nunca
se exponen, scope por tenant, validación de entrada, y protección contra
auto-bloqueo (no puedes eliminar tu propia cuenta). El cambio de contraseña
propia exige la contraseña actual.

### Catálogo (catalog-service, vía gateway)

| Método | Ruta                          | Descripción                       | Permiso         |
|--------|-------------------------------|-----------------------------------|-----------------|
| GET    | `/api/catalog/categories`     | Lista categorías                  | `catalog.read`  |
| POST   | `/api/catalog/categories`     | Crea categoría                    | `catalog.write` |
| PUT    | `/api/catalog/categories/{id}`| Actualiza categoría               | `catalog.write` |
| DELETE | `/api/catalog/categories/{id}`| Elimina categoría                 | `catalog.write` |
| GET    | `/api/catalog/products`       | Lista productos (`?categoryId=`)  | `catalog.read`  |
| GET    | `/api/catalog/products/{id}`  | Detalle de producto               | `catalog.read`  |
| POST   | `/api/catalog/products`       | Crea producto                     | `catalog.write` |
| PUT    | `/api/catalog/products/{id}`  | Actualiza producto                | `catalog.write` |
| DELETE | `/api/catalog/products/{id}`  | Elimina producto                  | `catalog.write` |

> El catálogo se inicializa con **22 categorías y 147 productos** reales
> migrados de la aplicación actual.

### Pedidos y mesas (orders-service, vía gateway)

| Método | Ruta                              | Descripción                          | Permiso                     |
|--------|-----------------------------------|--------------------------------------|-----------------------------|
| GET    | `/api/orders/tables`              | Lista mesas (con estado ocupada)     | `pos.tables` o `pos.orders` |
| POST   | `/api/orders/tables`              | Crea mesa                            | `pos.tables`                |
| PUT    | `/api/orders/tables/{id}`         | Actualiza mesa                       | `pos.tables`                |
| DELETE | `/api/orders/tables/{id}`         | Elimina mesa                         | `pos.tables`                |
| GET    | `/api/orders`                     | Lista pedidos                        | `pos.orders`                |
| GET    | `/api/orders/{id}`                | Detalle de pedido                    | `pos.orders`                |
| POST   | `/api/orders`                     | Crea pedido (mesa/domicilio/llevar)  | `pos.orders`                |
| PATCH  | `/api/orders/{id}/status`         | Cambia estado                        | `pos.orders`                |
| POST   | `/api/orders/{id}/cancel`         | Cancela pedido                       | `pos.orders`                |
| GET    | `/api/orders/kitchen`             | Pedidos en cocina (KDS)              | `pos.kitchen`               |
| PATCH  | `/api/orders/kitchen/{id}/status` | Avanza estado desde cocina           | `pos.kitchen`               |

> El salón se inicializa con **22 mesas/elementos** reales (Havanas, Mesas,
> Caja, Rappi, DiDi, Llevar, Domicilios) del layout de la app actual.

### Cobros (payments-service, vía gateway)

| Método | Ruta                        | Descripción                                | Permiso    |
|--------|-----------------------------|--------------------------------------------|------------|
| GET    | `/api/payments`             | Lista cobros (`?orderId=` opcional)        | `pos.cash` |
| GET    | `/api/payments/{id}`        | Detalle de cobro                           | `pos.cash` |
| POST   | `/api/payments`             | Registra un cobro de un pedido             | `pos.cash` |

Métodos de pago: **efectivo** (calcula vuelto), **Nequi**, **Bancolombia**,
**Bold**, **Bre-B** y **mixto** (desglose por método). El payments-service
**valida el pedido contra el orders-service** (existencia, que no esté ya
cobrado/cancelado y que el monto cuadre) y lo **marca `PAID` en el backend**
(server-to-server, con un token de servicio interno con permiso `pos.orders`).

### Caja (cash-service, vía gateway)

| Método | Ruta                        | Descripción                                  | Permiso    |
|--------|-----------------------------|----------------------------------------------|------------|
| GET    | `/api/cash/current`         | Caja abierta actual (204 si no hay)          | `pos.cash` |
| POST   | `/api/cash/open`            | Abre caja (fondo inicial)                    | `pos.cash` |
| POST   | `/api/cash/movements`       | Registra ingreso/egreso manual               | `pos.cash` |
| POST   | `/api/cash/close`           | Cierra caja con arqueo (efectivo contado)    | `pos.cash` |
| GET    | `/api/cash/sessions`        | Historial de turnos                          | `pos.cash` |
| GET    | `/api/cash/sessions/{id}`   | Detalle de un turno                          | `pos.cash` |

Arqueo: `esperado = fondo + ingresos − egresos`, `diferencia = contado −
esperado`. Solo se permite **una caja abierta por tenant** (índice único
parcial). Los movimientos son **manuales** (decisión heredada de la app
original).

### Reportes (reporting-service, vía gateway)

| Método | Ruta                          | Descripción                                  | Permiso       |
|--------|-------------------------------|----------------------------------------------|---------------|
| GET    | `/api/reports/sales`          | Ventas del periodo (`?from=&to=`, ISO date)  | `reports.read`|
| GET    | `/api/reports/top-products`   | Productos más vendidos (`?from=&to=&limit=`) | `reports.read`|
| GET    | `/api/reports/by-category`    | Ventas por categoría (`?from=&to=`)          | `reports.read`|

`sales` devuelve total, nº de transacciones, ticket promedio y desglose por
método de pago. `top-products` agrega cantidades e ingresos de pedidos
**cobrados** (`PAID`). Es un servicio de **solo lectura** que consulta los
esquemas `payments` y `orders` directamente. Rango por defecto: el día actual.

### POS Local Bridge (pos-bridge — hardware local)

Servicio que corre en la **máquina del local** y expone una API en `localhost`
para que el frontend hable con el hardware. Imprime en impresoras térmicas
**ESC/POS** y abre el **cajón monedero**.

| Método | Ruta                          | Descripción                          |
|--------|-------------------------------|--------------------------------------|
| POST   | `/api/pos/print/receipt`      | Imprime el recibo (opcional: abre cajón) |
| POST   | `/api/pos/print/kitchen`      | Imprime la comanda de cocina         |
| POST   | `/api/pos/cash-drawer/open`   | Abre el cajón monedero               |
| GET    | `/api/pos/status`             | Transporte de impresora configurado  |

- **Transporte de impresora enchufable** (`PRINTER_TYPE`): `noop` (sin
  hardware, registra en log) o `network` (impresora de red, socket TCP 9100).
- Seguridad JWT opcional (`POS_SECURITY_ENABLED`, por defecto `true`; usa el
  mismo secreto que la nube). Para instalaciones locales aisladas se puede
  desactivar.
- El frontend lo usa de forma **best-effort**: imprime recibo + abre cajón al
  cobrar en efectivo, e imprime la comanda al enviar un pedido. Si el bridge
  no está disponible, la app sigue funcionando.

### Tiempo real (WebSocket / STOMP)

El `orders-service` expone un endpoint **STOMP sobre WebSocket** en `/ws`
(enrutado por el gateway) y publica eventos en `/topic/orders` cuando un
pedido se **crea**, **cambia de estado** o se **cancela**. Las pantallas de
**Cocina** y **Mesas** se suscriben y se **actualizan en vivo** entre
dispositivos. El JWT se valida en el frame `CONNECT` de STOMP.

### Configuración del negocio (settings-service, vía gateway)

| Método | Ruta                | Descripción                                   | Permiso          |
|--------|---------------------|-----------------------------------------------|------------------|
| GET    | `/api/settings`     | Configuración del tenant (crea por defecto)   | Autenticado      |
| PUT    | `/api/settings`     | Actualiza datos, parámetros de venta, impresión | `settings.manage`|

Incluye datos del negocio (nombre, NIT, dirección), parámetros de venta
(moneda, % impuesto/servicio/propina, pie de recibo) y configuración de
impresión (transporte, host/puerto de impresoras de caja y cocina).

### API pública de integración (integration-service, vía gateway)

Permite a software externo (e-commerce, pasarelas) consumir la plataforma
mediante **API keys** con scopes granulares.

**Gestión de keys** (JWT + permiso `integrations.manage`):

| Método | Ruta                          | Descripción                                  |
|--------|-------------------------------|----------------------------------------------|
| GET    | `/api/integration/keys`       | Lista las API keys del tenant                |
| POST   | `/api/integration/keys`       | Crea una key (el secreto se muestra una vez) |
| DELETE | `/api/integration/keys/{id}`  | Revoca una key                               |
| GET    | `/api/integration/keys/scopes`| Scopes disponibles                           |

**API pública v1** (header `X-Api-Key: prefijo.secreto`, por scope):

| Método | Ruta                            | Descripción                  | Scope          |
|--------|---------------------------------|------------------------------|----------------|
| GET    | `/api/integration/v1/catalog`   | Lista el catálogo            | `catalog:read` |
| POST   | `/api/integration/v1/orders`    | Crea un pedido externo       | `orders:write` |
| GET    | `/api/integration/v1/orders/{id}`| Estado de un pedido         | `orders:read`  |

Solo se almacena el prefijo público y el **hash BCrypt** del secreto. El
servicio actúa de fachada llamando server-to-server a catálogo y pedidos.

## Documentación de la API (OpenAPI / Swagger)

Cada microservicio MVC expone su documentación interactiva con **springdoc**:

- **Swagger UI:** `http://localhost:<puerto>/swagger-ui.html`
- **OpenAPI JSON:** `http://localhost:<puerto>/v3/api-docs`

| Servicio            | Swagger UI                          |
|---------------------|-------------------------------------|
| auth-service        | http://localhost:8081/swagger-ui.html |
| catalog-service     | http://localhost:8082/swagger-ui.html |
| orders-service      | http://localhost:8083/swagger-ui.html |
| payments-service    | http://localhost:8084/swagger-ui.html |
| cash-service        | http://localhost:8085/swagger-ui.html |
| reporting-service   | http://localhost:8086/swagger-ui.html |
| settings-service    | http://localhost:8087/swagger-ui.html |
| integration-service | http://localhost:8088/swagger-ui.html |

En cada Swagger UI puedes pulsar **Authorize** y pegar un JWT (`Bearer`) para
probar endpoints autenticados. El `integration-service` además permite
autorizar con `X-Api-Key` para la API pública `v1`.

## Roadmap

- ✅ **Fase 0:** cimientos — gateway, auth, PostgreSQL, CI, login Angular.
- ✅ **Fase 1:** core POS — catálogo, pedidos/mesas, cocina (KDS).
- ✅ **Fase 2:** cobros + caja + reportes + integridad de datos.
- ✅ **Fase 3:** POS local bridge (impresoras ESC/POS, cajón monedero).
- ✅ **Fase 4:** tiempo real (WebSocket/STOMP) en cocina y mesas.
- ✅ **Fase 5:** gestión de usuarios desde la UI + hardening RBAC.
- ✅ **Fase 6:** UX del salón (plano visual con mesas arrastrables).
- ✅ **Fase 7:** configuración del sistema (settings-service).
- ✅ **Fase 8:** API pública de integración (e-commerce/pasarelas).
- ✅ **Fase 9:** documentación de la API (OpenAPI/Swagger).
- ⏳ **Siguiente:** observabilidad (métricas/logs), tests E2E, cutover.
