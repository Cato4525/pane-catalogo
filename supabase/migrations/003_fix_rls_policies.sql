-- Script para permitir operaciones públicas en Supabase (para desarrollo)
-- Ejecutar en SQL Editor de Supabase

-- 1. Deshabilitar RLS temporalmente (para desarrollo)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- 2. O si prefieres mantener RLS, crear políticas menos restrictivas:
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "products_read_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "products_delete_policy" ON products;

-- Crear políticas más permisivas (solo para desarrollo)
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);
CREATE POLICY "products_public_insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "products_public_update" ON products FOR UPDATE USING (true);
CREATE POLICY "products_public_delete" ON products FOR DELETE USING (true);

-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Verificar políticas
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'products';