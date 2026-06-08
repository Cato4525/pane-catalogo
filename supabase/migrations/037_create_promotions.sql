-- =====================================================
-- MIGRATION 037: Promotions system
-- =====================================================

-- 1. PROMOTIONS TABLE
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

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions_select_public"
ON public.promotions FOR SELECT TO anon, authenticated
USING (activo = true AND (fecha_fin IS NULL OR fecha_fin > NOW()));

CREATE POLICY "promotions_select_admin"
ON public.promotions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "promotions_insert"
ON public.promotions FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'admin'));

CREATE POLICY "promotions_update"
ON public.promotions FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'admin'));

CREATE POLICY "promotions_delete"
ON public.promotions FOR DELETE TO authenticated
USING (public.has_permission(auth.uid(), 'admin'));

-- 2. ADD promotion_category AND color_tipo TO products
ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS promotion_category VARCHAR(50) DEFAULT '',
ADD COLUMN IF NOT EXISTS color_tipo VARCHAR(50) DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_products_promotion_category ON public.products(promotion_category);
CREATE INDEX IF NOT EXISTS idx_products_color_tipo ON public.products(color_tipo);

-- 3. ADD promo columns TO direct_sales
ALTER TABLE IF EXISTS public.direct_sales
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS descuento_total DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS envio DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS promociones_aplicadas JSONB DEFAULT '[]'::jsonb;

-- 4. ADD promo columns TO sales_items
ALTER TABLE IF EXISTS public.sales_items
ADD COLUMN IF NOT EXISTS descuento_aplicado DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_original DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_final DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS promocion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS promocion_nombre VARCHAR(255) DEFAULT '';
