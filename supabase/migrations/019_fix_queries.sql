-- =====================================================
-- CORREGIR CONSULTAS DE product_queries Y reservations
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Verificar que las tablas existen
SELECT 'Tablas existentes:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('product_queries', 'reservations');

-- 2. Habilitar RLS si no está habilitado
ALTER TABLE product_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas problemáticas
DROP POLICY IF EXISTS "product_queries_leen" ON product_queries;
DROP POLICY IF EXISTS "product_queries_insert" ON product_queries;
DROP POLICY IF EXISTS "product_queries_admin_update" ON product_queries;
DROP POLICY IF EXISTS "product_queries_read" ON product_queries;

DROP POLICY IF EXISTS "reservations_read" ON reservations;
DROP POLICY IF EXISTS "reservations_insert" ON reservations;
DROP POLICY IF EXISTS "reservations_update" ON reservations;
DROP POLICY IF EXISTS "reservations_leen" ON reservations;

-- 4. Crear políticas simples
CREATE POLICY "product_queries_read" ON product_queries FOR SELECT USING (true);
CREATE POLICY "product_queries_insert" ON product_queries FOR INSERT WITH CHECK (true);

CREATE POLICY "reservations_read" ON reservations FOR SELECT USING (true);
CREATE POLICY "reservations_insert" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "reservations_update" ON reservations FOR UPDATE USING (true);

-- 5. Verificar que hay datos
SELECT 'Datos en product_queries:' as info, COUNT(*) as total FROM product_queries;
SELECT 'Datos en reservations:' as info, COUNT(*) as total FROM reservations;

-- 6. Probar consulta simple
SELECT * FROM product_queries LIMIT 1;
SELECT * FROM reservations LIMIT 1;
