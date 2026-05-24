-- =====================================================
-- 10_vistas.sql
-- Paso 10: Crear VISTAS ÚTILES
-- =====================

-- =====================
-- VISTA: VENTAS POR DÍA
-- =====================
CREATE OR REPLACE VIEW ventas_por_dia AS
SELECT 
    DATE(fecha_pedido) as fecha,
    COUNT(*) as num_pedidos,
    SUM(total) as total_ventas,
    SUM(CASE WHEN estado = 'completado' THEN total ELSE 0 END) as total_completado,
    SUM(CASE WHEN estado = 'cancelado' THEN total ELSE 0 END) as total_cancelado
FROM orders
GROUP BY DATE(fecha_pedido)
ORDER BY fecha DESC;

-- =====================
-- VISTA: PRODUCTOS MÁS VENDIDOS
-- =====================
CREATE OR REPLACE VIEW productos_mas_vendidos AS
SELECT 
    p.id,
    p.nombre,
    p.codigo,
    SUM(oi.cantidad) as cantidad_vendida,
    SUM(oi.subtotal) as total_vendido
FROM products p
JOIN order_items oi ON oi.product_id = p.id
JOIN orders o ON o.id = oi.order_id
WHERE o.estado IN ('completado', 'abonado')
GROUP BY p.id, p.nombre, p.codigo
ORDER BY cantidad_vendida DESC
LIMIT 20;

-- =====================
-- VISTA: INVENTARIO ACTUAL
-- =====================
CREATE OR REPLACE VIEW inventario_actual AS
SELECT 
    p.id,
    p.codigo,
    p.nombre,
    c.nombre as categoria,
    m.nombre as modelo,
    p.stock,
    p.stock_minimo,
    p.precio,
    p.precio_liquidacion,
    p.activo,
    p.en_liquidacion,
    CASE 
        WHEN p.stock <= 0 THEN 'Sin Stock'
        WHEN p.stock <= p.stock_minimo THEN 'Stock Bajo'
        WHEN p.stock > COALESCE(p.stock_minimo, 0) * 3 THEN 'Stock Alto'
        ELSE 'Normal'
    END as estado_stock
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN models m ON m.id = p.model_id;

-- =====================
-- VISTA: RESERVAS ACTIVAS
-- =====================
CREATE OR REPLACE VIEW reservas_activas AS
SELECT 
    r.id,
    r.codigo,
    r.cliente_nombre,
    r.cliente_telefono,
    r.total,
    r.abono,
    r.saldo,
    r.estado,
    r.fecha_reserva,
    r.fecha_limite_pago,
    CASE 
        WHEN r.estado = 'cancelado' THEN 'Cancelada'
        WHEN r.estado = 'confirmado' THEN 'Confirmada'
        WHEN r.fecha_limite_pago < NOW() THEN 'Expirada'
        WHEN r.saldo > 0 THEN 'Pendiente'
        ELSE 'Completada'
    END as estado_actual
FROM reservations r
WHERE r.estado IN ('abonado', 'confirmado')
ORDER BY r.fecha_reserva DESC;

-- =====================
-- VISTA: PEDIDOS CON CLIENTE
-- =====================
CREATE OR REPLACE VIEW pedidos_con_cliente AS
SELECT 
    o.id,
    o.codigo,
    o.cliente_nombre,
    o.cliente_telefono,
    o.cliente_email,
    o.total,
    o.estado,
    o.metodo_pago,
    o.fecha_pedido,
    COUNT(oi.id) as num_items
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.codigo, o.cliente_nombre, o.cliente_telefono, o.cliente_email, o.total, o.estado, o.metodo_pago, o.fecha_pedido
ORDER BY o.fecha_pedido DESC;

-- =====================
-- VER VISTAS
-- =====================

-- Probar vista de inventario
SELECT * FROM inventario_actual;

-- Probar vista de ventas por día
SELECT * FROM ventas_por_dia;

-- Probar vista de productos más vendidos
SELECT * FROM productos_mas_vendidos;
