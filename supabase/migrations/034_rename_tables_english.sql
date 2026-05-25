-- =====================================================
-- MIGRATION 034: Rename tables to English for consistency
-- =====================================================
-- Ejecutar en Supabase SQL Editor
-- Nota: Se crean vistas para retrocompatibilidad

-- =====================================================
-- 1. RENOMBRAR: pedidos → pos_orders
-- =====================================================
ALTER TABLE IF EXISTS public.pedidos RENAME TO pos_orders;
ALTER INDEX IF EXISTS idx_pedidos_codigo RENAME TO idx_pos_orders_codigo;
ALTER INDEX IF EXISTS idx_pedidos_cliente_id RENAME TO idx_pos_orders_cliente_id;
ALTER INDEX IF EXISTS idx_pedidos_estado RENAME TO idx_pos_orders_estado;
ALTER INDEX IF EXISTS idx_pedidos_fecha RENAME TO idx_pos_orders_fecha;
ALTER INDEX IF EXISTS idx_pedidos_metodo_pago RENAME TO idx_pos_orders_metodo_pago;
ALTER INDEX IF EXISTS idx_pedidos_tipo_venta RENAME TO idx_pos_orders_tipo_venta;
ALTER INDEX IF EXISTS idx_pedidos_cliente_nombre RENAME TO idx_pos_orders_cliente_nombre;
ALTER INDEX IF EXISTS idx_pedidos_telefono RENAME TO idx_pos_orders_telefono;

-- Vista retrocompatible
CREATE OR REPLACE VIEW public.pedidos AS SELECT * FROM public.pos_orders;

-- Renombrar triggers asociados (con verificación previa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_table = 'pos_orders' AND trigger_name = 'trigger_updated_at'
  ) THEN
    ALTER TRIGGER trigger_updated_at ON public.pos_orders RENAME TO trigger_updated_at_pos_orders;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_table = 'pos_orders' AND trigger_name = 'trigger_codigo_pedido'
  ) THEN
    ALTER TRIGGER trigger_codigo_pedido ON public.pos_orders RENAME TO trigger_codigo_pos_order;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'generar_codigo_pedido' AND routine_schema = 'public'
  ) THEN
    ALTER FUNCTION public.generar_codigo_pedido() RENAME TO generar_codigo_pos_order;
  END IF;
END $$;

-- =====================================================
-- 2. RENOMBRAR: ventas_directas → direct_sales
-- =====================================================
ALTER TABLE IF EXISTS public.ventas_directas RENAME TO direct_sales;
ALTER INDEX IF EXISTS idx_ventas_directas_codigo RENAME TO idx_direct_sales_codigo;
ALTER INDEX IF EXISTS idx_ventas_directas_cliente_id RENAME TO idx_direct_sales_cliente_id;
ALTER INDEX IF EXISTS idx_ventas_directas_estado RENAME TO idx_direct_sales_estado;
ALTER INDEX IF EXISTS idx_ventas_directas_fecha RENAME TO idx_direct_sales_fecha;

-- Vista retrocompatible
CREATE OR REPLACE VIEW public.ventas_directas AS SELECT * FROM public.direct_sales;

-- =====================================================
-- 3. VERIFICACIÓN
-- =====================================================
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('direct_sales', 'pos_orders', 'ventas_directas', 'pedidos')
ORDER BY table_name;
