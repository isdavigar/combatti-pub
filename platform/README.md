# Combatti Platform

Migración del POS monolítico (`Restaurante.html`) a una arquitectura profesional
cloud-native. Este monorepo contiene el backend de microservicios (Java / Spring
Boot), el API Gateway, el frontend (Angular) y la infraestructura local.

> **Alcance actual: Fase 0 — Cimientos.** No incluye facturación electrónica DIAN
> (descartado por decisión del producto).

## Estructura del monorepo

```
platform/
├── pom.xml                  # POM padre (Maven multi-módulo)
├── common/                  # Librería compartida (seguridad/JWT, utilidades)
├── gateway/                 # API Gateway (Spring Cloud Gateway)
├── services/
│   └── auth-service/        # Identidad: usuarios, roles, permisos, login JWT
├── frontend/                # Aplicación Angular (PWA cloud-native)
└── infra/
    └── docker-compose.yml   # PostgreSQL + gateway + auth-service
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

Esto levanta:
- PostgreSQL en `localhost:5432`
- `auth-service` en `localhost:8081`
- `gateway` en `localhost:8080`

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

## Roadmap

- **Fase 0 (actual):** cimientos — gateway, auth, PostgreSQL, CI, login Angular.
- **Fase 1:** core POS — catálogo, pedidos/mesas, caja, tiempo real.
- **Fase 2:** pagos (pasarelas) + reportes + notificaciones.
- **Fase 3:** POS local bridge (impresoras, cajón, lector de barras, KDS).
- **Fase 4:** API pública de integración + e-commerce/pasarelas.
- **Fase 5:** migración de datos y cutover.
