-- Esquemas y tablas mínimas que en producción son propiedad de payments-service
-- y orders-service. Aquí se crean solo para el test de integración (autocontenido).

CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS orders;

CREATE TABLE IF NOT EXISTS payments.payments (
    id         BIGSERIAL PRIMARY KEY,
    tenant_id  VARCHAR(64)   NOT NULL,
    method     VARCHAR(20)   NOT NULL,
    amount     NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders.orders (
    id         BIGINT PRIMARY KEY,
    tenant_id  VARCHAR(64) NOT NULL,
    status     VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders.order_items (
    id           BIGSERIAL PRIMARY KEY,
    order_id     BIGINT        NOT NULL,
    product_name VARCHAR(180)  NOT NULL,
    quantity     INT           NOT NULL,
    line_total   NUMERIC(12,2) NOT NULL
);
