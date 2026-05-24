-- =====================================================
-- 20240401000000_clients_rls_policies.sql
-- Add RLS policies for client table
-- =====================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "clients_public_insert" ON clients;
DROP POLICY IF EXISTS "clients_public_read" ON clients;
DROP POLICY IF EXISTS "clients_public_update" ON clients;
DROP POLICY IF EXISTS "clients_admin_insert" ON clients;
DROP POLICY IF EXISTS "clients_admin_update" ON clients;
DROP POLICY IF EXISTS "clients_admin_delete" ON clients;

-- Allow public insert (for client self-registration from store)
CREATE POLICY "clients_public_insert" ON clients
  FOR INSERT WITH CHECK (true);

-- Allow public read (for client lookup from store)
CREATE POLICY "clients_public_read" ON clients
  FOR SELECT USING (true);

-- Allow public update (for client to complete their registration)
CREATE POLICY "clients_public_update" ON clients
  FOR UPDATE USING (true);

-- Allow admin/vendedor to insert clients from admin panel
CREATE POLICY "clients_admin_insert" ON clients
  FOR INSERT WITH CHECK (
    public.get_current_user_rol() IN ('admin', 'vendedor')
  );

-- Allow admin/vendedor to update clients from admin panel
CREATE POLICY "clients_admin_update" ON clients
  FOR UPDATE USING (
    public.get_current_user_rol() IN ('admin', 'vendedor')
  );

-- Allow admin/vendedor to delete clients from admin panel
CREATE POLICY "clients_admin_delete" ON clients
  FOR DELETE USING (
    public.get_current_user_rol() IN ('admin', 'vendedor')
  );
