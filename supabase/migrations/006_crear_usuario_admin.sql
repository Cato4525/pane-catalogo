-- =====================================================
-- CREAR USUARIO ADMIN INICIAL
-- =====================================================

-- IMPORTANTE: Ejecuta esto en Supabase Dashboard > Authentication > Users > Add User
-- O puedes usar este script si tienes acceso a la base de datos

-- Para crear el usuario admin, ve a:
-- 1. Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Tu proyecto > Authentication > Users
-- 3. Click "Add User"
-- 4. Ingresa:
--    - Email: admin@tu-tienda.com
--    - Password: TuContraseñaSegura123!
--    - User Metadata: {"nombre": "Administrador", "rol": "admin"}
-- 5. Click "Create user"

-- =====================================================
-- ALTERNATIVA: Si ya creaste el usuario pero no tiene el metadata correcto
-- =====================================================

-- Primero, obtén el ID del usuario que creaste
-- SELECT id, email, raw_user_meta_data FROM auth.users;

-- Luego actualiza el metadata:
-- UPDATE auth.users 
-- SET raw_user_meta_data = raw_user_meta_data || '{"nombre": "Administrador", "rol": "admin"}'
-- WHERE email = 'admin@tu-tienda.com';

-- =====================================================
-- CREAR USUARIOS DE PRUEBA (ejecutar desde SQL Editor)
-- =====================================================

-- Nota: No puedes crear usuarios directamente desde SQL porque auth.users
-- es una tabla especial. Debes usar el Dashboard o la API.

-- Pero puedes insertar en la tabla perfiles una vez que el usuario exista en auth.users

-- INSERT INTO perfiles (id, email, nombre, rol)
-- VALUES 
--   ('[UUID_DEL_USUARIO]', 'admin@tu-tienda.com', 'Administrador', 'admin'),
--   ('[UUID_DEL_USUARIO]', 'vendedor@tu-tienda.com', 'Vendedor', 'vendedor');

-- =====================================================
-- VERIFICAR USUARIOS
-- =====================================================

-- Ver usuarios en auth.users
SELECT id, email, created_at, last_sign_in_at, 
       raw_user_meta_data->>'nombre' as nombre,
       raw_user_meta_data->>'rol' as rol
FROM auth.users
ORDER BY created_at DESC;

-- Ver perfiles
SELECT * FROM perfiles ORDER BY created_at DESC;