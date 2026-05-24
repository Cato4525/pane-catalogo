-- =============================================
-- MIGRATION: Add Reservations System Tables
-- =============================================
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. CREATE reservations table
-- =============================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE,
  
  -- Client info (store registration)
  client_id VARCHAR(255),
  client_name VARCHAR(255),
  client_phone VARCHAR(50),
  client_document VARCHAR(50),
  client_city VARCHAR(100),
  client_address TEXT,
  client_email VARCHAR(255),
  
  -- Status and amounts
  status VARCHAR(50) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'abonado', 'confirmado', 'cancelado', 'expirado')),
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  abono DECIMAL(12,2) NOT NULL DEFAULT 0,
  saldo DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Comprobante (proof of payment)
  comprobante_url TEXT,
  comprobante_verificado BOOLEAN DEFAULT FALSE,
  
  -- WhatsApp tracking
  whatsapp_revisado BOOLEAN DEFAULT FALSE,
  
  -- Abono confirmation
  abono_confirmado BOOLEAN DEFAULT FALSE,
  
  -- Origin tracking
  origen VARCHAR(20) DEFAULT 'tienda' CHECK (origen IN ('tienda', 'pos')),
  
  -- Payment history (JSON array of abonos)
  abonos JSONB DEFAULT '[]'::jsonb,
  
  -- Dates
  fecha_reserva TIMESTAMPTZ DEFAULT NOW(),
  fecha_limite_abono TIMESTAMPTZ,
  fecha_limite_pago TIMESTAMPTZ,
  
  -- Admin notes
  notas_admin TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. CREATE reservation_items table
-- =============================================
CREATE TABLE IF NOT EXISTS reservation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  producto_id VARCHAR(255) NOT NULL,
  producto_nombre VARCHAR(255),
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. Create indexes for better performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_reservations_client_phone ON reservations(client_phone);
CREATE INDEX IF NOT EXISTS idx_reservations_client_id ON reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_fecha ON reservations(fecha_reserva DESC);
CREATE INDEX IF NOT EXISTS idx_reservation_items_reserva ON reservation_items(reserva_id);

-- =============================================
-- 4. Create function to auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for reservations
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. Enable Row Level Security (RLS)
-- =============================================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. RLS Policies for reservations
-- =============================================
-- Allow authenticated users to read their own reservations
CREATE POLICY "Users can view own reservations by phone"
  ON reservations FOR SELECT
  USING (auth.uid() IS NOT NULL AND client_phone = (
    SELECT telefono FROM clients WHERE user_id = auth.uid() LIMIT 1
  ));

-- Allow admins full access
CREATE POLICY "Admins can do anything with reservations"
  ON reservations FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- 7. RLS Policies for reservation_items
-- =============================================
CREATE POLICY "Users can view own reservation items"
  ON reservation_items FOR SELECT
  USING (
    reserva_id IN (
      SELECT id FROM reservations WHERE client_phone = (
        SELECT telefono FROM clients WHERE user_id = auth.uid() LIMIT 1
      )
    )
  );

CREATE POLICY "Admins can do anything with reservation items"
  ON reservation_items FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- 8. Function to add abono (partial payment)
-- =============================================
CREATE OR REPLACE FUNCTION agregar_abono(
  p_reserva_id UUID,
  p_monto DECIMAL,
  p_comprobante_url TEXT DEFAULT NULL,
  p_notas TEXT DEFAULT NULL
)
RETURNS reservations AS $$
DECLARE
  v_reserva reservations;
  v_nuevo_abono DECIMAL;
  v_nuevo_saldo DECIMAL;
  v_es_final BOOLEAN;
  v_abono_record JSONB;
BEGIN
  -- Get current reserva
  SELECT * INTO v_reserva FROM reservations WHERE id = p_reserva_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva no encontrada';
  END IF;
  
  -- Calculate new totals
  v_nuevo_abono := v_reserva.abono + p_monto;
  v_nuevo_saldo := v_reserva.total - v_nuevo_abono;
  v_es_final := v_nuevo_saldo <= 0;
  
  -- Create abono record
  v_abono_record := jsonb_build_object(
    'id', 'AB-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'reserva_id', p_reserva_id,
    'monto', p_monto,
    'fecha', NOW()::TEXT,
    'comprobante_url', p_comprobante_url,
    'notas', p_notas,
    'tipo', CASE WHEN v_es_final THEN 'final' ELSE 'parcial' END
  );
  
  -- Update reserva
  UPDATE reservations SET
    abono = v_nuevo_abono,
    saldo = GREATEST(0, v_nuevo_saldo),
    status = CASE WHEN v_es_final THEN 'confirmado' ELSE status END,
    comprobante_verificado = COALESCE(p_comprobante_url IS NOT NULL, comprobante_verificado),
    abonos = abonos || v_abono_record,
    updated_at = NOW()
  WHERE id = p_reserva_id
  RETURNING * INTO v_reserva;
  
  RETURN v_reserva;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 9. Function to mark as fully paid
-- =============================================
CREATE OR REPLACE FUNCTION marcar_pagado_total(p_reserva_id UUID)
RETURNS reservations AS $$
DECLARE
  v_reserva reservations;
BEGIN
  UPDATE reservations SET
    abono = total,
    saldo = 0,
    status = 'confirmado',
    updated_at = NOW()
  WHERE id = p_reserva_id
  RETURNING * INTO v_reserva;
  
  RETURN v_reserva;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 10. Function to generate reservation code
-- =============================================
CREATE OR REPLACE FUNCTION generate_reserva_codigo()
RETURNS VARCHAR AS $$
DECLARE
  v_fecha VARCHAR;
  v_secuencia INTEGER;
  v_codigo VARCHAR;
BEGIN
  v_fecha := TO_CHAR(NOW(), 'YYMMDD');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(codigo FROM 8) AS INTEGER)
  ), 0) + 1
  INTO v_secuencia
  FROM reservations
  WHERE SUBSTRING(codigo FROM 1 FOR 6) = v_fecha;
  
  v_codigo := v_fecha || '-' || LPAD(v_secuencia::TEXT, 4, '0');
  
  RETURN v_codigo;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 11. Trigger to auto-generate codigo
-- =============================================
CREATE OR REPLACE FUNCTION set_reserva_codigo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := generate_reserva_codigo();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_reserva_codigo_trigger ON reservations;
CREATE TRIGGER set_reserva_codigo_trigger
  BEFORE INSERT ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION set_reserva_codigo();

-- =============================================
-- 12. Seed sample data (optional - comment out for production)
-- =============================================
/*
INSERT INTO reservations (client_name, client_phone, client_document, client_city, total, abono, saldo, status, origen) VALUES
  ('María López', '3001234567', '1010101010', 'Quito', 45.00, 45.00, 0, 'confirmado', 'pos'),
  ('Carlos Ruiz', '3209876543', '2020202020', 'Guayaquil', 30.00, 10.00, 20.00, 'abonado', 'tienda'),
  ('Ana Torres', '3154567890', '3030303030', 'Cuenca', 18.00, 0, 18.00, 'pendiente', 'tienda'),
  ('Pedro Díaz', '3005678901', '4040404040', 'Loja', 15.00, 5.00, 10.00, 'cancelado', 'tienda');
*/
