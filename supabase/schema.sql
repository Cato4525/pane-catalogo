-- =====================================================
-- BASE DE DATOS PANADERÍA / CATÁLOGO ECOMMERCE
-- PostgreSQL (Supabase)
-- Versión 2.0 - Mejorada
-- =====================================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLA DE PERFILES (Usuario Admin)
-- =====================================================
CREATE TABLE perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    nombre VARCHAR(200),
    rol VARCHAR(20) DEFAULT 'admin' CHECK (rol IN ('admin', 'vendedor', 'viewer')),
    avatar_url TEXT,
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. TABLA DE CLIENTES
-- =====================================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50) NOT NULL,
    direccion TEXT,
    ciudad VARCHAR(100),
    documento VARCHAR(50),
    tipo_documento VARCHAR(10) DEFAULT 'cc',
    observaciones TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda de clientes
CREATE INDEX idx_clients_nombre ON clients(nombre);
CREATE INDEX idx_clients_telefono ON clients(telefono);
CREATE INDEX idx_clients_email ON clients(email);

-- =====================================================
-- 3. TABLA DE CATEGORÍAS
-- =====================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    imagen VARCHAR(500),
    orden INTEGER DEFAULT 0,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. TABLA DE COLORES
-- =====================================================
CREATE TABLE colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    codigo_hex VARCHAR(7) DEFAULT '#000000',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. TABLA DE TALLAS
-- =====================================================
CREATE TABLE sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(20) NOT NULL,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. TABLA DE MODELOS
-- =====================================================
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. TABLA DE PRODUCTOS
-- =====================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(12,2) NOT NULL DEFAULT 0,
    precio_liquidacion DECIMAL(12,2),
    stock INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    
    -- Relaciones
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    model_id UUID REFERENCES models(id) ON DELETE SET NULL,
    
    -- Atributos
    colores VARCHAR(255)[],
    tallas VARCHAR(255)[],
    imagenes TEXT[],
    
    -- Estados del catálogo
    estado_catalogo VARCHAR(20) DEFAULT 'clasico',
    tipo_catalogo VARCHAR(20) DEFAULT 'permanente',
    coleccion VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    en_liquidacion BOOLEAN DEFAULT false,
    
    -- SEO
    slug VARCHAR(255),
    meta_titulo VARCHAR(255),
    meta_descripcion TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para productos
CREATE INDEX idx_products_codigo ON products(codigo);
CREATE INDEX idx_products_nombre ON products(nombre);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_estado ON products(estado_catalogo);
CREATE INDEX idx_products_activo ON products(activo);
CREATE INDEX idx_products_precio ON products(precio);

-- =====================================================
-- 8. TABLA DE PRODUCTO-COLOR (Mucho a Mucho)
-- =====================================================
CREATE TABLE product_colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    color_id UUID REFERENCES colors(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, color_id)
);

-- =====================================================
-- 9. TABLA DE PRODUCTO-TALLA (Mucho a Mucho)
-- =====================================================
CREATE TABLE product_sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    size_id UUID REFERENCES sizes(id) ON DELETE CASCADE,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, size_id)
);

-- =====================================================
-- 10. TABLA DE CATÁLOGOS
-- =====================================================
CREATE TABLE catalogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) DEFAULT 'permanente',
    estado VARCHAR(20) DEFAULT 'clasico',
    activo BOOLEAN DEFAULT true,
    fecha_inicio DATE,
    fecha_fin DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. TABLA DE CATÁLOGO-PRODUCTOS
-- =====================================================
CREATE TABLE catalog_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catalog_id UUID REFERENCES catalogs(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(catalog_id, product_id)
);

-- =====================================================
-- 12. TABLA DE PEDIDOS/VENTAS
-- =====================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    
    -- Cliente (relación)
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

-- Índices para pedidos
CREATE INDEX idx_orders_codigo ON orders(codigo);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_estado ON orders(estado);
CREATE INDEX idx_orders_fecha ON orders(fecha_pedido);

-- =====================================================
-- 13. TABLA DE ITEMS DE PEDIDO
-- =====================================================
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

