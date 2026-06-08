-- ============================================================
-- MIGRACIÓN 042: MOTOR DE CAMPAÑAS v2
-- Agrega columnas, tablas de exclusión, categorías, cupones y
-- registro de operaciones para el nuevo sistema de campañas
-- comerciales desacoplado.
-- ============================================================

-- ============================================================
-- 1. NUEVAS COLUMNAS EN campanias
-- ============================================================
ALTER TABLE IF EXISTS public.campanias
ADD COLUMN IF NOT EXISTS permite_acumulacion BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS es_exclusiva BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.campanias.permite_acumulacion IS
  'Si TRUE, esta campaña puede acumularse con otras campañas en el mismo carrito';

COMMENT ON COLUMN public.campanias.es_exclusiva IS
  'Si TRUE, esta campaña bloquea cualquier otra campaña del mismo producto';

-- ============================================================
-- 2. NUEVAS COLUMNAS EN campanias_reglas
-- ============================================================
ALTER TABLE IF EXISTS public.campanias_reglas
ADD COLUMN IF NOT EXISTS cantidad_maxima INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS descuento_fijo DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS configuracion_json JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.campanias_reglas.cantidad_maxima IS
  'Cantidad máxima de productos a los que aplica (0 = sin límite)';

COMMENT ON COLUMN public.campanias_reglas.descuento_fijo IS
  'Monto fijo de descuento (independiente del precio del producto)';

COMMENT ON COLUMN public.campanias_reglas.configuracion_json IS
  'JSON con configuración adicional flexible (ej: {"aplica_cada":2,"gratis":1})';

-- ============================================================
-- 3. campanias_categorias (N:M campaña ↔ categoría de producto)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campanias_categorias (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campania_id  UUID NOT NULL REFERENCES public.campanias(id) ON DELETE CASCADE,
  categoria_id VARCHAR(255) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campanias_categorias_campania
  ON public.campanias_categorias(campania_id);
CREATE INDEX IF NOT EXISTS idx_campanias_categorias_categoria
  ON public.campanias_categorias(categoria_id);

ALTER TABLE IF EXISTS public.campanias_categorias ENABLE ROW LEVEL SECURITY;

-- Políticas: lectura pública, escritura solo admin
DROP POLICY IF EXISTS campanias_categorias_select_public ON public.campanias_categorias;
CREATE POLICY campanias_categorias_select_public ON public.campanias_categorias
  FOR SELECT USING (true);

DROP POLICY IF EXISTS campanias_categorias_all_admin ON public.campanias_categorias;
CREATE POLICY campanias_categorias_all_admin ON public.campanias_categorias
  FOR ALL TO authenticated
  USING (get_current_user_rol() IN ('admin', 'gerente'))
  WITH CHECK (get_current_user_rol() IN ('admin', 'gerente'));

-- ============================================================
-- 4. campanias_exclusiones (auto-referencial)
--    Una campaña puede excluir a otra (ej: promoción y descuento
--    no pueden aplicarse juntos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campanias_exclusiones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campania_id         UUID NOT NULL REFERENCES public.campanias(id) ON DELETE CASCADE,
  campania_excluida_id UUID NOT NULL REFERENCES public.campanias(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campania_id, campania_excluida_id),
  CHECK (campania_id != campania_excluida_id)
);

CREATE INDEX IF NOT EXISTS idx_campanias_exclusiones_campania
  ON public.campanias_exclusiones(campania_id);
CREATE INDEX IF NOT EXISTS idx_campanias_exclusiones_excluida
  ON public.campanias_exclusiones(campania_excluida_id);

ALTER TABLE IF EXISTS public.campanias_exclusiones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS campanias_exclusiones_select_public ON public.campanias_exclusiones;
CREATE POLICY campanias_exclusiones_select_public ON public.campanias_exclusiones
  FOR SELECT USING (true);

DROP POLICY IF EXISTS campanias_exclusiones_all_admin ON public.campanias_exclusiones;
CREATE POLICY campanias_exclusiones_all_admin ON public.campanias_exclusiones
  FOR ALL TO authenticated
  USING (get_current_user_rol() IN ('admin', 'gerente'))
  WITH CHECK (get_current_user_rol() IN ('admin', 'gerente'));

-- ============================================================
-- 5. cupones (códigos promocionales)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cupones (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo           VARCHAR(50) NOT NULL UNIQUE,
  campania_id      UUID NOT NULL REFERENCES public.campanias(id) ON DELETE CASCADE,
  usos_maximos     INTEGER NOT NULL DEFAULT 1,
  usos_actuales    INTEGER NOT NULL DEFAULT 0,
  fecha_expiracion TIMESTAMPTZ,
  activo           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cupones_codigo ON public.cupones(codigo);
CREATE INDEX IF NOT EXISTS idx_cupones_campania ON public.cupones(campania_id);
CREATE INDEX IF NOT EXISTS idx_cupones_activo ON public.cupones(activo);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION trg_cupones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cupones_updated_at ON public.cupones;
CREATE TRIGGER trg_cupones_updated_at
  BEFORE UPDATE ON public.cupones
  FOR EACH ROW
  EXECUTE FUNCTION trg_cupones_updated_at();

ALTER TABLE IF EXISTS public.cupones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cupones_select_public ON public.cupones;
CREATE POLICY cupones_select_public ON public.cupones
  FOR SELECT
  USING (activo = TRUE AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW()));

DROP POLICY IF EXISTS cupones_all_admin ON public.cupones;
CREATE POLICY cupones_all_admin ON public.cupones
  FOR ALL TO authenticated
  USING (get_current_user_rol() IN ('admin', 'gerente'))
  WITH CHECK (get_current_user_rol() IN ('admin', 'gerente'));

-- ============================================================
-- 6. operaciones_campanias (auditoría de aplicaciones)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.operaciones_campanias (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campania_id       UUID NOT NULL REFERENCES public.campanias(id) ON DELETE SET NULL,
  venta_id          UUID,
  reserva_id        UUID,
  tipo_operacion    VARCHAR(20) NOT NULL CHECK (tipo_operacion IN ('venta', 'reserva', 'cotizacion')),
  beneficio_aplicado JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_descuento   DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operaciones_campanias_campania
  ON public.operaciones_campanias(campania_id);
CREATE INDEX IF NOT EXISTS idx_operaciones_campanias_venta
  ON public.operaciones_campanias(venta_id);
CREATE INDEX IF NOT EXISTS idx_operaciones_campanias_reserva
  ON public.operaciones_campanias(reserva_id);
CREATE INDEX IF NOT EXISTS idx_operaciones_campanias_fecha
  ON public.operaciones_campanias(created_at DESC);

ALTER TABLE IF EXISTS public.operaciones_campanias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operaciones_campanias_select_admin ON public.operaciones_campanias;
CREATE POLICY operaciones_campanias_select_admin ON public.operaciones_campanias
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS operaciones_campanias_insert_public ON public.operaciones_campanias;
CREATE POLICY operaciones_campanias_insert_public ON public.operaciones_campanias
  FOR INSERT
  WITH CHECK (true);
