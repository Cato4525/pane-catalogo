-- =====================================================
-- AUTH_SETUP.sql
-- Configuración completa de Autenticación con Supabase
-- =====================================================

-- =====================================================
-- 1. HABILITAR PROVEEDORES DE AUTH
-- =====================================================

-- Configuración de Email/Password (ya habilitado por defecto)
-- No necesita SQL, se hace en el panel de Supabase

-- =====================================================
-- 2. CONFIGURAR GOOGLE OAUTH (desde Panel)
-- =====================================================
/*
Pasos en Supabase Dashboard:
1. Authentication > Providers > Google
2. Toggle "Enable Google"
3. Ingresa:
   - Client ID: (de Google Cloud Console)
   - Client Secret: (de Google Cloud Console)
4. En "Redirect URLs" agrega:
   - https://[tu-proyecto].supabase.co/auth/v1/callback
   - http://localhost:3000/auth/v1/callback
5. Save

En Google Cloud Console:
1. APIs & Services > Credentials
2. Create OAuth client ID
3. Authorized redirect URIs agregar:
   - https://[tu-proyecto].supabase.co/auth/v1/callback
*/

-- =====================================================
-- 3. TABLA DE ROLES (ya creada en perfiles)
-- =====================================================

-- Verificar que la tabla perfiles tiene el campo rol
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'perfiles' 
AND column_name = 'rol';

-- =====================================================
-- 4. ACTUALIZAR ROLES DE USUARIOS
-- =====================================================

-- Hacer que un usuario sea admin
-- UPDATE perfiles SET rol = 'admin' WHERE email = 'admin@tuemail.com';

-- Hacer que un usuario sea vendedor (no puede eliminar)
-- UPDATE perfiles SET rol = 'vendedor' WHERE email = 'vendedor@tuemail.com';

-- Ver rol de usuarios
SELECT p.email, p.nombre, p.rol, p.activo, p.created_at
FROM perfiles p
ORDER BY p.created_at DESC;

-- =====================================================
-- 5. CREAR PRIMER ADMIN DESDE SQL (temporal)
-- =====================================================

-- Para crear un usuario de prueba directamente:
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
-- VALUES (
--   'admin@panaderia.com',
--   -- Password: admin123 (hasheada por Supabase)
--   crypt('admin123', gen_salt('bf')),
--   NOW()
-- )
-- RETURNING id;

-- Pero esto no es recomendado. Mejor usar el panel.

-- =====================================================
-- 6. VERIFICAR CONFIGURACIÓN
-- =====================================================

-- Ver proveedores habilitados
-- Se hace desde el panel de Supabase

-- Probar que la autenticación funciona
-- SELECT id, email FROM auth.users LIMIT 1;

-- =====================================================
-- 7. POLÍTICAS DE ACCESO BASADAS EN ROL
-- =====================================================

-- Eliminar políticas antiguas y crear nuevas basadas en rol
DROP POLICY IF EXISTS "admin_full_access" ON products;
DROP POLICY IF EXISTS "vendedor_limited_access" ON products;

-- Política para admin: acceso total
CREATE POLICY "admin_full_access" ON products
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM perfiles p
        WHERE p.id = auth.uid()
        AND p.rol = 'admin'
    )
);

-- Política para vendedor: solo leer y actualizar
CREATE POLICY "vendedor_read_update" ON products
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM perfiles p
        WHERE p.id = auth.uid()
        AND p.rol IN ('admin', 'vendedor')
    )
);

-- Lo mismo para otras tablas
-- Repetir para: clients, orders, reservations, etc.

-- =====================================================
-- 8. CONFIGURAR REDIRECT URL EN SUPABASE
-- =====================================================
/*
En Supabase Dashboard:
Authentication > URL Configuration > Site URL
Agrega: http://localhost:3000

Redirect URLs adicionales:
http://localhost:3000/auth/callback
http://localhost:5173/auth/callback
https://tu-dominio.com/auth/callback
*/

-- =====================================================
-- RESUMEN DE PASOS
-- =====================================================
/*
1. Crear proyecto en Supabase
2. Ir a Authentication > Providers
3. Habilitar Email/Password (ya viene por defecto)
4. Habilitar Google y configurar credenciales
5. Crear usuarios desde el panel de Supabase
6. Los perfiles se crean automáticamente
7. Actualizar rol en tabla perfiles si es necesario
8. Probar login en la aplicación
*/
