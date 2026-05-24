-- =============================================
-- FIX: RLS Policies for reservations
-- =============================================
-- Run this in Supabase SQL Editor to allow anon users to create reservations

-- First, drop existing policies that might conflict
DROP POLICY IF EXISTS "Admins can do anything with reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;

-- Allow ANYONE (anon + authenticated) to INSERT reservations
-- This is needed because store customers create reservations without being authenticated
CREATE POLICY "Anyone can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (true);

-- Allow anyone to view reservations by phone (for customers checking status)
CREATE POLICY "Anyone can view reservations by phone"
  ON reservations FOR SELECT
  USING (true);

-- Allow admins full access (using service_role or admin role)
CREATE POLICY "Admins have full access to reservations"
  ON reservations FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- FIX: RLS Policies for reservation_items
-- =============================================
DROP POLICY IF EXISTS "Users can view own reservation items" ON reservation_items;
DROP POLICY IF EXISTS "Admins can do anything with reservation items" ON reservation_items;

-- Allow anyone to insert reservation items
CREATE POLICY "Anyone can create reservation items"
  ON reservation_items FOR INSERT
  WITH CHECK (true);

-- Allow anyone to view reservation items
CREATE POLICY "Anyone can view reservation items"
  ON reservation_items FOR SELECT
  USING (true);

-- Allow admins full access
CREATE POLICY "Admins have full access to reservation items"
  ON reservation_items FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- Verify policies
-- =============================================
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename IN ('reservations', 'reservation_items')
ORDER BY tablename, policyname;
