-- =====================================================
-- CREAR TABLAS PARA PUNTO DE VENTA (VENTAS)
-- Archivo: supabase/migrations/010_ventas_pos.sql
-- =====================================================

-- =====================================================
-- TABLA: clientes (si no existe)
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50) NOT NULL,
    direccion TEXT,
    ciudad VARCHAR(100),
    documento VARCHAR(50),
    tipo_documento VARCHAR(10) DEFAULT 'cc',
    observaciones TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);

-- =====================================================
-- TABLA: pedidos (ventas del POS)
-- =====================================================
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    
    -- Cliente
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    cliente VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50),
    direccion TEXT,
    ciudad VARCHAR(100),
    
    -- Items del pedido (JSON para simplicidad)
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Totales
    monto DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Estado y tipo de venta
    estado VARCHAR(20) DEFAULT 'completado', -- pendiente, abonado, completado, cancelado
    tipo_venta VARCHAR(20) DEFAULT 'directo', -- directo, reservado, abonado
    
    -- Método de pago
    metodo_pago VARCHAR(20) DEFAULT 'efectivo', -- efectivo, transferencia, tarjeta, mixto
    monto_pagado DECIMAL(12,2) DEFAULT 0,
    cambio DECIMAL(12,2) DEFAULT 0,
    
    -- Detalles de pago
    transferencia_imagen TEXT,
    tarjeta_last4 VARCHAR(4),
    tarjeta_autori VARCHAR(100),
    
    -- Facturación
    factura_generada BOOLEAN DEFAULT false,
    
    -- Notas
    notas TEXT,
    
    -- Usuario que registró la venta
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    usuario_nombre VARCHAR(100),
    
    -- Timestamps
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_pedidos_codigo ON pedidos(codigo);
CREATE INDEX idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha);
CREATE INDEX idx_pedidos_metodo_pago ON pedidos(metodo_pago);
CREATE INDEX idx_pedidos_tipo_venta ON pedidos(tipo_venta);
CREATE INDEX idx_pedidos_cliente_nombre ON pedidos(cliente);
CREATE INDEX idx_pedidos_telefono ON pedidos(telefono);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para generar código de pedido automático
CREATE OR REPLACE FUNCTION generar_codigo_pedido()
RETURNS TRIGGER AS $$
DECLARE
    anno CHAR(4);
    mes CHAR(2);
    secuencia INTEGER;
    codigo TEXT;
BEGIN
    anno := TO_CHAR(NOW(), 'YYYY');
    mes := TO_CHAR(NOW(), 'MM');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 9 FOR 6) AS INTEGER)), 0) + 1
    INTO secuencia
    FROM pedidos
    WHERE codigo LIKE 'PED-' || anno || mes || '%';
    
    codigo := 'PED-' || anno || mes || LPAD(secuencia::TEXT, 6, '0');
    NEW.codigo := codigo;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para código automático
DROP TRIGGER IF EXISTS trigger_codigo_pedido ON pedidos;
CREATE TRIGGER trigger_codigo_pedido
BEFORE INSERT ON pedidos
FOR EACH ROW
WHEN (NEW.codigo IS NULL)
EXECUTE FUNCTION generar_codigo_pedido();

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_updated_at ON pedidos;
CREATE TRIGGER trigger_updated_at
BEFORE UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Clientes: todos pueden leer, solo admins escriben
CREATE POLICY "clientes_read" ON clientes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "clientes_insert_admin" ON clientes
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM perfiles p
            WHERE p.user_id = auth.uid()
            AND p.rol IN ('admin', 'gerente', 'soporte', 'vendedor')
        )
    );

CREATE POLICY "clientes_update_admin" ON clientes
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles p
            WHERE p.user_id = auth.uid()
            AND p.rol IN ('admin', 'gerente', 'soporte', 'vendedor')
        )
    );

-- Todos los usuarios autenticados pueden leer pedidos
CREATE POLICY "pedidos_read_all" ON pedidos
    FOR SELECT TO authenticated
    USING (true);

-- Solo admins pueden insertar, actualizar, eliminar
CREATE POLICY "pedidos_insert_admin" ON pedidos
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM perfiles p
            WHERE p.user_id = auth.uid()
            AND p.rol IN ('admin', 'gerente', 'soporte')
        )
    );

CREATE POLICY "pedidos_update_admin" ON pedidos
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles p
            WHERE p.user_id = auth.uid()
            AND p.rol IN ('admin', 'gerente', 'soporte')
        )
    );

CREATE POLICY "pedidos_delete_admin" ON pedidos
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles p
            WHERE p.user_id = auth.uid()
            AND p.rol = 'admin'
        )
    );

-- =====================================================
-- INSERTAR DATOS DE EJEMPLO
-- =====================================================
DO $$
DECLARE
    cliente_id UUID;
    cliente_nom TEXT;
BEGIN
    -- Obtener primer cliente para ejemplos
    SELECT id, nombre INTO cliente_id, cliente_nom 
    FROM clientes LIMIT 1;

    IF cliente_id IS NOT NULL THEN
        INSERT INTO pedidos (cliente, cliente_id, email, telefono, monto, estado, metodo_pago, monto_pagado, tipo_venta, items)
        VALUES (
            cliente_nom,
            cliente_id,
            (SELECT email FROM clientes WHERE id = cliente_id),
            (SELECT telefono FROM clientes WHERE id = cliente_id),
            45.00,
            'completado',
            'efectivo',
            50.00,
            'directo',
            '[{"productId":"1","productName":"Leggin Aurora","quantity":3,"price":15}]'::jsonb
        );

        INSERT INTO pedidos (cliente, cliente_id, email, telefono, monto, estado, metodo_pago, monto_pagado, tipo_venta, items)
        VALUES (
            'Cliente Mostrador',
            NULL,
            '',
            '',
            25.00,
            'completado',
            'transferencia',
            25.00,
            'directo',
            '[{"productId":"2","productName":"Leggin Sport","quantity":1,"price":25}]'::jsonb
        );
    END IF;
