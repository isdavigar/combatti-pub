-- Datos de prueba (con marca de tiempo actual) para el reporting-service.

INSERT INTO payments.payments (tenant_id, method, amount, created_at) VALUES
    ('default', 'CASH',  65000, NOW()),
    ('default', 'NEQUI', 18000, NOW());

INSERT INTO orders.orders (id, tenant_id, status, created_at) VALUES
    (1, 'default', 'PAID', NOW());

INSERT INTO orders.order_items (order_id, product_name, quantity, line_total) VALUES
    (1, 'Hamburguesa', 3, 54000),
    (1, 'Limonada',    2, 10000);
