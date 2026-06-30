-- ============================================================
-- Combatti integration-service - esquema inicial.
-- API keys para la API pública de integración (e-commerce/pasarelas).
-- ============================================================

CREATE TABLE api_key (
    id           BIGSERIAL PRIMARY KEY,
    tenant_id    VARCHAR(64)  NOT NULL,
    name         VARCHAR(120) NOT NULL,
    key_prefix   VARCHAR(32)  NOT NULL UNIQUE,
    secret_hash  VARCHAR(100) NOT NULL,
    scopes       VARCHAR(300) NOT NULL DEFAULT '',
    active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_by   VARCHAR(120),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_api_key_tenant ON api_key (tenant_id);
