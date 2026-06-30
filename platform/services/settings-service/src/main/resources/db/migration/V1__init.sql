-- ============================================================
-- Combatti settings-service - esquema inicial (configuración).
-- Una fila por tenant en el esquema 'settings'.
-- ============================================================

CREATE TABLE tenant_settings (
    id                     BIGSERIAL PRIMARY KEY,
    tenant_id              VARCHAR(64)   NOT NULL UNIQUE,
    restaurant_name        VARCHAR(160)  NOT NULL DEFAULT 'Combatti',
    tax_id                 VARCHAR(40),
    address                VARCHAR(240),
    phone                  VARCHAR(40),
    email                  VARCHAR(120),
    currency               VARCHAR(8)    NOT NULL DEFAULT 'COP',
    tax_rate_percent       NUMERIC(5,2)  NOT NULL DEFAULT 0,
    service_charge_percent NUMERIC(5,2)  NOT NULL DEFAULT 0,
    tip_suggested_percent  NUMERIC(5,2)  NOT NULL DEFAULT 10,
    receipt_footer         VARCHAR(300),
    printer_transport      VARCHAR(16)   NOT NULL DEFAULT 'noop',
    receipt_printer_host   VARCHAR(120),
    receipt_printer_port   INTEGER,
    kitchen_printer_host   VARCHAR(120),
    kitchen_printer_port   INTEGER,
    updated_by             VARCHAR(120),
    updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Fila por defecto para el tenant principal.
INSERT INTO tenant_settings (tenant_id, restaurant_name, currency, receipt_footer)
VALUES ('default', 'Combatti', 'COP', '¡Gracias por tu visita!');
