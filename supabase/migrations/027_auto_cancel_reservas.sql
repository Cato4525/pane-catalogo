-- =============================================
-- MIGRATION: Auto-cancel reservas after 24h
-- =============================================
-- Cancela automáticamente reservas pendientes sin abono después de 24h

-- =============================================
-- 1. Function to cancel expired reservas (24h)
-- =============================================
CREATE OR REPLACE FUNCTION cancel_expired_reservas()
RETURNS void AS $$
BEGIN
  -- Cancelar reservas pendientes creadas hace más de 24 horas
  -- que NO tienen comprobante verificado
  UPDATE reservations
  SET 
    status = 'cancelado',
    notas_admin = COALESCE(notas_admin, '') || ' | CANCELADA AUTOMÁTICAMENTE: Plazo de 24h excedido sin comprobante'
  WHERE 
    status = 'pendiente'
    AND fecha_reserva < NOW() - INTERVAL '24 hours'
    AND (comprobante_verificado = FALSE OR comprobante_verificado IS NULL)
    AND (abono IS NULL OR abono = 0);
    
  -- Log how many were cancelled
  RAISE NOTICE 'Reservas canceladas automáticamente: %', FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. Create a cron job to run every hour (if pg_cron is available)
-- =============================================
-- Note: This requires the pg_cron extension to be enabled in Supabase
-- To enable it, go to Database > Extensions and enable "pg_cron"

-- Uncomment if pg_cron is available:
-- SELECT cron.schedule(
--   'cancel-expired-reservas-every-hour',
--   '0 * * * *',  -- Every hour
--   'SELECT cancel_expired_reservas()'
-- );

-- =============================================
-- 3. Alternative: Manual trigger function
-- =============================================
-- You can also call this function manually or via an edge function
-- SELECT cancel_expired_reservas();

-- =============================================
-- 4. Update the reserva status check function
-- =============================================
-- Function to check if a reserva is expired (for frontend)
CREATE OR REPLACE FUNCTION is_reserva_expired(p_reserva_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_fecha_reserva TIMESTAMPTZ;
  v_status VARCHAR;
  v_comprobante_verificado BOOLEAN;
  v_abono DECIMAL;
BEGIN
  SELECT fecha_reserva, status, comprobante_verificado, abono
  INTO v_fecha_reserva, v_status, v_comprobante_verificado, v_abono
  FROM reservations
  WHERE id = p_reserva_id;
  
  -- If already cancelled or confirmed, not expired
  IF v_status IN ('cancelado', 'confirmado') THEN
    RETURN FALSE;
  END IF;
  
  -- If more than 24h and no payment proof
  IF v_fecha_reserva < NOW() - INTERVAL '24 hours' 
     AND (v_comprobante_verificado = FALSE OR v_comprobante_verificado IS NULL)
     AND (v_abono IS NULL OR v_abono = 0) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
