-- =====================================================
-- AGREGAR CAMPO SKU A product_variants
-- Ejecutar en Supabase SQL Editor
-- =====================================================

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS sku TEXT;

-- Verificar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_variants' AND column_name = 'sku';
