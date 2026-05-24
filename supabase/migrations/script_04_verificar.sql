-- =====================================================
-- VERIFICAR MIGRACIÓN (Ejecutar después de los scripts)
-- =====================================================

-- 1. ¿Existe la tabla?
SELECT 
  'reservations' AS tabla,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') 
    THEN '✓ Existe' 
    ELSE '✗ NO existe' 
  END AS estado;

-- 2. ¿Cuántas columnas tiene?
SELECT COUNT(*) AS columnas_reservations
FROM information_schema.columns 
WHERE table_name = 'reservations';

-- 3. ¿Cuántos registros hay?
SELECT COUNT(*) AS total_reservas FROM reservations;

-- 4. ¿Existen las funciones?
SELECT proname AS funcion
FROM pg_proc 
WHERE proname IN ('agregar_abono', 'marcar_pagado_completo', 'ver_abonos');

-- 5. Ver estructura completa
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'reservations' 
ORDER BY ordinal_position;