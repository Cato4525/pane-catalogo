-- =====================================================
-- 07_reservations.sql
-- Paso 7: Crear tabla de RESERVAS
-- =====================================================

-- Tabla de reservas
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    
    -- Cliente (relación FK)
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

-- Índices
CREATE INDEX idx_reservations_codigo ON reservations(codigo);
CREATE INDEX idx_reservations_client ON reservations(client_id);
CREATE INDEX idx_reservations_estado ON reservations(estado);
CREATE INDEX idx_reservations_fecha ON reservations(fecha_reserva);

-- =====================
-- TABLA: RESERVATION_ITEMS
-- =====================
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

-- =====================
-- FUNCIONES Y TRIGGERS
-- =====================

-- Función: Generar código de reserva automático
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

-- Trigger para código automático
CREATE TRIGGER trigger_codigo_reserva
BEFORE INSERT ON reservations
FOR EACH ROW
WHEN (NEW.codigo IS NULL)
EXECUTE FUNCTION generar_codigo_reserva();

-- RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservations_read" ON reservations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "reservations_insert" ON reservations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "reservations_update" ON reservations FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "reservation_items_read" ON reservation_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "reservation_items_insert" ON reservation_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================
-- EJEMPLO: Crear una reserva
-- =====================

DO $$
DECLARE
    cliente_id UUID;
    reserva_id UUID;
    producto_id UUID;
BEGIN
    SELECT id INTO cliente_id FROM clients LIMIT 1;
    SELECT id INTO producto_id FROM products LIMIT 1;
    
    INSERT INTO reservations (
        client_id, 
        cliente_nombre, 
        cliente_telefono, 
        cliente_cedula,
        total, 
        abono,
        saldo,
        estado
    )
    VALUES (
        cliente_id,
        (SELECT nombre FROM clients WHERE id = cliente_id),
        (SELECT telefono FROM clients WHERE id = cliente_id),
        (SELECT documento FROM clients WHERE id = cliente_id),
        30.00,
        10.00,
        20.00,
        'abonado'
    )
    RETURNING id INTO reserva_id;
    
    -- Agregar items
    INSERT INTO reservation_items (reservation_id, product_id, producto_nombre, cantidad, precio_unitario, subtotal)
    VALUES
        (reserva_id, producto_id, (SELECT nombre FROM products WHERE id = producto_id), 2, 10.00, 20.00),
        (reserva_id, producto_id, (SELECT nombre FROM products WHERE id = producto_id), 1, 10.00, 10.00);
END $$;

-- Verificar reservas
SELECT r.codigo, r.cliente_nombre, r.total, r.abono, r.saldo, r.estado
FROM reservations r;
