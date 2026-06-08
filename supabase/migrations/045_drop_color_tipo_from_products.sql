-- =====================================================
-- MIGRATION 045: Drop color_tipo from products table
-- =====================================================
-- IMPORTANTE: Ejecutar SOLO después de 043_add_color_tipo_variants.sql
-- para asegurar que los datos ya fueron migrados a product_variants

ALTER TABLE IF EXISTS public.products
DROP COLUMN IF EXISTS color_tipo;

DROP INDEX IF EXISTS idx_products_color_tipo;