-- =====================================================
-- MIGRATION 039: Crear sistema de campañas (promociones)
-- Copia TODO y pégalo en el SQL Editor de Supabase
--
-- Crea las tablas: campanias, campanias_reglas,
-- campanias_productos, campanias_filtros
-- =====================================================

-- ==================== 1. TABLA CAMPANIAS ====================
CREATE TABLE IF NOT EXISTS public.campanias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT DEFAULT '',
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('PRECIO_FIJO','PORCENTAJE','MONTO_FIJO','COMPRA_X_LLEVA_Y','COMBO','ENVIO_GRATIS')),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','inactivo','borrador')),
    catalogo_id UUID REFERENCES public.catalogos(id) ON DELETE SET NULL,
    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ,
    prioridad INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campanias_estado ON public.campanias(estado);
CREATE INDEX IF NOT EXISTS idx_campanias_fecha ON public.campanias(fecha_inicio, fecha_fin);

-- ==================== 2. TABLA REGLAS ====================
CREATE TABLE IF NOT EXISTS public.campanias_reglas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campania_id UUID NOT NULL REFERENCES public.campanias(id) ON DELETE CASCADE,
    tipo_regla VARCHAR(50) NOT NULL DEFAULT 'PRECIO_FIJO',
    cantidad_minima INTEGER DEFAULT 0,
    monto_minimo DECIMAL(10,2) DEFAULT 0,
    porcentaje DECIMAL(5,2) DEFAULT 0,
    precio_fijo DECIMAL(10,2) DEFAULT 0,
    envio_gratis BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campanias_reglas_campania ON public.campanias_reglas(campania_id);

-- ==================== 3. TABLA PRODUCTOS ====================
CREATE TABLE IF NOT EXISTS public.campanias_productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campania_id UUID NOT NULL REFERENCES public.campanias(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campanias_productos_campania ON public.campanias_productos(campania_id);
CREATE INDEX IF NOT EXISTS idx_campanias_productos_producto ON public.campanias_productos(producto_id);

-- ==================== 4. TABLA FILTROS ====================
CREATE TABLE IF NOT EXISTS public.campanias_filtros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campania_id UUID NOT NULL REFERENCES public.campanias(id) ON DELETE CASCADE,
    campo VARCHAR(100) NOT NULL,
    operador VARCHAR(20) NOT NULL DEFAULT '=',
    valor VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campanias_filtros_campania ON public.campanias_filtros(campania_id);

-- ==================== 5. TRIGGER UPDATED_AT ====================
CREATE OR REPLACE FUNCTION public.update_campanias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_campanias_updated_at ON public.campanias;
CREATE TRIGGER trg_campanias_updated_at
    BEFORE UPDATE ON public.campanias
    FOR EACH ROW
    EXECUTE FUNCTION public.update_campanias_updated_at();

-- ==================== 6. ROW LEVEL SECURITY ====================
ALTER TABLE public.campanias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanias_reglas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanias_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanias_filtros ENABLE ROW LEVEL SECURITY;

-- Políticas para CAMPANIAS
DROP POLICY IF EXISTS "campanias_select_public" ON public.campanias;
CREATE POLICY "campanias_select_public"
    ON public.campanias FOR SELECT TO anon, authenticated
    USING (estado = 'activo' AND (fecha_inicio IS NULL OR fecha_inicio <= NOW()) AND (fecha_fin IS NULL OR fecha_fin >= NOW()));

DROP POLICY IF EXISTS "campanias_all_admin" ON public.campanias;
CREATE POLICY "campanias_all_admin"
    ON public.campanias FOR ALL TO authenticated
    USING (public.get_current_user_rol() = 'admin');

-- Políticas para REGLAS
DROP POLICY IF EXISTS "campanias_reglas_select_public" ON public.campanias_reglas;
CREATE POLICY "campanias_reglas_select_public"
    ON public.campanias_reglas FOR SELECT TO anon, authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "campanias_reglas_all_admin" ON public.campanias_reglas;
CREATE POLICY "campanias_reglas_all_admin"
    ON public.campanias_reglas FOR ALL TO authenticated
    USING (public.get_current_user_rol() = 'admin');

-- Políticas para PRODUCTOS
DROP POLICY IF EXISTS "campanias_productos_select_public" ON public.campanias_productos;
CREATE POLICY "campanias_productos_select_public"
    ON public.campanias_productos FOR SELECT TO anon, authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "campanias_productos_all_admin" ON public.campanias_productos;
CREATE POLICY "campanias_productos_all_admin"
    ON public.campanias_productos FOR ALL TO authenticated
    USING (public.get_current_user_rol() = 'admin');

-- Políticas para FILTROS
DROP POLICY IF EXISTS "campanias_filtros_select_public" ON public.campanias_filtros;
CREATE POLICY "campanias_filtros_select_public"
    ON public.campanias_filtros FOR SELECT TO anon, authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "campanias_filtros_all_admin" ON public.campanias_filtros;
CREATE POLICY "campanias_filtros_all_admin"
    ON public.campanias_filtros FOR ALL TO authenticated
    USING (public.get_current_user_rol() = 'admin');

-- ==================== 7. VERIFICACIÓN ====================
-- Descomenta para verificar:
-- SELECT * FROM public.campanias LIMIT 5;
-- SELECT * FROM public.campanias_reglas LIMIT 5;
-- SELECT * FROM public.campanias_productos LIMIT 5;
-- SELECT * FROM public.campanias_filtros LIMIT 5;
