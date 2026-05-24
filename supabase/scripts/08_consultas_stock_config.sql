-- =====================================================
-- 08_consultas_stock_config.sql
-- Paso 8: Crear tablas de CONSULTAS, STOCK y CONFIGURACIÓN
-- =====================

-- =====================
-- TABLA: PRODUCT_QUERIES
-- =====================
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

-- Índices
CREATE INDEX idx_product_queries_product ON product_queries(product_id);
CREATE INDEX idx_product_queries_fecha ON product_queries(created_at);

-- RLS
ALTER TABLE product_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "queries_public_insert" ON product_queries FOR INSERT WITH CHECK (true);
CREATE POLICY "queries_read" ON product_queries FOR SELECT USING (auth.role() = 'authenticated');

-- =====================
-- TABLA: STOCK_MOVEMENTS
-- =====================
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

-- Índices
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_tipo ON stock_movements(tipo);
CREATE INDEX idx_stock_movements_fecha ON stock_movements(created_at);

-- RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_read" ON stock_movements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "stock_insert" ON stock_movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================
-- TABLA: SETTINGS
-- =====================
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    tipo VARCHAR(20) DEFAULT 'string',
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_public_read" ON settings FOR SELECT USING (true);
CREATE POLICY "settings_auth_update" ON settings FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================
-- TABLA: SOCIAL_NETWORKS
-- =====================
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

-- =====================
-- TABLA: SHIPPING_FIELDS
-- =====================
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

-- =====================
-- INSERTAR CONFIGURACIONES
-- =====================

-- Configuraciones de tienda
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

-- Redes sociales
INSERT INTO social_networks (nombre, enlace, icono, orden, activo) VALUES
('Facebook', '', 'facebook', 1, true),
('Instagram', '', 'instagram', 2, true),
('Twitter', '', 'twitter', 3, false);

-- Campos de envío
INSERT INTO shipping_fields (etiqueta, clave, enabled, orden, requerido) VALUES
('Nombre del cliente', 'cliente_nombre', true, 1, true),
('Teléfono', 'telefono', true, 2, true),
('Email', 'email', true, 3, false),
('Dirección', 'direccion', true, 4, true),
('Ciudad', 'ciudad', true, 5, true),
('Notas adicionales', 'notas', true, 6, false);

-- =====================
-- EJEMPLO: Movimiento de stock
-- =====================

DO $$
DECLARE
    producto_id UUID;
    stock_actual INTEGER;
BEGIN
    SELECT id, stock INTO producto_id, stock_actual FROM products LIMIT 1;
    
    IF producto_id IS NOT NULL THEN
        INSERT INTO stock_movements (product_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo)
        VALUES (producto_id, 'entrada', 50, stock_actual, stock_actual + 50, 'Stock inicial');
    END IF;
END $$;

-- Verificar configuraciones
SELECT clave, valor, tipo FROM settings;
SELECT nombre, enlace, activo FROM social_networks;