END $$;

-- =====================================================
-- VERIFICAR TABLA CREADA
-- =====================================================
SELECT 
    codigo,
    cliente,
    monto,
    estado,
    metodo_pago,
    tipo_venta,
    fecha,
    created_at
FROM pedidos
ORDER BY created_at DESC
LIMIT 10;

-- Contar registros
SELECT COUNT(*) as total_pedidos FROM pedidos;
SELECT estado, COUNT(*) as cantidad FROM pedidos GROUP BY estado;
SELECT metodo_pago, COUNT(*) as cantidad FROM pedidos GROUP BY metodo_pago;

 el script corregido no debe utilizxar perfiles , debe utilizar relazion a profiles
 -- =====================================================
-- CREAR TABLAS PARA PUNTO DE VENTA (VENTAS)
-- =====================================================

-- =====================================================
-- TABLA: clientes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50) NOT NULL,
    direccion TEXT,
    ciudad VARCHAR(100),
    documento VARCHAR(50),
    tipo_documento VARCHAR(10) DEFAULT 'cc',
    observaciones TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON public.clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON public.clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);

-- =====================================================
-- TABLA: pedidos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE,

    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    cliente VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50),
    direccion TEXT,
    ciudad VARCHAR(100),

    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    monto DECIMAL(12,2) NOT NULL DEFAULT 0,

    estado VARCHAR(20) DEFAULT 'completado',
    tipo_venta VARCHAR(20) DEFAULT 'directo',

    metodo_pago VARCHAR(20) DEFAULT 'efectivo',
    monto_pagado DECIMAL(12,2) DEFAULT 0,
    cambio DECIMAL(12,2) DEFAULT 0,

    transferencia_imagen TEXT,
    tarjeta_last4 VARCHAR(4),
    tarjeta_autori VARCHAR(100),

    factura_generada BOOLEAN DEFAULT false,
    notas TEXT,

    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    usuario_nombre VARCHAR(100),

    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pedidos_codigo ON public.pedidos(codigo);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON public.pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON public.pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON public.pedidos(fecha);

-- =====================================================
-- FUNCIONES
-- =====================================================

CREATE OR REPLACE FUNCTION public.generar_codigo_pedido()
RETURNS TRIGGER AS $$
DECLARE
    anno TEXT;
    mes TEXT;
    secuencia INTEGER;
BEGIN
    anno := TO_CHAR(NOW(), 'YYYY');
    mes := TO_CHAR(NOW(), 'MM');

    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 9 FOR 6) AS INTEGER)), 0) + 1
    INTO secuencia
    FROM public.pedidos
    WHERE codigo LIKE 'PED-' || anno || mes || '%';

    NEW.codigo := 'PED-' || anno || mes || LPAD(secuencia::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_codigo_pedido ON public.pedidos;
CREATE TRIGGER trigger_codigo_pedido
BEFORE INSERT ON public.pedidos
FOR EACH ROW
WHEN (NEW.codigo IS NULL)
EXECUTE FUNCTION public.generar_codigo_pedido();

-- Updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_updated_at_clientes ON public.clientes;
CREATE TRIGGER trigger_updated_at_clientes
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_updated_at_pedidos ON public.pedidos;
CREATE TRIGGER trigger_updated_at_pedidos
BEFORE UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES CLIENTES
-- =====================================================

DROP POLICY IF EXISTS "clientes_read" ON public.clientes;
CREATE POLICY "clientes_read"
ON public.clientes
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
CREATE POLICY "clientes_insert"
ON public.clientes
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_permission(auth.uid(), 'crear_clientes')
);

DROP POLICY IF EXISTS "clientes_update" ON public.clientes;
CREATE POLICY "clientes_update"
ON public.clientes
FOR UPDATE
TO authenticated
USING (
  public.has_permission(auth.uid(), 'editar_clientes')
);

-- =====================================================
-- POLICIES PEDIDOS
-- =====================================================

DROP POLICY IF EXISTS "pedidos_read" ON public.pedidos;
CREATE POLICY "pedidos_read"
ON public.pedidos
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "pedidos_insert" ON public.pedidos;
CREATE POLICY "pedidos_insert"
ON public.pedidos
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_permission(auth.uid(), 'crear_pedidos')
);

DROP POLICY IF EXISTS "pedidos_update" ON public.pedidos;
CREATE POLICY "pedidos_update"
ON public.pedidos
FOR UPDATE
TO authenticated
USING (
  public.has_permission(auth.uid(), 'editar_pedidos')
);

DROP POLICY IF EXISTS "pedidos_delete" ON public.pedidos;
CREATE POLICY "pedidos_delete"
ON public.pedidos
FOR DELETE
TO authenticated
USING (
  public.has_permission(auth.uid(), 'eliminar_pedidos')
);

-- =====================================================
-- TEST
-- =====================================================
SELECT codigo, cliente, monto, estado
FROM public.pedidos
ORDER BY created_at DESC
LIMIT 10;