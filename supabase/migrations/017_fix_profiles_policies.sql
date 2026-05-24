-- =====================================================
-- CORREGIR POLÍTICAS RLS DE PROFILES
-- Eliminar recursión infinita
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Eliminar todas las políticas problemáticas
DROP POLICY IF EXISTS "secure read profiles" ON public.profiles;
DROP POLICY IF EXISTS "secure update profiles" ON public.profiles;
DROP POLICY IF EXISTS "secure insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "secure delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "allow read profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- Crear políticas simples sin recursión
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Verificar políticas creadas
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
