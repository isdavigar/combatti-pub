-- ============================================================
-- Seed del catalogo: 22 categorias y 147 productos.
-- Generado automaticamente desde el catalogo de la app actual (INITIAL_PRODUCTS).
-- ============================================================

INSERT INTO categories (tenant_id, name, display_order, active) VALUES
    ('default', 'Combatti Grill', 1, TRUE),
    ('default', 'Lasana', 2, TRUE),
    ('default', 'Pastas', 3, TRUE),
    ('default', 'Combatti Kids', 4, TRUE),
    ('default', 'Hamburguesas', 5, TRUE),
    ('default', 'Hot Dogs', 6, TRUE),
    ('default', 'Salchipapas', 7, TRUE),
    ('default', 'Pizza', 8, TRUE),
    ('default', 'Sandwich', 9, TRUE),
    ('default', 'Chuzos', 10, TRUE),
    ('default', 'Mazorcas', 11, TRUE),
    ('default', 'Patacones', 12, TRUE),
    ('default', 'Bebida', 13, TRUE),
    ('default', 'Jugos Naturales', 14, TRUE),
    ('default', 'Cervezas', 15, TRUE),
    ('default', 'Adiciones', 16, TRUE),
    ('default', 'Adicionales', 17, TRUE),
    ('default', 'Almuerzos', 18, TRUE),
    ('default', 'Bowls', 19, TRUE),
    ('default', 'Entradas', 20, TRUE),
    ('default', 'Picadas', 21, TRUE),
    ('default', 'Bebidas', 22, TRUE);