-- Índices para items de pedido
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- =====================================================
-- 14. TABLA DE RESERVAS
-- =====================================================
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    
    -- Cliente (relación)
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Datos del cliente
    cliente_nombre VARCHAR(255),
    cliente_telefono VARCHAR(50),
    cliente_cedula VARCHAR(50),
    cliente_direccion TEXT,
    
    -- Estados
    estado VARCHAR(20) DEFAULT 'abonado',
    
    -- Montos
    total DECIMAL(12,2) DEFAULT 0,
    abono DECIMAL(12,2) DEFAULT 0,
    saldo DECIMAL(12,2) DEFAULT 0,
    
    -- Comprobante
    comprobante_url TEXT,
    
    -- Verificaciones
    whatsapp_revisado BOOLEAN DEFAULT false,
    comprobante_verificado BOOLEAN DEFAULT false,
    abono_confirmado BOOLEAN DEFAULT false,
    
    -- Fechas
    fecha_reserva TIMESTAMPTZ DEFAULT NOW(),
    fecha_limite_abono TIMESTAMPTZ,
    fecha_limite_pago TIMESTAMPTZ,
    fecha_confirmado TIMESTAMPTZ,
    fecha_cancelado TIMESTAMPTZ,
    
    -- Notas
    notas_admin TEXT,
    
    -- Usuario que registró
    user_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para reservas
CREATE INDEX idx_reservations_codigo ON reservations(codigo);
CREATE INDEX idx_reservations_client ON reservations(client_id);
CREATE INDEX idx_reservations_estado ON reservations(estado);
CREATE INDEX idx_reservations_fecha ON reservations(fecha_reserva);

-- =====================================================
-- 15. TABLA DE ITEMS DE RESERVA
-- =====================================================
CREATE TABLE reservation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    producto_nombre VARCHAR(255),
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 16. TABLA DE CONSULTAS DE PRODUCTOS
-- =====================================================
CREATE TABLE product_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    -- Datos del cliente que consulta
    cliente_nombre VARCHAR(255),
    cliente_telefono VARCHAR(50),
    cliente_email VARCHAR(255),
    
    -- Detalles de la consulta
    mensaje TEXT,
    origen VARCHAR(50) DEFAULT 'tienda',
    
    -- Estado
    respondida BOOLEAN DEFAULT false,
    respuesta TEXT,
    fecha_respuesta TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas
CREATE INDEX idx_product_queries_product ON product_queries(product_id);
CREATE INDEX idx_product_queries_fecha ON product_queries(created_at);

-- =====================================================
-- 17. TABLA DE MOVIMIENTOS DE STOCK
-- =====================================================
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    -- Tipo de movimiento
    tipo VARCHAR(20) NOT NULL,
    
    -- Cantidades
    cantidad INTEGER NOT NULL,
    stock_anterior INTEGER NOT NULL,
    stock_nuevo INTEGER NOT NULL,
    
    -- Detalles
    motivo TEXT,
    referencia VARCHAR(255),
    
    -- Relación opcional (si es por venta/reserva)
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    
    -- Usuario que registra
    user_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para movimientos de stock
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_tipo ON stock_movements(tipo);
CREATE INDEX idx_stock_movements_fecha ON stock_movements(created_at);

-- =====================================================
-- 18. TABLA DE CONFIGURACIONES
-- =====================================================
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    tipo VARCHAR(20) DEFAULT 'string',
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 19. TABLA DE REDES SOCIALES
-- =====================================================
CREATE TABLE social_networks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL,
    enlace VARCHAR(500),
    icono VARCHAR(50),
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 20. TABLA DE CAMPOS DE ENVÍO
-- =====================================================
CREATE TABLE shipping_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    etiqueta VARCHAR(100) NOT NULL,
    clave VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    requerido BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 21. TABLA DE VISITAS
-- =====================================================
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip VARCHAR(50),
    user_agent TEXT,
    url VARCHAR(500),
    referrer VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 22. TABLA DE ACTIVIDADES/AUDITORÍA
-- =====================================================
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(100),
    registro_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_usuario ON activity_log(usuario_id);
CREATE INDEX idx_activity_log_fecha ON activity_log(created_at);

-- =====================================================
-- STORAGE BUCKET (Imágenes de productos)
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'productos',
    'productos',
    true,
    524288,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso al Storage
DROP POLICY IF EXISTS "Public Access - productos" ON storage.objects;
CREATE POLICY "Public Access - productos" ON storage.objects 
FOR SELECT USING (bucket_id = 'productos');

DROP POLICY IF EXISTS "Allow uploads" ON storage.objects;
CREATE POLICY "Allow uploads" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'productos' AND auth.role() IN ('authenticated', 'anon', 'service_role'));

