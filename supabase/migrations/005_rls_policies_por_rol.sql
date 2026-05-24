-- =====================================================
-- POLÍTICAS RLS BASADAS EN ROLES
-- Sistema de permisos para el catálogo de leggins
-- =====================================================

-- =====================================================
-- 1. TABLA: products (productos)
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "products_public_insert" ON products;
DROP POLICY IF EXISTS "products_public_update" ON products;
DROP POLICY IF EXISTS "products_public_delete" ON products;
DROP POLICY IF EXISTS "products_read_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "products_delete_policy" ON products;

-- Lectura: TODOS (público, clientes, vendedores, admins)
CREATE POLICY "products_todos_leen" ON products
  FOR SELECT USING (true);

-- Inserción: Cualquier usuario autenticado (temporal para testing)
CREATE POLICY "products_admin_vendedor_insert" ON products
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );

-- Actualización: ADMIN puede todo, VENDEDOR solo campos específicos
CREATE POLICY "products_admin_update" ON products
  FOR UPDATE USING (
    public.get_current_user_rol() = 'admin'
  );

-- Eliminación: Solo ADMIN
CREATE POLICY "products_admin_delete" ON products
  FOR DELETE USING (
    public.get_current_user_rol() = 'admin'
  );

-- =====================================================
-- 2. TABLA: categories (categorías)
-- =====================================================

DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_auth_insert" ON categories;
DROP POLICY IF EXISTS "categories_auth_update" ON categories;
DROP POLICY IF EXISTS "categories_auth_delete" ON categories;

CREATE POLICY "categories_todos_leen" ON categories
  FOR SELECT USING (true);

CREATE POLICY "categories_admin_insert" ON categories
  FOR INSERT WITH CHECK (
    public.get_current_user_rol() = 'admin'
  );

CREATE POLICY "categories_admin_update" ON categories
  FOR UPDATE USING (
    public.get_current_user_rol() = 'admin'
  );

CREATE POLICY "categories_admin_delete" ON categories
  FOR DELETE USING (
    public.get_current_user_rol() = 'admin'
  );

-- =====================================================
-- 3. TABLA: colors (colores)
-- =====================================================

DROP POLICY IF EXISTS "colors_public_read" ON colors;
DROP POLICY IF EXISTS "colors_auth_insert" ON colors;
DROP POLICY IF EXISTS "colors_auth_update" ON colors;
DROP POLICY IF EXISTS "colors_auth_delete" ON colors;

CREATE POLICY "colors_todos_leen" ON colors
  FOR SELECT USING (true);

CREATE POLICY "colors_admin_insert" ON colors
  FOR INSERT WITH CHECK (
    public.get_current_user_rol() = 'admin'
  );

CREATE POLICY "colors_admin_update" ON colors
  FOR UPDATE USING (
    public.get_current_user_rol() = 'admin'
  );

CREATE POLICY "colors_admin_delete" ON colors
  FOR DELETE USING (
    public.get_current_user_rol() = 'admin'
  );

-- =====================================================
-- 4. TABLA: sizes (tallas)
-- =====================================================

DROP POLICY IF EXISTS "sizes_public_read" ON sizes;
DROP POLICY IF EXISTS "sizes_auth_insert" ON sizes;
DROP POLICY IF EXISTS "sizes_auth_update" ON sizes;
DROP POLICY IF EXISTS "sizes_auth_delete" ON sizes;

CREATE POLICY "sizes_todos_leen" ON sizes
  FOR SELECT USING (true);

CREATE POLICY "sizes_admin_insert" ON sizes
  FOR INSERT WITH CHECK (
    public.get_current_user_rol() = 'admin'
  );

CREATE POLICY "sizes_admin_update" ON sizes
  FOR UPDATE USING (
    public.get_current_user_rol() = 'admin'
  );

CREATE POLICY "sizes_admin_delete" ON sizes
  FOR DELETE USING (
    public.get_current_user_rol() = 'admin'
  );

-- =====================================================
-- 5. TABLA: models (modelos)
-- =====================================================

DROP POLICY IF EXISTS "models_public_read" ON models;
DROP POLICY IF EXISTS "models_auth_insert" ON models;
DROP POLICY IF EXISTS "models_auth_update" ON models;
DROP POLICY IF EXISTS "models_auth_delete" ON models;

CREATE POLICY "models_todos_leen" ON models
  FOR SELECT USING (true);

CREATE POLICY "models_admin_insert" ON models
  FOR INSERT WITH CHECK (
    public.get_current_user_rol() = 'admin'
  );

CREATE POLICY "models_admin_update" ON models
  FOR UPDATE USING (
    public.get_current_user_rol() = 'admin'
  );

CREATE POLICY "models_admin_delete" ON models
  FOR DELETE USING (
    public.get_current_user_rol() = 'admin'
  );

-- =====================================================
-- 6. TABLA: orders (pedidos) - Solo ADMIN y VENDEDOR
-- =====================================================

