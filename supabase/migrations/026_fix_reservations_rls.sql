-- =============================================
-- MIGRATION: Fix Reservations RLS Policies
-- =============================================
-- Run this in Supabase SQL Editor
-- This allows store customers (anon) to create reservations

-- =============================================
-- 1. Drop existing policies that are too restrictive
-- =============================================
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can do anything with reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view own reservation items" ON reservation_items;
DROP POLICY IF EXISTS "Admins can do anything with reservation items" ON reservation_items;

-- =============================================
-- 2. Create new policies for reservations
-- =============================================

-- Allow ANYONE (anon + authenticated) to INSERT reservations
-- Store customers create reservations without being authenticated
CREATE POLICY "Anyone can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (true);

-- Allow anyone to view reservations (for status checking)
CREATE POLICY "Anyone can view reservations"
  ON reservations FOR SELECT
  USING (true);

-- Allow admins full access (using service_role or admin role in JWT)
CREATE POLICY "Admins full access reservations"
  ON reservations FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- 3. Create new policies for reservation_items
-- =============================================

-- Allow anyone to insert reservation items
CREATE POLICY "Anyone can create reservation items"
  ON reservation_items FOR INSERT
  WITH CHECK (true);

-- Allow anyone to view reservation items
CREATE POLICY "Anyone can view reservation items"
  ON reservation_items FOR SELECT
  USING (true);

-- Allow admins full access
CREATE POLICY "Admins full access reservation items"
  ON reservation_items FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- 4. Verify policies (optional - run to check)
-- =============================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('reservations', 'reservation_items')
-- ORDER BY tablename, policyname;