DROP POLICY IF EXISTS "Allow updates" ON storage.objects;
CREATE POLICY "Allow updates" ON storage.objects 
FOR UPDATE USING (bucket_id = 'productos');

DROP POLICY IF EXISTS "Allow deletes" ON storage.objects;
CREATE POLICY "Allow deletes" ON storage.objects 
FOR DELETE USING (bucket_id = 'productos');

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at en todas las tablas principales
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Función: Generar código de pedido automático
-- =====================================================
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

CREATE TRIGGER trigger_codigo_pedido
BEFORE INSERT ON orders
FOR EACH ROW
WHEN (NEW.codigo IS NULL)
EXECUTE FUNCTION generar_codigo_pedido();

-- =====================================================
-- Función: Generar código de reserva automático
-- =====================================================
CREATE OR REPLACE FUNCTION generar_codigo_reserva()
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
    FROM reservations
    WHERE codigo LIKE 'RES-' || anno || mes || '%';
    
    codigo := 'RES-' || anno || mes || LPAD(secuencia::TEXT, 6, '0');
    NEW.codigo := codigo;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_codigo_reserva
BEFORE INSERT ON reservations
FOR EACH ROW
WHEN (NEW.codigo IS NULL)
EXECUTE FUNCTION generar_codigo_reserva();

-- =====================================================
-- Función: Generar código de cliente automático
-- =====================================================
CREATE OR REPLACE FUNCTION generar_codigo_cliente()
RETURNS TRIGGER AS $$
DECLARE
    secuencia INTEGER;
    codigo TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 5 FOR 6) AS INTEGER)), 0) + 1
    INTO secuencia
    FROM clients
    WHERE codigo LIKE 'CLI-%';
    
    codigo := 'CLI-' || LPAD(secuencia::TEXT, 6, '0');
    NEW.codigo := codigo;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_codigo_cliente
BEFORE INSERT ON clients
FOR EACH ROW
WHEN (NEW.codigo IS NULL)
EXECUTE FUNCTION generar_codigo_cliente();

-- =====================================================
-- Función: Calcular total del pedido
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_total_pedido()
RETURNS TRIGGER AS $$
DECLARE
    total_pedido DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(subtotal), 0)
    INTO total_pedido
    FROM order_items
    WHERE order_id = NEW.order_id;
    
    UPDATE orders
    SET subtotal = total_pedido,
        total = total_pedido - COALESCE(descuento, 0)
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_total_pedido
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION calcular_total_pedido();

-- =====================================================
-- Función: Calcular total de reserva
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_total_reserva()
RETURNS TRIGGER AS $$
DECLARE
    total_reserva DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(subtotal), 0)
    INTO total_reserva
    FROM reservation_items
    WHERE reservation_id = NEW.reservation_id;
    
    UPDATE reservations
    SET total = total_reserva,
        saldo = total_reserva - COALESCE(abono, 0)
    WHERE id = NEW.reservation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_total_reserva
AFTER INSERT OR UPDATE OR DELETE ON reservation_items
FOR EACH ROW EXECUTE FUNCTION calcular_total_reserva();

-- =====================================================
-- Función: Actualizar stock automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.product_id IS NOT NULL THEN
        UPDATE products
        SET stock = stock + NEW.cantidad
        WHERE id = NEW.product_id;
    ELSIF TG_OP = 'DELETE' AND OLD.product_id IS NOT NULL THEN
        UPDATE products
        SET stock = stock - OLD.cantidad
        WHERE id = OLD.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stock_movement
AFTER INSERT ON stock_movements
FOR EACH ROW EXECUTE FUNCTION actualizar_stock();

-- =====================================================
-- Función: Trigger para perfiles automáticos
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO perfiles (id, email, nombre)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'nombre');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista: Resumen de ventas por día
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

-- Vista: Productos más vendidos
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

-- Vista: Inventario actual
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
        WHEN p.stock > p.stock_minimo * 3 THEN 'Stock Alto'
        ELSE 'Normal'
    END as estado_stock
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN models m ON m.id = p.model_id;

-- Vista: Reservas activas
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

-- Vista: Pedidos con detalles de cliente
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

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogs ENABLE ROW LEVEL SECURITY;

-- Políticas para atributos (lectura pública, escritura solo auth)
CREATE POLICY "colores_public_read" ON colors FOR SELECT USING (true);
CREATE POLICY "tallas_public_read" ON sizes FOR SELECT USING (true);
CREATE POLICY "modelos_public_read" ON models FOR SELECT USING (true);
CREATE POLICY "catalogos_public_read" ON catalogs FOR SELECT USING (true);

