-- =====================================================
-- MIGRATION 040: Crear sistema de catálogos
-- =====================================================

-- 1. TABLA CATALOGOS
CREATE TABLE IF NOT EXISTS public.catalogos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT DEFAULT '',
    tipo VARCHAR(20) NOT NULL DEFAULT 'personalizado' CHECK (tipo IN ('sistema', 'personalizado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA CATALOGOS_PRODUCTOS (relación N:M con fecha de vencimiento)
CREATE TABLE IF NOT EXISTS public.catalogos_productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalogo_id UUID NOT NULL REFERENCES public.catalogos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL,
    fecha_vencimiento TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_catalogos_productos_catalogo_id ON public.catalogos_productos(catalogo_id);
CREATE INDEX IF NOT EXISTS idx_catalogos_productos_producto_id ON public.catalogos_productos(producto_id);
CREATE INDEX IF NOT EXISTS idx_catalogos_productos_vencimiento ON public.catalogos_productos(fecha_vencimiento);

-- 4. TRIGGER updated_at
CREATE OR REPLACE FUNCTION public.update_catalogos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_catalogos_updated_at ON public.catalogos;
CREATE TRIGGER trg_catalogos_updated_at
BEFORE UPDATE ON public.catalogos
FOR EACH ROW EXECUTE FUNCTION public.update_catalogos_updated_at();

-- 5. SEED: Crear catálogos por defecto (sistema)
INSERT INTO public.catalogos (nombre, descripcion, tipo) VALUES
    ('Todos', 'Todos los productos de la tienda', 'sistema'),
    ('Exclusivos', 'Productos exclusivos', 'sistema'),
    ('Tendencias', 'Productos en tendencia', 'sistema'),
    ('Clásicos', 'Productos clásicos', 'sistema')
ON CONFLICT DO NOTHING;

-- 6. ROW LEVEL SECURITY
ALTER TABLE public.catalogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogos_productos ENABLE ROW LEVEL SECURITY;

-- Política: cualquier usuario autenticado o anónimo puede leer
DROP POLICY IF EXISTS select_public ON public.catalogos;
CREATE POLICY select_public ON public.catalogos
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS select_public ON public.catalogos_productos;
CREATE POLICY select_public ON public.catalogos_productos
    FOR SELECT
    USING (true);

-- Política: solo admin puede insertar/actualizar/eliminar
DROP POLICY IF EXISTS all_admin ON public.catalogos;
CREATE POLICY all_admin ON public.catalogos
    FOR ALL
    USING (public.get_current_user_rol() = 'admin');

DROP POLICY IF EXISTS all_admin ON public.catalogos_productos;
CREATE POLICY all_admin ON public.catalogos_productos
    FOR ALL
    USING (public.get_current_user_rol() = 'admin');

-- 7. VERIFICACIÓN
-- SELECT * FROM public.catalogos;
-- SELECT * FROM public.catalogos_productos;