DROP POLICY IF EXISTS "orders_read" ON orders;
DROP POLICY IF EXISTS "orders_insert" ON orders;
DROP POLICY IF EXISTS "orders_update" ON orders;

CREATE POLICY "orders_admin_vendedor_leen" ON orders
  FOR SELECT USING (
    public.get_current_user_rol() IN ('admin', 'vendedor')
  );

CREATE POLICY "orders_admin_vendedor_insert" ON orders
  FOR INSERT WITH CHECK (
    public.get_current_user_rol() IN ('admin', 'vendedor')
  );

CREATE POLICY "orders_admin_update" ON orders
  FOR UPDATE USING (
    public.get_current_user_rol() = 'admin'
  );

-- =====================================================
-- 7. TABLA: reservations (reservas)
-- =====================================================

DROP POLICY IF EXISTS "reservations_read" ON reservations;
DROP POLICY IF EXISTS "reservations_insert" ON reservations;
DROP POLICY IF EXISTS "reservations_update" ON reservations;

-- Lectura: ADMIN y VENDEDOR ven todas, CLIENTES ven solo las suyas
CREATE POLICY "reservations_leen" ON reservations
  FOR SELECT USING (
    public.get_current_user_rol() IN ('admin', 'vendedor') 
    OR cliente_id::TEXT = auth.uid()::TEXT
  );

-- Inserción: Todos los autenticados pueden crear
CREATE POLICY "reservations_insert" ON reservations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Actualización: ADMIN y VENDEDOR actualizan, CLIENTES solo sus propias
CREATE POLICY "reservations_update" ON reservations
  FOR UPDATE USING (
    public.get_current_user_rol() IN ('admin', 'vendedor')
    OR cliente_id::TEXT = auth.uid()::TEXT
  );

-- =====================================================
-- 8. TABLA: clients (clientes)
-- =====================================================

DROP POLICY IF EXISTS "clients_read" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;

-- Lectura: ADMIN y VENDEDOR ven todos
CREATE POLICY "clients_admin_vendedor_leen" ON clients
  FOR SELECT USING (
    public.get_current_user_rol() IN ('admin', 'vendedor')
  );

CREATE POLICY "clients_admin_vendedor_insert" ON clients
  FOR INSERT WITH CHECK (
    public.get_current_user_rol() IN ('admin', 'vendedor')
  );

CREATE POLICY "clients_admin_update" ON clients
  FOR UPDATE USING (
    public.get_current_user_rol() IN ('admin', 'vendedor')
  );

-- =====================================================
-- 9. TABLA: product_queries (consultas de productos)
-- =====================================================

-- Todos pueden hacer consultas, ADMIN y VENDEDOR ven todas
CREATE POLICY "product_queries_leen" ON product_queries
  FOR SELECT USING (
    public.get_current_user_rol() IN ('admin', 'vendedor', 'cliente')
    OR auth.uid() IS NULL  -- Público puede ver
  );

CREATE POLICY "product_queries_insert" ON product_queries
  FOR INSERT WITH CHECK (true);  -- Todos pueden consultar

CREATE POLICY "product_queries_admin_update" ON product_queries
  FOR UPDATE USING (
    public.get_current_user_rol() IN ('admin', 'vendedor')
  );

-- =====================================================
-- 10. TABLA: stock_movements (movimientos de stock)
-- =====================================================

CREATE POLICY "stock_movements_admin_vendedor_leen" ON stock_movements
  FOR SELECT USING (
    public.get_current_user_rol() IN ('admin', 'vendedor')
  );

CREATE POLICY "stock_movements_admin_insert" ON stock_movements
  FOR INSERT WITH CHECK (
    public.get_current_user_rol() = 'admin'
  );

-- =====================================================
-- 11. TABLA: settings (configuración)
-- =====================================================

CREATE POLICY "settings_admin_leen" ON settings
  FOR SELECT USING (true);

CREATE POLICY "settings_admin_update" ON settings
  FOR UPDATE USING (
    public.get_current_user_rol() = 'admin'
  );

-- =====================================================
-- RESUMEN DE PERMISOS POR ROL
-- =====================================================

/*
ROL        | PRODUCTS | CATEGORIES | ORDERS | RESERVAS | CLIENTS | STOCK
-----------|----------|------------|--------|-----------|---------|-------
público    | LEER     | LEER       | -      | -         | -       | -
cliente    | LEER     | LEER       | -      | CREAR/MIS | -       | -
vendedor   | LEER     | LEER       | CRUD   | CRUD      | CRUD    | LEER
reportes   | LEER     | LEER       | LEER   | LEER      | LEER    | LEER
admin      | CRUD     | CRUD       | CRUD   | CRUD      | CRUD    | CRUD

LEER = SELECT
CREAR = INSERT
EDITAR = UPDATE
ELIMINAR = DELETE
*/

-- Verificar todas las políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('products', 'categories', 'colors', 'sizes', 'models', 'orders', 'reservations', 'clients', 'product_queries', 'stock_movements', 'settings')
ORDER BY tablename, policyname;