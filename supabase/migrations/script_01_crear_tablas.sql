-- =====================================================
-- SCRIPT 1: CREAR TABLAS RESERVACIONES (Ejecutar UNA sola vez)
-- =====================================================
-- Copia todo este bloque y ejecútalo en SQL Editor de Supabase

-- 1. Crear tabla reservations
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50),
  client_name VARCHAR(255),
  client_phone VARCHAR(50),
  client_document VARCHAR(50),
  client_city VARCHAR(100),
  client_address TEXT,
  client_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pendiente',
  total DECIMAL(12,2) DEFAULT 0,
  abono DECIMAL(12,2) DEFAULT 0,
  saldo DECIMAL(12,2) DEFAULT 0,
  comprobante_url TEXT,
  comprobante_verificado BOOLEAN DEFAULT FALSE,
  whatsapp_revisado BOOLEAN DEFAULT FALSE,
  abono_confirmado BOOLEAN DEFAULT FALSE,
  origen VARCHAR(20) DEFAULT 'tienda',
  abonos JSONB DEFAULT '[]'::jsonb,
  fecha_reserva TIMESTAMPTZ DEFAULT NOW(),
  fecha_limite_abono TIMESTAMPTZ,
  fecha_limite_pago TIMESTAMPTZ,
  notas_admin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla reservation_items
CREATE TABLE IF NOT EXISTS reservation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  producto_id VARCHAR(255),
  producto_nombre VARCHAR(255),
  cantidad INTEGER DEFAULT 1,
  precio_unitario DECIMAL(12,2) DEFAULT 0,
  subtotal DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_reservations_phone ON reservations(client_phone);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservation_items_reserva ON reservation_items(reserva_id);

-- 4. Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Habilitar RLS (opcional, para producción)
-- ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 6. Verificar que se creó
SELECT 'Tabla reservations creada' AS resultado;
SELECT count(*) AS total_reservas FROM reservations;