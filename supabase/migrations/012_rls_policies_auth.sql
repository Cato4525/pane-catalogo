-- =====================================================
-- POLÍTICAS RLS PARA PRODUCTOS, COLORES Y TALLAS
-- Actualizado para permitir operaciones autenticadas
-- =====================================================

-- =====================================================
-- 1. TABLA: products
-- =====================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_insert" ON products;
DROP POLICY IF EXISTS "products_public_update" ON products;
DROP POLICY IF EXISTS "products_public_delete" ON products;
DROP POLICY IF EXISTS "products_admin_vendedor_insert" ON products;
DROP POLICY IF EXISTS "products_admin_update" ON products;
DROP POLICY IF EXISTS "products_admin_delete" ON products;

CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (true);

CREATE POLICY "products_auth_insert" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "products_auth_update" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "products_auth_delete" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- 2. TABLA: categories
-- =====================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_auth_insert" ON categories;
DROP POLICY IF EXISTS "categories_auth_update" ON categories;
DROP POLICY IF EXISTS "categories_auth_delete" ON categories;

CREATE POLICY "categories_public_read" ON categories
  FOR SELECT USING (true);

CREATE POLICY "categories_auth_insert" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "categories_auth_update" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "categories_auth_delete" ON categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- 3. TABLA: colors
-- =====================================================
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "colors_public_read" ON colors;
DROP POLICY IF EXISTS "colors_auth_insert" ON colors;
DROP POLICY IF EXISTS "colors_auth_update" ON colors;
DROP POLICY IF EXISTS "colors_auth_delete" ON colors;

CREATE POLICY "colors_public_read" ON colors
  FOR SELECT USING (true);

CREATE POLICY "colors_auth_insert" ON colors
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "colors_auth_update" ON colors
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "colors_auth_delete" ON colors
  FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- 4. TABLA: sizes
-- =====================================================
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sizes_public_read" ON sizes;
DROP POLICY IF EXISTS "sizes_auth_insert" ON sizes;
DROP POLICY IF EXISTS "sizes_auth_update" ON sizes;
DROP POLICY IF EXISTS "sizes_auth_delete" ON sizes;

CREATE POLICY "sizes_public_read" ON sizes
  FOR SELECT USING (true);

CREATE POLICY "sizes_auth_insert" ON sizes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "sizes_auth_update" ON sizes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "sizes_auth_delete" ON sizes
  FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- 5. TABLA: models
-- =====================================================
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "models_public_read" ON models;
DROP POLICY IF EXISTS "models_auth_insert" ON models;
DROP POLICY IF EXISTS "models_auth_update" ON models;
DROP POLICY IF EXISTS "models_auth_delete" ON models;

CREATE POLICY "models_public_read" ON models
  FOR SELECT USING (true);

CREATE POLICY "models_auth_insert" ON models
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "models_auth_update" ON models
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "models_auth_delete" ON models
  FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- 6. TABLA: product_colors (relación producto-color)
-- =====================================================
ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_colors_public_read" ON product_colors;
DROP POLICY IF EXISTS "product_colors_auth_insert" ON product_colors;
DROP POLICY IF EXISTS "product_colors_auth_delete" ON product_colors;

CREATE POLICY "product_colors_public_read" ON product_colors
  FOR SELECT USING (true);

CREATE POLICY "product_colors_auth_insert" ON product_colors
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "product_colors_auth_delete" ON product_colors
  FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- 7. TABLA: product_sizes (relación producto-talla con stock)
-- =====================================================
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_sizes_public_read" ON product_sizes;
DROP POLICY IF EXISTS "product_sizes_auth_insert" ON product_sizes;
DROP POLICY IF EXISTS "product_sizes_auth_update" ON product_sizes;
DROP POLICY IF EXISTS "product_sizes_auth_delete" ON product_sizes;

CREATE POLICY "product_sizes_public_read" ON product_sizes
  FOR SELECT USING (true);

CREATE POLICY "product_sizes_auth_insert" ON product_sizes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "product_sizes_auth_update" ON product_sizes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "product_sizes_auth_delete" ON product_sizes
  FOR DELETE USING (auth.role() = 'authenticated');