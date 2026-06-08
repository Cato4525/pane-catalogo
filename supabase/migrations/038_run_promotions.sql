-- =====================================================
-- MIGRATION 038: Ejecutar para activar promociones
-- Copia TODO y pégalo en el SQL Editor de Supabase
-- =====================================================

-- 1. Crear tabla de promociones
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('combo','quantity_discount','percentage_discount','free_shipping','category_discount')),
    descripcion TEXT DEFAULT '',
    activo BOOLEAN DEFAULT true,
    prioridad INTEGER DEFAULT 0,
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_fin TIMESTAMPTZ,
    reglas JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotions_activo ON public.promotions(activo);
CREATE INDEX IF NOT EXISTS idx_promotions_prioridad ON public.promotions(prioridad DESC);
CREATE INDEX IF NOT EXISTS idx_promotions_fechas ON public.promotions(fecha_inicio, fecha_fin);

-- 3. RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promotions_select_public" ON public.promotions;
CREATE POLICY "promotions_select_public"
ON public.promotions FOR SELECT TO anon, authenticated
USING (activo = true AND (fecha_fin IS NULL OR fecha_fin > NOW()));

DROP POLICY IF EXISTS "promotions_select_admin" ON public.promotions;
CREATE POLICY "promotions_select_admin"
ON public.promotions FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "promotions_insert" ON public.promotions;
CREATE POLICY "promotions_insert"
ON public.promotions FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('admin', 'gerente')));

DROP POLICY IF EXISTS "promotions_update" ON public.promotions;
CREATE POLICY "promotions_update"
ON public.promotions FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('admin', 'gerente')));

DROP POLICY IF EXISTS "promotions_delete" ON public.promotions;
CREATE POLICY "promotions_delete"
ON public.promotions FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('admin', 'gerente')));

-- 4. Columnas en products
ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS promotion_category VARCHAR(50) DEFAULT '',
ADD COLUMN IF NOT EXISTS color_tipo VARCHAR(50) DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_products_promotion_category ON public.products(promotion_category);
CREATE INDEX IF NOT EXISTS idx_products_color_tipo ON public.products(color_tipo);

-- 5. Columnas en direct_sales
ALTER TABLE IF EXISTS public.direct_sales
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS descuento_total DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS envio DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS promociones_aplicadas JSONB DEFAULT '[]'::jsonb;

-- 6. Columnas en sales_items
ALTER TABLE IF EXISTS public.sales_items
ADD COLUMN IF NOT EXISTS descuento_aplicado DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_original DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_final DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS promocion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS promocion_nombre VARCHAR(255) DEFAULT '';

-- 7. Verificar
SELECT '✅ Migración de promociones completada' AS resultado;
