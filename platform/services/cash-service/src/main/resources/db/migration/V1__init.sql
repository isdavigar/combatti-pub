-- ============================================================
-- Combatti cash-service - esquema inicial (caja / turnos)
-- Tablas en el esquema 'cash'.
-- ============================================================

CREATE TABLE cash_sessions (
    id             BIGSERIAL PRIMARY KEY,
    tenant_id      VARCHAR(64)   NOT NULL DEFAULT 'default',
    status         VARCHAR(10)   NOT NULL DEFAULT 'OPEN',
    opening_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    opened_by      VARCHAR(120),
    opened_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    closed_by      VARCHAR(120),
    closed_at      TIMESTAMPTZ,
    counted_cash   NUMERIC(12,2),
    expected_cash  NUMERIC(12,2),
    difference     NUMERIC(12,2),
    notes          VARCHAR(500)
);

CREATE TABLE cash_movements (
    id         BIGSERIAL PRIMARY KEY,
    session_id BIGINT        NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
    tenant_id  VARCHAR(64)   NOT NULL DEFAULT 'default',
    type       VARCHAR(10)   NOT NULL,
    amount     NUMERIC(12,2) NOT NULL,
    concept    VARCHAR(300),
    created_by VARCHAR(120),
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cash_sessions_tenant ON cash_sessions (tenant_id, status);
CREATE INDEX idx_cash_movements_session ON cash_movements (session_id);

-- Garantiza una sola caja abierta por tenant.
CREATE UNIQUE INDEX uq_cash_one_open_per_tenant
    ON cash_sessions (tenant_id)
    WHERE status = 'OPEN';
