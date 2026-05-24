-- =====================================================
-- CREAR TABLA VENTAS DIRECTAS (separada de reservas POS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ventas_directas (
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

CREATE INDEX IF NOT EXISTS idx_ventas_directas_codigo ON public.ventas_directas(codigo);
CREATE INDEX IF NOT EXISTS idx_ventas_directas_cliente_id ON public.ventas_directas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_directas_estado ON public.ventas_directas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_directas_fecha ON public.ventas_directas(fecha);
