
--RLS correcto para product_variants

Usa este bloque limpio:
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "variants_public_read" ON product_variants;
DROP POLICY IF EXISTS "variants_auth_insert" ON product_variants;
DROP POLICY IF EXISTS "variants_auth_update" ON product_variants;

DROP POLICY IF EXISTS "variants_auth_delete" ON product_variants;

CREATE POLICY "variants_public_read" ON product_variants
FOR SELECT USING (true);

CREATE POLICY "variants_auth_insert" ON product_variants
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "variants_auth_update" ON product_variants
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "variants_auth_delete" ON product_variants
FOR DELETE USING (auth.role() = 'authenticated');


ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "products_auth_insert" ON products;
DROP POLICY IF EXISTS "products_auth_update" ON products;
DROP POLICY IF EXISTS "products_auth_delete" ON products;

CREATE POLICY "products_public_read" ON products
FOR SELECT USING (true);

CREATE POLICY "products_auth_insert" ON products
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "products_auth_update" ON products
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "products_auth_delete" ON products
FOR DELETE USING (auth.role() = 'authenticated');
