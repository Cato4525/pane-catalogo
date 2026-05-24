-- =====================================================
-- VERIFICAR ESTRUCTURA DE product_variants
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Ver estructura actual
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'product_variants'
ORDER BY ordinal_position;

-- Ver foreign keys
SELECT 
    tc.constraint_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'product_variants';

-- Ver datos de ejemplo
SELECT * FROM product_variants LIMIT 3;
