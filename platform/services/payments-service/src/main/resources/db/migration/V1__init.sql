-- ============================================================
-- Combatti payments-service - esquema inicial (cobros)
-- Tablas en el esquema 'payments'.
-- ============================================================

CREATE TABLE payments (
    id            BIGSERIAL PRIMARY KEY,
    tenant_id     VARCHAR(64)   NOT NULL DEFAULT 'default',
    order_id      BIGINT        NOT NULL,
    method        VARCHAR(20)   NOT NULL,
    amount        NUMERIC(12,2) NOT NULL,
    cash_received NUMERIC(12,2),
    change_given  NUMERIC(12,2),
    notes         VARCHAR(300),
    created_by    VARCHAR(120),
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_splits (
    id         BIGSERIAL PRIMARY KEY,
    payment_id BIGINT        NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    method     VARCHAR(20)   NOT NULL,
    amount     NUMERIC(12,2) NOT NULL
);

CREATE INDEX idx_payments_tenant ON payments (tenant_id);
CREATE INDEX idx_payments_order  ON payments (tenant_id, order_id);
CREATE INDEX idx_payment_splits_payment ON payment_splits (payment_id);
