-- ============================================================
-- Combatti auth-service - V2
-- Permiso para administrar la API pública de integración (API keys).
-- ============================================================

INSERT INTO permissions (code, description) VALUES
    ('integrations.manage', 'Administrar API keys e integraciones externas');

-- Concedido al Administrador (los demás roles no lo reciben).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'integrations.manage'
WHERE r.name = 'Administrador';
