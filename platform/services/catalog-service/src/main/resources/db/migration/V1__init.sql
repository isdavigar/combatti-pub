-- ============================================================
-- Combatti catalog-service - esquema inicial (menú)
-- Las tablas se crean en el esquema 'catalog' (configurado en Flyway).
-- ============================================================

CREATE TABLE categories (
    id            BIGSERIAL PRIMARY KEY,
    tenant_id     VARCHAR(64)  NOT NULL DEFAULT 'default',
    name          VARCHAR(120) NOT NULL,
    display_order INT          NOT NULL DEFAULT 0,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_categories_tenant_name UNIQUE (tenant_id, name)
);

CREATE TABLE products (
    id            BIGSERIAL PRIMARY KEY,
    tenant_id     VARCHAR(64)   NOT NULL DEFAULT 'default',
    name          VARCHAR(180)  NOT NULL,
    description   VARCHAR(1000),
    price         NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock_managed BOOLEAN       NOT NULL DEFAULT FALSE,
    min_stock     INT           NOT NULL DEFAULT 0,
    active        BOOLEAN       NOT NULL DEFAULT TRUE,
    category_id   BIGINT        NOT NULL REFERENCES categories(id),
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_tenant ON categories (tenant_id);
CREATE INDEX idx_products_tenant   ON products (tenant_id);
CREATE INDEX idx_products_category ON products (category_id);
