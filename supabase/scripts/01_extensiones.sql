-- =====================================================
-- 01_EXTensiones.sql
-- Paso 1: Habilitar extensiones necesarias
-- =====================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar que está habilitada
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'uuid-ossp';

-- Comentar: Esta extensión permite generar UUIDs automáticos
