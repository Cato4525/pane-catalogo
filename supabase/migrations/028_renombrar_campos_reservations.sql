-- =============================================
-- MIGRATION: Renombrar campos de reservations a español
-- =============================================
-- Para que coincidan con el tipo Reserva y la tabla clients

-- =============================================
-- 1. Renombrar campos de cliente (inglés → español)
-- =============================================
DO $$
BEGIN
  -- Renombrar client_name → cliente_nombre
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'client_name') THEN
    ALTER TABLE reservations RENAME COLUMN client_name TO cliente_nombre;
  END IF;

  -- Renombrar client_phone → cliente_telefono
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'client_phone') THEN
    ALTER TABLE reservations RENAME COLUMN client_phone TO cliente_telefono;
  END IF;

  -- Renombrar client_document → cliente_cedula
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'client_document') THEN
    ALTER TABLE reservations RENAME COLUMN client_document TO cliente_cedula;
  END IF;

  -- Renombrar client_city → cliente_ciudad
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'client_city') THEN
    ALTER TABLE reservations RENAME COLUMN client_city TO cliente_ciudad;
  END IF;

  -- Renombrar client_address → cliente_direccion
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'client_address') THEN
    ALTER TABLE reservations RENAME COLUMN client_address TO cliente_direccion;
  END IF;

  -- Renombrar client_email → cliente_email
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'client_email') THEN
    ALTER TABLE reservations RENAME COLUMN client_email TO cliente_email;
  END IF;

  -- Renombrar status → estado_reserva
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'status') THEN
    ALTER TABLE reservations RENAME COLUMN status TO estado_reserva;
  END IF;
END $$;

-- =============================================
-- 2. Mantener compatibilidad: crear VISTAS o TRIGGERS
-- =============================================
-- (Opcional) Si hay código que usa los nombres en inglés, 
-- puedes crear una vista temporal:
-- CREATE OR REPLACE VIEW reservations_en AS
-- SELECT 
--   id, codigo, cliente_id,
--   cliente_nombre as client_name,
--   cliente_telefono as client_phone,
--   cliente_cedula as client_document,
--   cliente_ciudad as client_city,
--   cliente_direccion as client_address,
--   cliente_email as client_email,
--   estado_reserva as status,
--   total, abono, saldo, ...
-- FROM reservations;

-- =============================================
-- 3. Verificar estructura final
-- =============================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'reservations'
-- ORDER BY ordinal_position;
