-- =====================================================
-- 20240402000000_add_user_id_to_clients.sql
-- Add user_id to link clients with Supabase Auth
-- =====================================================

-- Add user_id column to link with auth.users
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- Drop existing policies
DROP POLICY IF EXISTS "clients_public_read" ON clients;
DROP POLICY IF EXISTS "clients_public_insert" ON clients;
DROP POLICY IF EXISTS "clients_public_update" ON clients;
DROP POLICY IF EXISTS "clients_read_own" ON clients;
DROP POLICY IF EXISTS "clients_update_own" ON clients;
DROP POLICY IF EXISTS "clients_admin_manage" ON clients;

-- Allow public read (for client lookup from store)
CREATE POLICY "clients_public_read" ON clients
  FOR SELECT USING (true);

-- Allow public insert (for client self-registration from store)
CREATE POLICY "clients_public_insert" ON clients
  FOR INSERT WITH CHECK (true);

-- Allow public update (for client to complete their registration)
CREATE POLICY "clients_public_update" ON clients
  FOR UPDATE USING (true);

-- Allow authenticated users to read their own client record
CREATE POLICY "clients_read_own" ON clients
  FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to update their own client record
CREATE POLICY "clients_update_own" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow admin/vendedor to manage all clients
CREATE POLICY "clients_admin_manage" ON clients
  FOR ALL USING (
    public.get_current_user_rol() IN ('admin', 'vendedor')
  );