CREATE POLICY "colors_auth_insert" ON colors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "colors_auth_update" ON colors FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "colors_auth_delete" ON colors FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "sizes_auth_insert" ON sizes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "sizes_auth_update" ON sizes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "sizes_auth_delete" ON sizes FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "models_auth_insert" ON models FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "models_auth_update" ON models FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "models_auth_delete" ON models FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "catalogs_auth_insert" ON catalogs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "catalogs_auth_update" ON catalogs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "catalogs_auth_delete" ON catalogs FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para productos (lectura pública, escritura solo auth)
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);
CREATE POLICY "products_auth_insert" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "products_auth_update" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "products_auth_delete" ON products FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para categorías
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_auth_insert" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "categories_auth_update" ON categories FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para clientes
CREATE POLICY "clients_read" ON clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "clients_insert" ON clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "clients_update" ON clients FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para pedidos
CREATE POLICY "orders_read" ON orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para reservas
CREATE POLICY "reservations_read" ON reservations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "reservations_insert" ON reservations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "reservations_update" ON reservations FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para consultas
CREATE POLICY "queries_public_insert" ON product_queries FOR INSERT WITH CHECK (true);
CREATE POLICY "queries_read" ON product_queries FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para stock
CREATE POLICY "stock_read" ON stock_movements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "stock_insert" ON stock_movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas para perfiles
CREATE POLICY "perfiles_read" ON perfiles FOR SELECT USING (true);
CREATE POLICY "perfiles_insert" ON perfiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "perfiles_update" ON perfiles FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar categorías iniciales
INSERT INTO categories (nombre, descripcion, orden) VALUES
('Panadería', 'Productos de panadería', 1),
('Pasteles', 'Pasteles y repostería', 2),
('Bebidas', 'Bebidas frías y calientes', 3),
('Galletas', 'Galletas y bocadillos', 4),
('Especiales', 'Productos especiales de temporada', 5);

-- Insertar tallas
INSERT INTO sizes (nombre, orden) VALUES
('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5);

-- Insertar colores
INSERT INTO colors (nombre, codigo_hex) VALUES
('Negro', '#1a1a1a'),
('Gris', '#808080'),
('Azul', '#4169E1'),
('Rosado', '#FF69B4'),
('Beige', '#F5F5DC'),
('Dorado', '#DAA520'),
('Verde', '#228B22'),
('Morado', '#800080');

-- Insertar modelos
INSERT INTO models (nombre, descripcion) VALUES
('Universo', 'Modelo de alta compresión'),
('Natural', 'Modelo de comodidad extrema'),
('Fitnets', 'Modelo con control abdominal');

-- Insertar configuraciones iniciales
INSERT INTO settings (clave, valor, tipo, descripcion) VALUES
('store_name', 'Panadería Catalogo', 'string', 'Nombre de la tienda'),
('store_url', '', 'string', 'URL de la tienda'),
('theme', 'moderno', 'string', 'Tema de la tienda'),
('moneda', 'COP', 'string', 'Moneda principal'),
('impuesto', '0', 'number', 'Porcentaje de impuesto'),
('whatsapp', '', 'string', 'Número de WhatsApp'),
('email', 'contacto@panaderia.com', 'string', 'Email de contacto'),
('direccion', '', 'string', 'Dirección de la tienda'),
('ciudad', '', 'string', 'Ciudad de la tienda'),
('pais', 'Colombia', 'string', 'País'),
('dias_limite_abono', '2', 'number', 'Días límite para realizar abono'),
('dias_limite_pago', '7', 'number', 'Días límite para pago total'),
('abono_minimo', '5', 'number', 'Monto mínimo de abono');

-- Insertar campos de envío por defecto
INSERT INTO shipping_fields (etiqueta, clave, enabled, orden, requerido) VALUES
('Nombre del cliente', 'cliente_nombre', true, 1, true),
('Teléfono', 'telefono', true, 2, true),
('Email', 'email', true, 3, false),
('Dirección', 'direccion', true, 4, true),
('Ciudad', 'ciudad', true, 5, true),
('Notas adicionales', 'notas', true, 6, false);

-- Insertar redes sociales por defecto
INSERT INTO social_networks (nombre, enlace, icono, orden, activo) VALUES
('Facebook', '', '📘', 1, true),
('Instagram', '', '📸', 2, true),
('Twitter', '', '🐦', 3, false);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