INSERT INTO products (tenant_id, name, description, price, stock_managed, min_stock, active, category_id)
SELECT 'default', 'Pechuga de Pollo 300gr', 'Jugosa pechuga de pollo a la parrilla.', 30000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Combatti Grill'
UNION ALL
SELECT 'default', 'Lomo de cerdo 250gr', 'Jugoso lomo de cerdo a la parrilla.', 28000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Combatti Grill'
UNION ALL
SELECT 'default', 'Churrasco de res 250gr', 'Jugoso corte de res a la parrilla.', 33000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Combatti Grill'
UNION ALL
SELECT 'default', 'Pechugas de pollo gratinada 300gr', 'Pechuga de pollo a la parrilla con queso mozzarella fundido.', 33000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Combatti Grill'
UNION ALL
SELECT 'default', 'BBQ Ribs 300gr aprox.', 'Tiernas costillas de cerdo marinadas en salsa BBQ artesanal.', 36000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Combatti Grill'
UNION ALL
SELECT 'default', 'Roll de Pollo', 'Pechuga de pollo rellena de jamon y queso mozzarella banada en salsa bechamel con tocineta.', 37000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Combatti Grill'
UNION ALL
SELECT 'default', 'Baby Beef 250gr', 'Tierno corte del centro del lomo fino a la parrilla.', 38000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Combatti Grill'
UNION ALL
SELECT 'default', 'Lasana de pollo', NULL, 27000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Lasana'
UNION ALL
SELECT 'default', 'Lasana bolonesa', NULL, 30000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Lasana'
UNION ALL
SELECT 'default', 'Lasana mixta', NULL, 34000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Lasana'
UNION ALL
SELECT 'default', 'Pasta Carbonara', NULL, 27000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Pastas'
UNION ALL
SELECT 'default', 'Pasta bolonesa', NULL, 30000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Pastas'
UNION ALL
SELECT 'default', 'Pasta marinera', NULL, 35000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Pastas'
UNION ALL
SELECT 'default', 'Fajita de pechuga apanada', 'Fajita de pechuga apanada con papa a la francesa y salsa de tomate.', 17000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Combatti Kids'
UNION ALL
SELECT 'default', 'Salchipapa kids', 'Papa a la francesa con salchicha americana y salsa de tomate.', 16000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Combatti Kids'
UNION ALL
SELECT 'default', 'Classic Burger', NULL, 22000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hamburguesas'
UNION ALL
SELECT 'default', 'Chiken Burger', NULL, 22000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hamburguesas'
UNION ALL
SELECT 'default', 'Sweet Costena', NULL, 28000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hamburguesas'
UNION ALL
SELECT 'default', 'La Gomela', NULL, 30000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hamburguesas'
UNION ALL
SELECT 'default', 'La Menor', NULL, 32000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hamburguesas'
UNION ALL
SELECT 'default', 'La Mistica', NULL, 32000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hamburguesas'
UNION ALL
SELECT 'default', 'La Black Pork', NULL, 34000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hamburguesas'
UNION ALL
SELECT 'default', 'La Ranger', NULL, 36000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hamburguesas'
UNION ALL
SELECT 'default', 'La Serrano', NULL, 36000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hamburguesas'
UNION ALL
SELECT 'default', 'La Propia', NULL, 38000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hamburguesas'
UNION ALL
SELECT 'default', 'Perro Clasico', NULL, 10000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hot Dogs'
UNION ALL
SELECT 'default', 'Perro Gemelo', NULL, 13000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hot Dogs'
UNION ALL
SELECT 'default', 'Perro Napolitano', NULL, 16000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hot Dogs'
UNION ALL
SELECT 'default', 'Perro Escoces', NULL, 17000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hot Dogs'
UNION ALL
SELECT 'default', 'Perro Americano', NULL, 17000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hot Dogs'
UNION ALL
SELECT 'default', 'Perro Suizo', NULL, 18000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hot Dogs'
UNION ALL
SELECT 'default', 'Perro Espanol', NULL, 19000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hot Dogs'
UNION ALL
SELECT 'default', 'Perro Starly', NULL, 22000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hot Dogs'
UNION ALL
SELECT 'default', 'Perro LeBron', NULL, 22000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hot Dogs'
UNION ALL
SELECT 'default', 'Perro El Rocky', NULL, 22000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hot Dogs'
UNION ALL
SELECT 'default', 'Perro Braulio', NULL, 30000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hot Dogs'
UNION ALL
SELECT 'default', 'Perro Pity Leon', NULL, 30000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hot Dogs'
UNION ALL
SELECT 'default', 'Perro El General', NULL, 32000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Hot Dogs'
UNION ALL
SELECT 'default', 'Salchipapa Sencilla', NULL, 19000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Salchipapas'
UNION ALL
SELECT 'default', 'Salchipapa Costena', NULL, 24000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Salchipapas'
UNION ALL
SELECT 'default', 'Salchipapa La Pudosky', NULL, 26000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Salchipapas'
UNION ALL
SELECT 'default', 'Salchipapa Suiza', NULL, 27000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Salchipapas'
UNION ALL
SELECT 'default', 'Salchipapa Chicken', NULL, 28000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Salchipapas'
UNION ALL
SELECT 'default', 'Salchipapa Mix', NULL, 28000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Salchipapas'
UNION ALL
SELECT 'default', 'Salchipapa Crispy', NULL, 30000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Salchipapas'
UNION ALL
SELECT 'default', 'Salchipapa La Calena', NULL, 30000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Salchipapas'
UNION ALL
SELECT 'default', 'Salchipapa La Granjera', NULL, 30000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Salchipapas'
UNION ALL
SELECT 'default', 'Salchipapa La Combi', NULL, 32000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Salchipapas'
UNION ALL
SELECT 'default', 'Salvada La J2', NULL, 55000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Salchipapas'
UNION ALL
SELECT 'default', 'Pizza Tradicional', NULL, 22000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Pizza'
UNION ALL
SELECT 'default', 'Pizza Hawaiana', NULL, 25000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Pizza'
UNION ALL
SELECT 'default', 'Pizza Pepperoni', NULL, 25000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Pizza'
UNION ALL
SELECT 'default', 'Pizza La Margarita', NULL, 27000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Pizza'
UNION ALL
SELECT 'default', 'Pizza La Malefica', NULL, 28000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Pizza'
UNION ALL
SELECT 'default', 'Pizza La Espanola', NULL, 28000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Pizza'
UNION ALL
SELECT 'default', 'Pizza La Pull Pork', NULL, 30000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Pizza'
UNION ALL
SELECT 'default', 'Pizza Ana Claret', NULL, 30000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Pizza'
UNION ALL
SELECT 'default', 'Pizza La Carnivora', NULL, 32000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Pizza'
UNION ALL
SELECT 'default', 'Sandwich Classic', NULL, 18000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Sandwich'
UNION ALL
SELECT 'default', 'Sandwich Pork', NULL, 20000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Sandwich'
UNION ALL
SELECT 'default', 'Sandwich Gaucho', NULL, 23000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Sandwich'
UNION ALL
SELECT 'default', 'Sandwich Boom Mix', NULL, 25000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Sandwich'
UNION ALL
SELECT 'default', 'Chuzo de Pollo', NULL, 25000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Chuzos'
UNION ALL
SELECT 'default', 'Chuzo Mixto', NULL, 28000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Chuzos'
UNION ALL
SELECT 'default', 'Chuzo Suizo', NULL, 29000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Chuzos'
UNION ALL
SELECT 'default', 'Chuzo 4 Carne', NULL, 33000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Chuzos'
UNION ALL
SELECT 'default', 'Chuzo Bimboleto', NULL, 36000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Chuzos'
UNION ALL
SELECT 'default', 'Mazorca de pollo', NULL, 23000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Mazorcas'
UNION ALL
SELECT 'default', 'Mazorca mixta', NULL, 26000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Mazorcas'
UNION ALL
SELECT 'default', 'Mazorca 4 Carne', NULL, 29000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Mazorcas'
UNION ALL
SELECT 'default', 'Mazorca la cataleya', NULL, 32000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Mazorcas'
UNION ALL
SELECT 'default', 'Patacon de Pollo', NULL, 25000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Patacones'
UNION ALL
SELECT 'default', 'Patacon Mixto', NULL, 28000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Patacones'
UNION ALL
SELECT 'default', 'Patacon 4 Carnes', NULL, 31000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Patacones'
UNION ALL
SELECT 'default', 'Patacon El Makia', NULL, 33000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Patacones'
UNION ALL
SELECT 'default', 'Patacon El Marino', NULL, 36000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Patacones'
UNION ALL
SELECT 'default', 'Coca Cola pet 400ml', NULL, 6000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bebida'
UNION ALL
SELECT 'default', 'Kola Roman pet 400ml', NULL, 6000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bebida'
UNION ALL
SELECT 'default', 'Quatro pet 400ml', NULL, 6000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bebida'
UNION ALL
SELECT 'default', 'Jugo Hit personal', NULL, 6000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bebida'
UNION ALL
SELECT 'default', 'Soda Bretana', NULL, 6000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bebida'
UNION ALL
SELECT 'default', 'Soda Hatsu', NULL, 7000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bebida'
UNION ALL
SELECT 'default', 'Ginger Canada Dry', NULL, 6000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bebida'
UNION ALL
SELECT 'default', 'Botella de Agua 600ml', NULL, 4000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bebida'
UNION ALL
SELECT 'default', 'Ginger Schweppes', NULL, 6000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bebida'
UNION ALL
SELECT 'default', 'Cerezada', NULL, 8000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Jugos Naturales'
UNION ALL
SELECT 'default', 'Coco', NULL, 8000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Jugos Naturales'
UNION ALL
SELECT 'default', 'Mandarina', NULL, 8000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Jugos Naturales'
UNION ALL
SELECT 'default', 'Fresa', NULL, 8000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Jugos Naturales'
UNION ALL
SELECT 'default', 'Limonada Natural', NULL, 8000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Jugos Naturales'
UNION ALL
SELECT 'default', 'Limonada Yerba Buena', NULL, 8000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Jugos Naturales'
UNION ALL
SELECT 'default', 'Stella Artois', NULL, 9000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Cervezas'
UNION ALL
SELECT 'default', 'Coronita', NULL, 8000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Cervezas'
UNION ALL
SELECT 'default', 'BBC', NULL, 11000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Cervezas'
UNION ALL
SELECT 'default', 'Papa Francesa', NULL, 8000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adiciones'
UNION ALL
SELECT 'default', 'Tocineta', NULL, 5000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adiciones'
UNION ALL
SELECT 'default', 'Queso Mozzarella', NULL, 5000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adiciones'
UNION ALL
SELECT 'default', 'Michelada', NULL, 1500, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adicionales'
UNION ALL
SELECT 'default', 'Adicional de carne', NULL, 5000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adicionales'
UNION ALL
SELECT 'default', 'Adicional de cerdo', NULL, 5000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adicionales'
UNION ALL
SELECT 'default', 'Adicional de pepperoni', NULL, 5000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adicionales'
UNION ALL
SELECT 'default', 'Adicional de pollo', NULL, 6000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adicionales'
UNION ALL
SELECT 'default', 'Adicional de suiza', NULL, 7000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adicionales'
UNION ALL
SELECT 'default', 'Aros de cebolla', NULL, 5000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adicionales'
UNION ALL
SELECT 'default', 'Borde de queso', NULL, 5000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adicionales'
UNION ALL
SELECT 'default', 'Cigarros Luky', NULL, 9500, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adicionales'
UNION ALL
SELECT 'default', 'Deditos de mozzarella', NULL, 16000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adicionales'
UNION ALL
SELECT 'default', 'Fritos Albeiro', NULL, 7000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adicionales'
UNION ALL
SELECT 'default', 'Huevo frito', NULL, 2000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adicionales'
UNION ALL
SELECT 'default', 'Mini pechuga asada', NULL, 6000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adicionales'
UNION ALL
SELECT 'default', 'Papas enchuladas', NULL, 10000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adicionales'
UNION ALL
SELECT 'default', 'Adicional de arroz', NULL, 2500, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Adicionales'
UNION ALL
SELECT 'default', 'Almuerzo Luisa especial', NULL, 17000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Almuerzos'
UNION ALL
SELECT 'default', 'Almuerzo pechuga asada', NULL, 19000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Almuerzos'
UNION ALL
SELECT 'default', 'Almuerzo Santiago', NULL, 22000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Almuerzos'
UNION ALL
SELECT 'default', 'Carne salteada', NULL, 19000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Almuerzos'
UNION ALL
SELECT 'default', 'Carne asada', NULL, 19000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Almuerzos'
UNION ALL
SELECT 'default', 'Cerdo asado', NULL, 19000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Almuerzos'
UNION ALL
SELECT 'default', 'Cerdo salteado', NULL, 19000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Almuerzos'
UNION ALL
SELECT 'default', 'Chuleta', NULL, 19000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Almuerzos'
UNION ALL
SELECT 'default', 'Pasta corta bolonesa', NULL, 19000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Almuerzos'
UNION ALL
SELECT 'default', 'Pasta corta carbonara', NULL, 19000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Almuerzos'
UNION ALL
SELECT 'default', 'Pechuga bechamel', NULL, 19000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Almuerzos'
UNION ALL
SELECT 'default', 'Pechuga gratinada', NULL, 19000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Almuerzos'
UNION ALL
SELECT 'default', 'Pollo bechamel', NULL, 19000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Almuerzos'
UNION ALL
SELECT 'default', 'Pollo salteado', NULL, 19000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Almuerzos'
UNION ALL
SELECT 'default', 'Bowl mixto', NULL, 18000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bowls'
UNION ALL
SELECT 'default', 'Bowl carne', NULL, 18000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bowls'
UNION ALL
SELECT 'default', 'Bowl cerdo', NULL, 18000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bowls'
UNION ALL
SELECT 'default', 'Bowl pollo', NULL, 18000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bowls'
UNION ALL
SELECT 'default', 'Adicional de patacon', NULL, 5000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Entradas'
UNION ALL
SELECT 'default', 'Bollo chorizo', NULL, 10000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Entradas'
UNION ALL
SELECT 'default', 'Bollo HAVANA', NULL, 12000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Entradas'
UNION ALL
SELECT 'default', 'Chicharrones', NULL, 18000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Entradas'
UNION ALL
SELECT 'default', 'Chicharrones Don Dario', NULL, 17000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Entradas'
UNION ALL
SELECT 'default', 'Chorizo de ternera', NULL, 7000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Entradas'
UNION ALL
SELECT 'default', 'Patacones con Hogao', NULL, 8000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Entradas'
UNION ALL
SELECT 'default', 'Patacones HAVANA', NULL, 12000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Entradas'
UNION ALL
SELECT 'default', 'Patacon con proteina', NULL, 16000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Entradas'
UNION ALL
SELECT 'default', 'Roll 25', NULL, 25000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Entradas'
UNION ALL
SELECT 'default', 'Roll de pollo Albeiro', NULL, 30000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Entradas'
UNION ALL
SELECT 'default', 'Picada Combatti', NULL, 55000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Picadas'
UNION ALL
SELECT 'default', 'Agua de manzana 600ml', NULL, 6000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bebidas'
UNION ALL
SELECT 'default', 'Mr. Tea', NULL, 6000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bebidas'
UNION ALL
SELECT 'default', 'Postobon manzana 400ml', NULL, 6000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bebidas'
UNION ALL
SELECT 'default', 'Coca cola 1.5 litros', NULL, 10000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Bebidas'
UNION ALL
SELECT 'default', 'Maracuya', NULL, 8000, FALSE, 5, TRUE, c.id FROM categories c WHERE c.tenant_id='default' AND c.name='Jugos Naturales';
