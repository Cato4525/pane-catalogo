-- Migration: Create product_variants table (unified table for color + size + stock)
-- Replace product_colors and product_sizes with single table

-- Tabla product_variants (una sola tabla para color + talla + stock)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_id UUID REFERENCES colors(id) ON DELETE SET NULL,
  size_id UUID REFERENCES sizes(id) ON DELETE SET NULL,
  stock INTEGER DEFAULT 0,
  precio DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, color_id, size_id)
);

-- RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "variants_all" ON product_variants;
CREATE POLICY "variants_all" ON product_variants FOR ALL USING (true) WITH CHECK (true);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON product_variants TO anon, authenticated;

-- Índice para búsquedas rápidas
DROP INDEX IF EXISTS idx_variants_product;
CREATE INDEX idx_variants_product ON product_variants(product_id);
DROP INDEX IF EXISTS idx_variants_product_color;
CREATE INDEX idx_variants_product_color ON product_variants(product_id, color_id);
DROP INDEX IF EXISTS idx_variants_product_size;
CREATE INDEX idx_variants_product_size ON product_variants(product_id, size_id);

-- Funciones helper
-- Obtener variantes de un producto
CREATE OR REPLACE FUNCTION get_product_variants(p_product_id UUID)
RETURNS TABLE(
  variant_id UUID,
  product_id UUID,
  color_id UUID,
  color_nombre TEXT,
  color_hex TEXT,
  size_id UUID,
  size_nombre TEXT,
  stock INTEGER,
  precio DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.id,
    pv.product_id,
    pv.color_id,
    c.nombre::TEXT,
    c.codigo_hex::TEXT,
    pv.size_id,
    s.nombre::TEXT,
    pv.stock,
    pv.precio
  FROM product_variants pv
  LEFT JOIN colors c ON pv.color_id = c.id
  LEFT JOIN sizes s ON pv.size_id = s.id
  WHERE pv.product_id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Descontar stock
CREATE OR REPLACE FUNCTION descontar_stock_variant(
  p_product_id UUID,
  p_color_id UUID,
  p_size_id UUID,
  p_cantidad INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  SELECT stock INTO v_current_stock 
  FROM product_variants 
  WHERE product_id = p_product_id 
    AND COALESCE(color_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p_color_id, '00000000-0000-0000-0000-000000000000')
    AND COALESCE(size_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p_size_id, '00000000-0000-0000-0000-000000000000')
  LIMIT 1;

  IF v_current_stock IS NULL OR v_current_stock < p_cantidad THEN
    RETURN FALSE;
  END IF;

  UPDATE product_variants 
  SET stock = stock - p_cantidad,
      updated_at = NOW()
  WHERE product_id = p_product_id 
    AND COALESCE(color_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p_color_id, '00000000-0000-0000-0000-000000000000')
    AND COALESCE(size_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p_size_id, '00000000-0000-0000-0000-000000000000');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agregar stock
CREATE OR REPLACE FUNCTION agregar_stock_variant(
  p_product_id UUID,
  p_color_id UUID,
  p_size_id UUID,
  p_cantidad INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE product_variants 
  SET stock = stock + p_cantidad,
      updated_at = NOW()
  WHERE product_id = p_product_id 
    AND COALESCE(color_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p_color_id, '00000000-0000-0000-0000-000000000000')
    AND COALESCE(size_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p_size_id, '00000000-0000-0000-0000-000000000000');

  IF NOT FOUND THEN
    INSERT INTO product_variants (product_id, color_id, size_id, stock)
    VALUES (p_product_id, p_color_id, p_size_id, p_cantidad);
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
