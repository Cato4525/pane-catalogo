-- Migration: Add color_tipo to product_variants
-- Cada variante (color+size) puede tener su propio tipo de color
-- para permitir promociones diferentes por color dentro del mismo producto.
-- Ej: Andromeda Negro (oscuro) + Andromeda Beige (claro) en distintas promos.

ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS color_tipo VARCHAR(50) DEFAULT '';

COMMENT ON COLUMN product_variants.color_tipo IS 'Tipo de color para promociones: oscuro, claro, color, negro, blanco, neutro, exclusivo, premium, temporada, navidad, black_friday';

CREATE INDEX IF NOT EXISTS idx_variants_color_tipo ON product_variants(product_id, color_tipo);

-- Migrar datos existentes: copiar color_tipo de products a todas sus variantes
UPDATE product_variants pv
SET color_tipo = p.color_tipo
FROM products p
WHERE pv.product_id = p.id
  AND (pv.color_tipo IS NULL OR pv.color_tipo = '')
  AND p.color_tipo IS NOT NULL
  AND p.color_tipo != '';
