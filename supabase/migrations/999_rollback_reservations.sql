-- =============================================
-- ROLLBACK: Remove Reservations System
-- =============================================
-- Use this if you need to remove the reservations system

-- =============================================
-- 1. Drop triggers
-- =============================================
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
DROP TRIGGER IF EXISTS set_reserva_codigo_trigger ON reservations;

-- =============================================
-- 2. Drop functions
-- =============================================
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS set_reserva_codigo();
DROP FUNCTION IF EXISTS generate_reserva_codigo();
DROP FUNCTION IF EXISTS agregar_abono(UUID, DECIMAL, TEXT, TEXT);
DROP FUNCTION IF EXISTS marcar_pagado_total(UUID);

-- =============================================
-- 3. Drop tables
-- =============================================
DROP TABLE IF EXISTS reservation_items;
DROP TABLE IF EXISTS reservations;

-- =============================================
-- 4. Drop policies (if using RLS)
-- =============================================
DROP POLICY IF EXISTS "Users can view own reservations by phone" ON reservations;
DROP POLICY IF EXISTS "Admins can do anything with reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view own reservation items" ON reservation_items;
DROP POLICY IF EXISTS "Admins can do anything with reservation items" ON reservation_items;

-- =============================================
-- 5. Disable RLS
-- =============================================
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items DISABLE ROW LEVEL SECURITY;
-- escript coregido a ejecuar, -- =============================================
-- 1. Drop policies
-- =============================================
DROP POLICY IF EXISTS "Users can view own reservations by phone" ON reservations;
DROP POLICY IF EXISTS "Admins can do anything with reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view own reservation items" ON reservation_items;
DROP POLICY IF EXISTS "Admins can do anything with reservation items" ON reservation_items;

-- =============================================
-- 2. Disable RLS
-- =============================================
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. Drop triggers
-- =============================================
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
DROP TRIGGER IF EXISTS set_reserva_codigo_trigger ON reservations;

-- =============================================
-- 4. Drop tables
-- =============================================
DROP TABLE IF EXISTS reservation_items CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;

-- =============================================
-- 5. Drop functions
-- =============================================
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS set_reserva_codigo() CASCADE;
DROP FUNCTION IF EXISTS generate_reserva_codigo() CASCADE;
DROP FUNCTION IF EXISTS agregar_abono(UUID, DECIMAL, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS marcar_pagado_total(UUID) CASCADE;