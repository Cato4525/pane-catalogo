-- =============================================
-- MÓDULO DE GESTIÓN DE USUARIOS CON ROLES Y PERMISOS
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. TABLA PROFILES (extensión de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT,
  rol TEXT NOT NULL DEFAULT 'vendedor',
  activo BOOLEAN NOT NULL DEFAULT true,
  permisos_extra TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(id)
);

-- 2. TABLA ROLES
CREATE TABLE IF NOT EXISTS public.roles (
  id SERIAL PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA PERMISSIONS
CREATE TABLE IF NOT EXISTS public.permisos (
  id SERIAL PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  categoria TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id INTEGER REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES public.permisos(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 5. TABLA USER_PERMISSIONS (permisos extra por usuario)
CREATE TABLE IF NOT EXISTS public.user_permissions (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES public.permisos(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, permission_id)
);

-- 6. TABLA AUDIT_LOG
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_rol ON public.profiles(rol);
CREATE INDEX IF NOT EXISTS idx_profiles_activo ON public.profiles(activo);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at);

-- =============================================
-- DATOS INICIALES: ROLES
-- =============================================
INSERT INTO public.roles (nombre, descripcion) VALUES
  ('admin', 'Acceso total al sistema'),
  ('gerente', 'Gestión de tienda y reportes'),
  ('soporte', 'Soporte técnico y pruebas'),
  ('contador', 'Solo reportes financieros'),
  ('inventario', 'Gestión de productos y stock'),
  ('vendedor', 'Ventas y atención al cliente'),
  ('reportes', 'Solo visualización de reportes')
ON CONFLICT (nombre) DO NOTHING;

-- =============================================
-- DATOS INICIALES: PERMISOS
-- =============================================
INSERT INTO public.permisos (clave, descripcion, categoria) VALUES
  -- Productos
  ('ver_productos', 'Ver listado de productos', 'productos'),
  ('crear_productos', 'Crear nuevos productos', 'productos'),
  ('editar_productos', 'Editar productos existentes', 'productos'),
  ('eliminar_productos', 'Eliminar productos', 'productos'),
  ('gestionar_categorias', 'Gestionar categorías', 'productos'),
  
  -- Ventas
  ('ver_ventas', 'Ver historial de ventas', 'ventas'),
  ('crear_ventas', 'Registrar nuevas ventas', 'ventas'),
  ('editar_ventas', 'Editar ventas', 'ventas'),
  ('eliminar_ventas', 'Eliminar ventas', 'ventas'),
  ('acceso_pos', 'Acceso al punto de venta', 'ventas'),
  ('gestionar_clientes', 'Gestionar clientes', 'ventas'),
  
  -- Reservas
  ('ver_reservas', 'Ver reservas', 'reservas'),
  ('crear_reservas', 'Crear reservas', 'reservas'),
  ('gestionar_reservas', 'Gestionar reservas', 'reservas'),
  
  -- Reportes
  ('ver_reportes', 'Ver reportes', 'reportes'),
  ('exportar_reportes', 'Exportar reportes', 'reportes'),
  ('ver_inventario', 'Ver inventario', 'reportes'),
  
  -- Usuarios
  ('ver_usuarios', 'Ver listado de usuarios', 'usuarios'),
  ('crear_usuarios', 'Crear usuarios', 'usuarios'),
  ('editar_usuarios', 'Editar usuarios', 'usuarios'),
  ('eliminar_usuarios', 'Eliminar usuarios', 'usuarios'),
  ('gestionar_permisos', 'Gestionar permisos', 'usuarios'),
  
  -- Configuración
  ('ver_configuracion', 'Ver configuración', 'configuracion'),
  ('editar_configuracion', 'Editar configuración', 'configuracion'),
  
  -- Consultas
  ('ver_consultas', 'Ver consultas de clientes', 'consultas'),
  ('gestionar_consultas', 'Gestionar consultas', 'consultas')
ON CONFLICT (clave) DO NOTHING;

-- =============================================
-- ASIGNACIÓN DE PERMISOS POR ROL
-- =============================================
-- Admin: todos los permisos
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permisos p WHERE r.nombre = 'admin'
ON CONFLICT DO NOTHING;

-- Gerente
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permisos p 
WHERE r.nombre = 'gerente' AND p.clave IN (
  'ver_productos', 'crear_productos', 'editar_productos', 'gestionar_categorias',
  'ver_ventas', 'crear_ventas', 'editar_ventas', 'acceso_pos', 'gestionar_clientes',
  'ver_reservas', 'crear_reservas', 'gestionar_reservas',
  'ver_reportes', 'exportar_reportes', 'ver_inventario',
  'ver_consultas', 'gestionar_consultas',
  'ver_configuracion'
);

-- Vendedor
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permisos p 
WHERE r.nombre = 'vendedor' AND p.clave IN (
  'ver_productos', 'crear_ventas', 'acceso_pos',
  'ver_ventas', 'gestionar_clientes',
  'ver_reservas', 'crear_reservas'
);

-- Inventario
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permisos p 
WHERE r.nombre = 'inventario' AND p.clave IN (
  'ver_productos', 'crear_productos', 'editar_productos', 'eliminar_productos',
  'gestionar_categorias', 'ver_inventario'
);

-- Reportes
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permisos p 
WHERE r.nombre = 'reportes' AND p.clave IN (
  'ver_productos', 'ver_ventas', 'ver_reservas',
  'ver_reportes', 'exportar_reportes', 'ver_inventario'
);

-- Contador
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permisos p 
WHERE r.nombre = 'contador' AND p.clave IN (
  'ver_reportes', 'exportar_reportes'
);

-- Soporte
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permisos p 
WHERE r.nombre = 'soporte' AND p.clave IN (
  'ver_productos', 'ver_ventas', 'ver_reservas', 'ver_reportes',
  'ver_usuarios', 'ver_consultas', 'ver_configuracion'
);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can read profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Only admins can manage profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Políticas para roles (solo lectura)
CREATE POLICY "Anyone can read roles" ON public.roles
  FOR SELECT USING (true);

-- Políticas para permisos (solo lectura)
CREATE POLICY "Anyone can read permissions" ON public.permisos
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read role_permissions" ON public.role_permissions
  FOR SELECT USING (true);

-- Políticas para user_permissions
CREATE POLICY "Users can read own permissions" ON public.user_permissions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage user_permissions" ON public.user_permissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Políticas para audit_log
CREATE POLICY "Users can read audit_log" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "System can insert audit_log" ON public.audit_log
  FOR INSERT WITH CHECK (true);

-- =============================================
-- FUNCIÓN: Obtener permisos de usuario
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_uuid UUID)
RETURNS TEXT[] AS $$
DECLARE
  user_role TEXT;
  role_perms TEXT[];
  extra_perms TEXT[];
  all_perms TEXT[];
BEGIN
  -- Obtener rol del usuario
  SELECT rol INTO user_role FROM public.profiles WHERE id = user_uuid;
  
  IF user_role IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  
  -- Permisos del rol
  SELECT ARRAY_AGG(p.clave) INTO role_perms
  FROM public.role_permissions rp
  JOIN public.permisos p ON rp.permission_id = p.id
  JOIN public.roles r ON rp.role_id = r.id
  WHERE r.nombre = user_role;
  
  -- Permisos extra del usuario
  SELECT COALESCE(permisos_extra, ARRAY[]::TEXT[]) INTO extra_perms
  FROM public.profiles WHERE id = user_uuid;
  
  -- Combinar
  all_perms := COALESCE(role_perms, ARRAY[]::TEXT[]) || COALESCE(extra_perms, ARRAY[]::TEXT[]);
  
  RETURN all_perms;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCIÓN: Crear usuario con profile
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, rol)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'nombre',
    COALESCE(NEW.raw_user_meta_data->>'rol', 'vendedor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear profile automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNCIÓN: Obtener todos los usuarios
-- =============================================
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  nombre TEXT,
  rol TEXT,
  activo BOOLEAN,
  permisos_extra TEXT[],
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.nombre,
    p.rol,
    p.activo,
    p.permisos_extra,
    p.created_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCIÓN: Actualizar usuario
-- =============================================
CREATE OR REPLACE FUNCTION public.update_user_profile(
  target_user_id UUID,
  new_nombre TEXT,
  new_rol TEXT,
  new_activo BOOLEAN,
  new_permisos_extra TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
  is_admin BOOLEAN;
BEGIN
  current_user_id := auth.uid();
  
  -- Verificar que es admin
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = current_user_id AND rol = 'admin') INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'No tienes permisos para modificar usuarios';
  END IF;
  
  UPDATE public.profiles
  SET 
    nombre = COALESCE(new_nombre, nombre),
    rol = COALESCE(new_rol, rol),
    activo = COALESCE(new_activo, activo),
    permisos_extra = COALESCE(new_permisos_extra, permisos_extra),
    updated_at = NOW()
  WHERE id = target_user_id;
  
  -- Log de auditoría
  INSERT INTO public.audit_log (user_id, action, target_user_id, details)
  VALUES (current_user_id, 'update_user', target_user_id, jsonb_build_object(
    'nombre', new_nombre,
    'rol', new_rol,
    'activo', new_activo
  ));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCIÓN: Eliminar usuario (soft delete)
-- =============================================
CREATE OR REPLACE FUNCTION public.soft_delete_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
  is_admin BOOLEAN;
BEGIN
  current_user_id := auth.uid();
  
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = current_user_id AND rol = 'admin') INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'No tienes permisos para eliminar usuarios';
  END IF;
  
  UPDATE public.profiles SET activo = false, updated_at = NOW() WHERE id = target_user_id;
  
  INSERT INTO public.audit_log (user_id, action, target_user_id, details)
  VALUES (current_user_id, 'delete_user', target_user_id, '{"soft_delete": true}');
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- GRANTs
-- =============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
