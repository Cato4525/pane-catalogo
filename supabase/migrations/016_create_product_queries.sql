-- =====================================================
-- CREAR TABLA product_queries (CONSULTAS DE PRODUCTOS)
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Crear la tabla
CREATE TABLE IF NOT EXISTS product_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    -- Datos del cliente que consulta
    cliente_nombre VARCHAR(255),
    cliente_telefono VARCHAR(50),
    cliente_email VARCHAR(255),
    
    -- Detalles de la consulta
    mensaje TEXT,
    origen VARCHAR(50) DEFAULT 'tienda',
    
    -- Estado
    respondida BOOLEAN DEFAULT false,
    respuesta TEXT,
    fecha_respuesta TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar extensión uuid-ossp si no está disponible
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Índices
CREATE INDEX IF NOT EXISTS idx_product_queries_product ON product_queries(product_id);
CREATE INDEX IF NOT EXISTS idx_product_queries_fecha ON product_queries(created_at);

-- RLS
ALTER TABLE product_queries ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "queries_public_insert" ON product_queries;
CREATE POLICY "queries_public_insert" ON product_queries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "queries_read" ON product_queries;
CREATE POLICY "queries_read" ON product_queries FOR SELECT USING (auth.role() = 'authenticated');

-- Verificar
SELECT * FROM product_queries LIMIT 0;
