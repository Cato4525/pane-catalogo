-- Add missing columns to reservations table
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cliente_ciudad TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cliente_email TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS notas_admin TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS estado_reserva VARCHAR(20) DEFAULT 'pendiente';

-- Copy data from 'estado' column if it exists
UPDATE reservations SET estado_reserva = estado WHERE estado IS NOT NULL AND estado_reserva IS NULL;

-- RLS policies for public insert
DROP POLICY IF EXISTS "reservations_public_insert" ON reservations;
CREATE POLICY "reservations_public_insert" ON reservations FOR INSERT WITH CHECK (true);

-- Allow authenticated users to update their own reservations
DROP POLICY IF EXISTS "users_update_own_reservations" ON reservations;
CREATE POLICY "users_update_own_reservations" ON reservations 
  FOR UPDATE USING (auth.uid() = client_id);
