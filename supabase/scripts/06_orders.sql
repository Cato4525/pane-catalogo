-- =====================================================
-- 06_orders.sql
-- Paso 6: Crear tabla de PEDIDOS/VENTAS
-- =====================================================

-- Tabla de pedidos
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    
    -- Cliente (relación FK)
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Datos del cliente en el momento de la venta
    cliente_nombre VARCHAR(255),
    cliente_telefono VARCHAR(50),
    cliente_email VARCHAR(255),
    cliente_direccion TEXT,
    cliente_ciudad VARCHAR(100),
    
    -- Totales
    subtotal DECIMAL(12,2) DEFAULT 0,
    descuento DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    
    -- Estado y método de pago
    estado VARCHAR(20) DEFAULT 'pendiente',
    metodo_pago VARCHAR(20),
    
    -- Detalles de pago
    monto_pagado DECIMAL(12,2) DEFAULT 0,
    cambio DECIMAL(12,2) DEFAULT 0,
    tarjeta_last4 VARCHAR(4),
    tarjeta_autorizacion VARCHAR(100),
    transferencia_imagen TEXT,
    
    -- Facturación
    factura_generada BOOLEAN DEFAULT false,
    numero_factura VARCHAR(50),
    
    -- Notas
    notas TEXT,
    
    -- Fechas
    fecha_pedido TIMESTAMPTZ DEFAULT NOW(),
    fecha_pago TIMESTAMPTZ,
    fecha_envio TIMESTAMPTZ,
    fecha_completado TIMESTAMPTZ,
    fecha_cancelado TIMESTAMPTZ,
    
    -- Usuario que registró
    user_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_orders_codigo ON orders(codigo);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_estado ON orders(estado);
CREATE INDEX idx_orders_fecha ON orders(fecha_pedido);

-- =====================
-- TABLA: ORDER_ITEMS
-- =====================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    -- Datos del producto en el momento de la venta
    producto_nombre VARCHAR(255),
    producto_codigo VARCHAR(50),
    
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL,
    
    -- Atributos específicos
    talla VARCHAR(20),
    color VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- =====================
-- FUNCIONES Y TRIGGERS
-- =====================

-- Función: Generar código de pedido automático
CREATE OR REPLACE FUNCTION generar_codigo_pedido()
RETURNS TRIGGER AS $$
DECLARE
    anno CHAR(4);
    mes CHAR(2);
    secuencia INTEGER;
    codigo TEXT;
BEGIN
    anno := TO_CHAR(NOW(), 'YYYY');
    mes := TO_CHAR(NOW(), 'MM');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 9 FOR 6) AS INTEGER)), 0) + 1
    INTO secuencia
    FROM orders
    WHERE codigo LIKE 'PED-' || anno || mes || '%';
    
    codigo := 'PED-' || anno || mes || LPAD(secuencia::TEXT, 6, '0');
    NEW.codigo := codigo;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para código automático
CREATE TRIGGER trigger_codigo_pedido
BEFORE INSERT ON orders
FOR EACH ROW
WHEN (NEW.codigo IS NULL)
EXECUTE FUNCTION generar_codigo_pedido();

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_read" ON orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "order_items_read" ON order_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "order_items_insert" ON order_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "order_items_update" ON order_items FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================
-- INSERTAR PEDIDO DE EJEMPLO
-- =====================

DO $$
DECLARE
    cliente_id UUID;
    pedido_id UUID;
    producto_id UUID;
BEGIN
    -- Obtener primer cliente
    SELECT id INTO cliente_id FROM clients LIMIT 1;
    
    -- Obtener primer producto
    SELECT id INTO producto_id FROM products LIMIT 1;
    
    -- Crear pedido
    INSERT INTO orders (client_id, cliente_nombre, cliente_telefono, cliente_email, total, estado, metodo_pago, monto_pagado)
    VALUES (
        cliente_id,
        (SELECT nombre FROM clients WHERE id = cliente_id),
        (SELECT telefono FROM clients WHERE id = cliente_id),
        (SELECT email FROM clients WHERE id = cliente_id),
        5.00,
        'completado',
        'efectivo',
        10.00
    )
    RETURNING id INTO pedido_id;
    
    -- Agregar item al pedido
    INSERT INTO order_items (order_id, product_id, producto_nombre, producto_codigo, cantidad, precio_unitario, subtotal)
    VALUES (
        pedido_id,
        producto_id,
        (SELECT nombre FROM products WHERE id = producto_id),
        (SELECT codigo FROM products WHERE id = producto_id),
        2,
        2.50,
        5.00
    );
END $$;

-- Verificar pedido
SELECT o.codigo, o.cliente_nombre, o.total, o.estado, oi.producto_nombre, oi.cantidad, oi.subtotal
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id;
