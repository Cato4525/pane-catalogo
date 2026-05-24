-- =====================================================
-- FIX: Agregar RLS y triggers a ventas_directas
-- =====================================================

ALTER TABLE public.ventas_directas ENABLE ROW LEVEL SECURITY;

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_updated_at_ventas_directas ON public.ventas_directas;
CREATE TRIGGER trigger_updated_at_ventas_directas
BEFORE UPDATE ON public.ventas_directas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- SELECT: any authenticated user can read
DROP POLICY IF EXISTS "ventas_directas_select" ON public.ventas_directas;
CREATE POLICY "ventas_directas_select"
ON public.ventas_directas
FOR SELECT
TO authenticated
USING (true);

-- INSERT: users with 'crear_pedidos' permission can insert
DROP POLICY IF EXISTS "ventas_directas_insert" ON public.ventas_directas;
CREATE POLICY "ventas_directas_insert"
ON public.ventas_directas
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_permission(auth.uid(), 'crear_pedidos')
);

-- UPDATE: users with 'editar_pedidos' permission can update
DROP POLICY IF EXISTS "ventas_directas_update" ON public.ventas_directas;
CREATE POLICY "ventas_directas_update"
ON public.ventas_directas
FOR UPDATE
TO authenticated
USING (
    public.has_permission(auth.uid(), 'editar_pedidos')
);

-- DELETE: users with 'eliminar_pedidos' permission can delete
DROP POLICY IF EXISTS "ventas_directas_delete" ON public.ventas_directas;
CREATE POLICY "ventas_directas_delete"
ON public.ventas_directas
FOR DELETE
TO authenticated
USING (
    public.has_permission(auth.uid(), 'eliminar_pedidos')
);
