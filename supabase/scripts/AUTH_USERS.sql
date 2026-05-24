-- =====================================================
-- AUTH_USERS.sql
-- Script para crear usuarios admin en Supabase
-- =====================================================

-- =====================================================
-- NOTA IMPORTANTE:
-- Este script NO crea usuarios directamente.
-- Los usuarios se crean en Supabase Auth desde la aplicación
-- o desde el panel de Supabase > Authentication > Users
-- =====================================================

-- =====================================================
-- MÉTODO 1: Desde el panel de Supabase
-- =====================================================
-- 1. Ve a tu proyecto en supabase.com
-- 2. Abre Authentication > Users
-- 3. Click en "Add user"
-- 4. Ingresa email y contraseña
-- 5. El perfil se creará automáticamente (trigger)
-- 6. Luego puedes asignar rol 'admin' manualmente

-- =====================================================
-- MÉTODO 2: Crear usuario manualmente (solo para testing)
-- =====================================================

-- Este SQL solo crea el PERFIL, no el usuario de auth
-- Primero debes crear el usuario en Supabase Auth

-- Insertar perfil manualmente (después de crear usuario en Auth)
-- UPDATE perfiles 
-- SET rol = 'admin' 
-- WHERE email = 'tu-email@ejemplo.com';

-- =====================================================
-- VERIFICAR PERFILES EXISTENTES
-- =====================================================
SELECT id, email, nombre, rol, activo, created_at 
FROM perfiles 
ORDER BY created_at DESC;

-- =====================================================
-- ACTUALIZAR ROL DE ADMIN
-- =====================================================
-- Descomenta y ejecuta después de crear usuarios:

-- UPDATE perfiles SET rol = 'admin' WHERE email = 'admin@tudominio.com';

-- =====================================================
-- LISTAR USUARIOS DE AUTH
-- =====================================================
-- Ver usuarios creados en Supabase Auth
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
ORDER BY created_at DESC;

-- =====================================================
-- NOTA SOBRE GOOGLE OAuth
-- =====================================================
-- Para habilitar login con Google:
-- 1. Ve a Authentication > Providers > Google
-- 2. Habilita Google
-- 3. Ingresa tu Client ID y Client Secret de Google Cloud
-- 4. Configura las URLs de redirect en Google Cloud Console
-- 5. Agrega tu dominio en "Site URL" en Supabase
