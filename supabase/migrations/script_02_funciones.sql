-- =====================================================
-- SCRIPT 2: CREAR FUNCIONES ÚTILES (Ejecutar una vez)
-- =====================================================
-- Funciones para gestionar reservas desde el panel admin

-- 1. Función para agregar abono (pago parcial)
CREATE OR REPLACE FUNCTION agregar_abono(
  p_reserva_id UUID,
  p_monto DECIMAL,
  p_comprobante_url TEXT DEFAULT NULL,
  p_notas TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_reserva RECORD;
  v_nuevo_abono DECIMAL;
  v_nuevo_saldo DECIMAL;
  v_abono_type VARCHAR(10);
  v_abono_record JSONB;
BEGIN
  -- Obtener reserva actual
  SELECT * INTO v_reserva FROM reservations WHERE id = p_reserva_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva no encontrada';
  END IF;
  
  -- Calcular nuevos valores
  v_nuevo_abono := v_reserva.abono + p_monto;
  v_nuevo_saldo := v_reserva.total - v_nuevo_abono;
  v_abono_type := CASE WHEN v_nuevo_saldo <= 0 THEN 'final' ELSE 'parcial' END;
  
  -- Crear registro del abono
  v_abono_record := jsonb_build_object(
    'id', 'AB-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
    'reserva_id', p_reserva_id,
    'monto', p_monto,
    'fecha', NOW()::TEXT,
    'comprobante_url', p_comprobante_url,
    'notas', p_notas,
    'tipo', v_abono_type
  );
  
  -- Actualizar reserva
  UPDATE reservations SET
    abono = v_nuevo_abono,
    saldo = GREATEST(0, v_nuevo_saldo),
    status = CASE WHEN v_nuevo_saldo <= 0 THEN 'confirmado' ELSE 'abonado' END,
    comprobante_verificado = COALESCE(p_comprobante_url IS NOT NULL, comprobante_verificado),
    abonos = COALESCE(abonos, '[]'::jsonb) || v_abono_record,
    updated_at = NOW()
  WHERE id = p_reserva_id;
  
  RAISE NOTICE 'Abono de $% agregado a reserva %', p_monto, p_reserva_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para marcar como pagado completo
CREATE OR REPLACE FUNCTION marcar_pagado_completo(p_reserva_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE reservations SET
    abono = total,
    saldo = 0,
    status = 'confirmado',
    updated_at = NOW()
  WHERE id = p_reserva_id;
  
  RAISE NOTICE 'Reserva % marcada como pagada', p_reserva_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Función para ver abonos de una reserva
CREATE OR REPLACE FUNCTION ver_abonos(p_reserva_id UUID)
RETURNS TABLE(
  id TEXT,
  monto DECIMAL,
  fecha TIMESTAMPTZ,
  tipo TEXT,
  notas TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (jsonb_array_elements(abonos)->>'id')::TEXT,
    (jsonb_array_elements(abonos)->>'monto')::DECIMAL,
    (jsonb_array_elements(abonos)->>'fecha')::TIMESTAMPTZ,
    (jsonb_array_elements(abonos)->>'tipo')::TEXT,
    (jsonb_array_elements(abonos)->>'notas')::TEXT
  FROM reservations
  WHERE id = p_reserva_id AND jsonb_array_length(abonos) > 0;
END;
$$ LANGUAGE plpgsql;

-- Verificar funciones creadas
SELECT 'Funciones creadas' AS resultado;