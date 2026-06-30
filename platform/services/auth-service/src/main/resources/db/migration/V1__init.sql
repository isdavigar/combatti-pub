-- ============================================================
-- Combatti auth-service - esquema inicial (RBAC multi-tenant)
-- ============================================================

CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(200)
);

CREATE TABLE permissions (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(80)  NOT NULL UNIQUE,
    description VARCHAR(200)
);

CREATE TABLE role_permissions (
    role_id       BIGINT NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    tenant_id     VARCHAR(64)  NOT NULL DEFAULT 'default',
    username      VARCHAR(80)  NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    display_name  VARCHAR(120) NOT NULL,
    enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_tenant_username UNIQUE (tenant_id, username)
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_users_tenant ON users (tenant_id);

-- ------------------------------------------------------------
-- Seed: permisos base (reflejan los módulos del POS actual)
-- ------------------------------------------------------------
INSERT INTO permissions (code, description) VALUES
    ('pos.tables',     'Gestionar mesas'),
    ('pos.orders',     'Gestionar pedidos y comandas'),
    ('pos.kitchen',    'Vista y gestión de cocina (KDS)'),
    ('pos.cash',       'Operar la caja (apertura, cierre, movimientos)'),
    ('catalog.read',   'Ver el menú y el catálogo'),
    ('catalog.write',  'Editar productos, categorías e inventario'),
    ('reports.read',   'Ver reportes y dashboards'),
    ('users.manage',   'Administrar usuarios y permisos'),
    ('settings.manage','Administrar configuración del sistema');

-- ------------------------------------------------------------
-- Seed: roles
-- ------------------------------------------------------------
INSERT INTO roles (name, description) VALUES
    ('Administrador', 'Acceso total al sistema'),
    ('Cajero',        'Operación de caja y cobro'),
    ('Mesero',        'Toma de pedidos y mesas'),
    ('Cocina',        'Vista de cocina');

-- ------------------------------------------------------------
-- Seed: asignación de permisos por rol
-- ------------------------------------------------------------
-- Administrador: todos los permisos
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Administrador';

-- Cajero: caja, pedidos, catálogo (lectura), reportes
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('pos.cash', 'pos.orders', 'catalog.read', 'reports.read')
WHERE r.name = 'Cajero';

-- Mesero: mesas, pedidos, catálogo (lectura)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('pos.tables', 'pos.orders', 'catalog.read')
WHERE r.name = 'Mesero';

-- Cocina: solo cocina
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('pos.kitchen')
WHERE r.name = 'Cocina';
