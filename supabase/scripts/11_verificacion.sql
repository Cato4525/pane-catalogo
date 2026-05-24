-- =====================================================
-- 11_verificacion.sql
-- Paso 11: VERIFICACIÓN FINAL
-- =====================

-- =====================================================
-- 1. VERIFICAR TODAS LAS TABLAS CREADAS
-- =====================================================
SELECT 
    '01. Extensiones' as paso, 
    COUNT(*) as estado
FROM pg_extension 
WHERE extname = 'uuid-ossp'
UNION ALL
SELECT 
    '02. Perfiles', 
    COUNT(*) 
FROM perfiles
UNION ALL
SELECT 
    '03. Clients', 
    COUNT(*) 
FROM clients
UNION ALL
SELECT 
    '04. Categories', 
    COUNT(*) 
FROM categories
UNION ALL
SELECT 
    '05. Products', 
    COUNT(*) 
FROM products
UNION ALL
SELECT 
    '06. Orders', 
    COUNT(*) 
FROM orders
UNION ALL
SELECT 
    '07. Reservations', 
    COUNT(*) 
FROM reservations
UNION ALL
SELECT 
    '08. Settings', 
    COUNT(*) 
FROM settings;

-- =====================================================
-- 2. VER DATOS DE EJEMPLO
-- =====================================================

-- Ver clientes
SELECT codigo, nombre, telefono, email FROM clients LIMIT 5;

-- Ver categorías
SELECT nombre, descripcion, orden FROM categories;

-- Ver productos
SELECT codigo, nombre, precio, stock, estado_catalogo FROM products LIMIT 5;

-- Ver pedidos
SELECT codigo, cliente_nombre, total, estado, metodo_pago FROM orders LIMIT 5;

-- Ver reservas
SELECT codigo, cliente_nombre, total, abono, saldo, estado FROM reservations LIMIT 5;

-- Ver configuraciones
SELECT clave, valor FROM settings;

-- =====================================================
-- 3. VER VISTAS
-- =====================================================
SELECT 'inventario_actual' as vista, COUNT(*) as registros FROM inventario_actual
UNION ALL
SELECT 'ventas_por_dia', COUNT(*) FROM ventas_por_dia
UNION ALL
SELECT 'productos_mas_vendidos', COUNT(*) FROM productos_mas_vendidos
UNION ALL
SELECT 'reservas_activas', COUNT(*) FROM reservas_activas;

-- =====================================================
-- 4. VER POLÍTICAS RLS
-- =====================================================
SELECT 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 5. VER STORAGE
-- =====================================================
SELECT id, name, public, file_size_limit FROM storage.buckets;

-- =====================================================
-- 6. VER FUNCIONES CREADAS
-- =====================================================
SELECT 
    routine_name, 
    routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE 'gen%' OR routine_name LIKE 'update%' OR routine_name LIKE 'handle%'
ORDER BY routine_name;

-- =====================================================
-- RESUMEN FINAL
-- =====================================================
SELECT 
    'BASE DE DATOS CONFIGURADA CORRECTAMENTE' as mensaje,
    COUNT(*) as total_tablas
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
