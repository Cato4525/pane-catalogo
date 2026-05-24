-- =============================================
-- MIGRATION: Make cédula (documento) unique in clients table
-- =============================================

-- First, remove any duplicate cédula entries (keep the newest or first)
-- This query deletes duplicates, keeping the one with the latest fecha_registro
DELETE FROM clients a
WHERE a.ctid <> (
  SELECT MIN(b.ctid)
  FROM clients b
  WHERE a.documento = b.documento
    AND a.documento IS NOT NULL
    AND a.documento != ''
);

-- Add unique constraint
ALTER TABLE clients
  ADD CONSTRAINT IF NOT EXISTS clients_documento_unique UNIQUE (documento);

-- Also add unique constraint on user_id if not exists
ALTER TABLE clients
  ADD CONSTRAINT IF NOT EXISTS clients_user_id_unique UNIQUE (user_id);

-- Update upsert logic: if documento already exists, don't allow duplicate
-- This will be handled in application code
-- este es el codigo a ejecutr corregido, -- Eliminar duplicados por documento (mantiene el más antiguo según ctid)
DELETE FROM clients a
WHERE a.ctid <> (
  SELECT MIN(b.ctid)
  FROM clients b
  WHERE a.documento = b.documento
    AND a.documento IS NOT NULL
    AND a.documento <> ''
);
-- Agregar UNIQUE para documento si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clients_documento_unique'
  ) THEN
    ALTER TABLE clients
    ADD CONSTRAINT clients_documento_unique UNIQUE (documento);
  END IF;
END $$;
-- Agregar UNIQUE para user_id si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clients_user_id_unique'
  ) THEN
    ALTER TABLE clients
    ADD CONSTRAINT clients_user_id_unique UNIQUE (user_id);
  END IF;
END $$;