-- =====================================================
-- MIGRATION 035: Fix RLS policies for direct_sales
-- Después de renombrar ventas_directas → direct_sales
-- las políticas originales requieren TO authenticated
-- y permisos específicos. Las cambiamos a políticas
-- simples como las de reservations.
-- =====================================================

-- =====================================================
-- 1. POLICIES FOR direct_sales
-- =====================================================
DROP POLICY IF EXISTS "ventas_directas_select" ON public.direct_sales;
DROP POLICY IF EXISTS "ventas_directas_insert" ON public.direct_sales;
DROP POLICY IF EXISTS "ventas_directas_update" ON public.direct_sales;
DROP POLICY IF EXISTS "ventas_directas_delete" ON public.direct_sales;

CREATE POLICY "direct_sales_select"
ON public.direct_sales FOR SELECT
USING (true);

CREATE POLICY "direct_sales_insert"
ON public.direct_sales FOR INSERT
WITH CHECK (true);

CREATE POLICY "direct_sales_update"
ON public.direct_sales FOR UPDATE
USING (true);

CREATE POLICY "direct_sales_delete"
ON public.direct_sales FOR DELETE
USING (true);

-- =====================================================
-- 2. POLICIES FOR pos_orders (si existe)
-- =====================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pos_orders'
  ) THEN
    DROP POLICY IF EXISTS "pedidos_select" ON public.pos_orders;
    DROP POLICY IF EXISTS "pedidos_insert" ON public.pos_orders;
    DROP POLICY IF EXISTS "pedidos_update" ON public.pos_orders;
    DROP POLICY IF EXISTS "pedidos_delete" ON public.pos_orders;

    CREATE POLICY "pos_orders_select"
    ON public.pos_orders FOR SELECT
    USING (true);

    CREATE POLICY "pos_orders_insert"
    ON public.pos_orders FOR INSERT
    WITH CHECK (true);

    CREATE POLICY "pos_orders_update"
    ON public.pos_orders FOR UPDATE
    USING (true);

    CREATE POLICY "pos_orders_delete"
    ON public.pos_orders FOR DELETE
    USING (true);
  END IF;
END $$;

-- =====================================================
-- 3. DROP FK que apunta a clientes (español)
--    La app usa UUIDs de clients (inglés)
--    El nombre se guarda como texto, el FK sobra
-- =====================================================
ALTER TABLE IF EXISTS public.direct_sales
DROP CONSTRAINT IF EXISTS ventas_directas_cliente_id_fkey;

-- =====================================================
-- 4. ACTUALIZAR CHECK CONSTRAINT DE reservations.origen
--    La app envía 'store' | 'pos', pero la DB solo
--    acepta 'tienda' | 'pos'
-- =====================================================
ALTER TABLE IF EXISTS public.reservations
DROP CONSTRAINT IF EXISTS reservations_origen_check;

ALTER TABLE IF EXISTS public.reservations
ADD CONSTRAINT reservations_origen_check
CHECK (origen IN ('store', 'pos', 'tienda'));

-- Actualizar registros existentes: 'tienda' → 'store'
UPDATE public.reservations SET origen = 'store' WHERE origen = 'tienda';

-- =====================================================
-- 5. VISTAS PARA FILTRAR reservations por origen
-- =====================================================
CREATE OR REPLACE VIEW public.store_reservations AS
SELECT * FROM public.reservations WHERE origen = 'store';

CREATE OR REPLACE VIEW public.pos_reservations AS
SELECT * FROM public.reservations WHERE origen = 'pos';

-- =====================================================
-- 6. POLICIES RLS PARA LAS VISTAS
-- =====================================================
ALTER VIEW public.store_reservations OWNER TO authenticated;
ALTER VIEW public.pos_reservations OWNER TO authenticated;

-- =====================================================
-- 7. VERIFICACIÓN
-- =====================================================
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('direct_sales', 'pos_orders')
ORDER BY tablename, policyname;
