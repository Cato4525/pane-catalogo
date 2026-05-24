-- =====================================================
-- OBTENER ROL DESDE USER_METADATA EN RLS
-- Alternativa que no requiere modificar schema auth
-- =====================================================

-- Crear función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_rol()
RETURNS TEXT AS $$
DECLARE
  user_id TEXT;
  rol TEXT;
BEGIN
  user_id := (auth.jwt() ->> 'sub');
  
  SELECT u.raw_user_meta_data->>'rol' INTO rol
  FROM auth.users u
  WHERE u.id = user_id::uuid;
  
  RETURN rol;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar la función para verificar (esto también la registra)
-- Nota: La primera vez que se llama, PostgreSQL compila la función