-- =============================================
-- MIGRATION: Update Reservations (if tables exist)
-- =============================================
-- Run this if reservations table already exists
-- This script adds missing columns and functions

-- =============================================
-- 1. Add missing columns to reservations
-- =============================================
DO $$ 
BEGIN
  -- Add origen column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'origen') THEN
    ALTER TABLE reservations ADD COLUMN origen VARCHAR(20) DEFAULT 'tienda' CHECK (origen IN ('tienda', 'pos'));
  END IF;

  -- Add abonos column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'abonos') THEN
    ALTER TABLE reservations ADD COLUMN abonos JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add whatsapp_revisado column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'whatsapp_revisado') THEN
    ALTER TABLE reservations ADD COLUMN whatsapp_revisado BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add abono_confirmado column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'abono_confirmado') THEN
    ALTER TABLE reservations ADD COLUMN abono_confirmado BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add updated_at if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'updated_at') THEN
    ALTER TABLE reservations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add client_id column (renamed from cliente_id)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'client_id') THEN
    ALTER TABLE reservations ADD COLUMN client_id VARCHAR(255);
  END IF;

  -- Rename cliente columns to client_ if they exist
  -- (Uncomment if needed)
  -- ALTER TABLE reservations RENAME COLUMN cliente_nombre TO client_name;
  -- ALTER TABLE reservations RENAME COLUMN cliente_telefono TO client_phone;
  -- ALTER TABLE reservations RENAME COLUMN cliente_cedula TO client_document;
  -- ALTER TABLE reservations RENAME COLUMN cliente_ciudad TO client_city;
  -- ALTER TABLE reservations RENAME COLUMN cliente_direccion TO client_address;
  -- ALTER TABLE reservations RENAME COLUMN cliente_email TO client_email;
  -- ALTER TABLE reservations RENAME COLUMN estado_reserva TO status;

END $$;

-- =============================================
-- 2. Create reservation_items table if not exists
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
-- 3. Add indexes if not exist
-- =============================================
CREATE INDEX IF NOT EXISTS idx_reservations_client_phone ON reservations(client_phone);
CREATE INDEX IF NOT EXISTS idx_reservations_client_id ON reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservation_items_reserva ON reservation_items(reserva_id);

-- =============================================
-- 4. Update trigger for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. Enable RLS if not enabled
-- =============================================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. Functions
-- =============================================
-- agregar_abono function
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
  SELECT * INTO v_reserva FROM reservations WHERE id = p_reserva_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva no encontrada';
  END IF;
  
  v_nuevo_abono := v_reserva.abono + p_monto;
  v_nuevo_saldo := v_reserva.total - v_nuevo_abono;
  v_es_final := v_nuevo_saldo <= 0;
  
  v_abono_record := jsonb_build_object(
    'id', 'AB-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'reserva_id', p_reserva_id,
    'monto', p_monto,
    'fecha', NOW()::TEXT,
    'comprobante_url', p_comprobante_url,
    'notas', p_notas,
    'tipo', CASE WHEN v_es_final THEN 'final' ELSE 'parcial' END
  );
  
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

-- marcar_pagado_total function
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
-- 7. Verify the structure
-- =============================================
-- Run this to check your table structure:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'reservations' 
-- ORDER BY ordinal_position;
