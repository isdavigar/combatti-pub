-- ============================================================
-- Seed de mesas/elementos del salon (22) desde DEFAULT_TABLE_LAYOUT.
-- ============================================================

INSERT INTO restaurant_tables (tenant_id, name, kind, icon, pos_x, pos_y, size, sort_order, active) VALUES
    ('default', 'Havana 10', 'Mesa', 'fa-solid fa-champagne-glasses', 60, 20, 118, 1, TRUE),
    ('default', 'Havana 11', 'Mesa', 'fa-solid fa-champagne-glasses', 270, 20, 118, 2, TRUE),
    ('default', 'Havana 12', 'Mesa', 'fa-solid fa-champagne-glasses', 480, 20, 118, 3, TRUE),
    ('default', 'Mesa 5', 'Mesa', 'fa-solid fa-table-cells-large', 720, 20, 118, 4, TRUE),
    ('default', 'Havana 13', 'Mesa', 'fa-solid fa-champagne-glasses', 60, 200, 118, 5, TRUE),
    ('default', 'Havana 14', 'Mesa', 'fa-solid fa-champagne-glasses', 270, 200, 118, 6, TRUE),
    ('default', 'Havana 15', 'Mesa', 'fa-solid fa-champagne-glasses', 480, 200, 118, 7, TRUE),
    ('default', 'Mesa 6', 'Mesa', 'fa-solid fa-table-cells-large', 720, 200, 118, 8, TRUE),
    ('default', 'Mesa 4', 'Mesa', 'fa-solid fa-table-cells-large', 960, 200, 118, 9, TRUE),
    ('default', 'Mesa 7', 'Mesa', 'fa-solid fa-table-cells-large', 720, 400, 118, 10, TRUE),
    ('default', 'Mesa 3', 'Mesa', 'fa-solid fa-table-cells-large', 960, 400, 118, 11, TRUE),
    ('default', 'ESPECIAL CLIENTES', 'Especial', 'fa-solid fa-users-line', 60, 500, 118, 12, TRUE),
    ('default', 'ESPECIAL CLIENTES 2', 'Especial', 'fa-solid fa-users-line', 270, 500, 118, 13, TRUE),
    ('default', 'Mesa 8', 'Mesa', 'fa-solid fa-table-cells-large', 720, 600, 118, 14, TRUE),
    ('default', 'Mesa 2', 'Mesa', 'fa-solid fa-table-cells-large', 960, 600, 118, 15, TRUE),
    ('default', 'CAJA', 'Caja', 'fa-solid fa-box-archive', 1200, 600, 118, 16, TRUE),
    ('default', 'Mesa 9', 'Mesa', 'fa-solid fa-table-cells-large', 720, 800, 118, 17, TRUE),
    ('default', 'Mesa 1', 'Mesa', 'fa-solid fa-table-cells-large', 960, 800, 118, 18, TRUE),
    ('default', 'Rappi', 'Rappi', 'fa-solid fa-motorcycle', 270, 1000, 118, 19, TRUE),
    ('default', 'DiDi', 'Didi', 'fa-solid fa-motorcycle', 520, 1000, 118, 20, TRUE),
    ('default', 'LLEVAR', 'Llevar', 'fa-solid fa-bag-shopping', 770, 1000, 118, 21, TRUE),
    ('default', 'Domicilios', 'Domicilio', 'fa-solid fa-truck-fast', 1020, 1000, 118, 22, TRUE);
