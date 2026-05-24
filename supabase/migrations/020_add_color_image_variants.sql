-- =====================================================
-- AGREGAR COLUMNA color_image A product_variants
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Agregar columna para guardar imagen por color
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS color_image TEXT;

-- Agregar columna precio si no existe
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS precio DECIMAL(10,2) DEFAULT 0;

-- Verificar estructura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_variants';
