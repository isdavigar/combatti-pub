-- ============================================================
-- Combatti orders-service - esquema inicial (mesas, pedidos, items)
-- Las tablas se crean en el esquema 'orders' (configurado en Flyway).
-- ============================================================

CREATE TABLE restaurant_tables (
    id         BIGSERIAL PRIMARY KEY,
    tenant_id  VARCHAR(64)  NOT NULL DEFAULT 'default',
    name       VARCHAR(120) NOT NULL,
    kind       VARCHAR(40)  NOT NULL DEFAULT 'Mesa',
    icon       VARCHAR(80),
    pos_x      INT          NOT NULL DEFAULT 0,
    pos_y      INT          NOT NULL DEFAULT 0,
    size       INT          NOT NULL DEFAULT 100,
    sort_order INT          NOT NULL DEFAULT 0,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_tables_tenant_name UNIQUE (tenant_id, name)
);

CREATE TABLE orders (
    id               BIGSERIAL PRIMARY KEY,
    tenant_id        VARCHAR(64)   NOT NULL DEFAULT 'default',
    type             VARCHAR(20)   NOT NULL,
    channel          VARCHAR(20)   NOT NULL DEFAULT 'LOCAL',
    status           VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    table_id         BIGINT        REFERENCES restaurant_tables(id),
    customer_name    VARCHAR(150),
    customer_phone   VARCHAR(40),
    customer_address VARCHAR(300),
    notes            VARCHAR(500),
    subtotal         NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id           BIGSERIAL PRIMARY KEY,
    order_id     BIGINT        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id   BIGINT,
    product_name VARCHAR(180)  NOT NULL,
    unit_price   NUMERIC(12,2) NOT NULL DEFAULT 0,
    quantity     INT           NOT NULL DEFAULT 1,
    notes        VARCHAR(300),
    line_total   NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_tables_tenant  ON restaurant_tables (tenant_id);
CREATE INDEX idx_orders_tenant  ON orders (tenant_id);
CREATE INDEX idx_orders_status  ON orders (tenant_id, status);
CREATE INDEX idx_order_items_order ON order_items (order_id);
