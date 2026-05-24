-- =====================================================
-- 02_perfiles.sql
-- Paso 2: Crear tabla de PERFILES (Usuarios Admin)
-- =====================================================

-- Tabla de perfiles de usuario (conecta con Supabase Auth)
CREATE TABLE perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    nombre VARCHAR(200),
    rol VARCHAR(20) DEFAULT 'admin' CHECK (rol IN ('admin', 'vendedor', 'viewer')),
    avatar_url TEXT,
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "perfiles_read" ON perfiles FOR SELECT USING (true);
CREATE POLICY "perfiles_insert" ON perfiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "perfiles_update" ON perfiles FOR UPDATE USING (auth.uid() = id);

-- Trigger para crear perfil automáticamente cuando se crea usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO perfiles (id, email, nombre)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'nombre');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Comentario:
-- Esta tabla se conecta automáticamente con Supabase Auth
-- Cuando se crea un usuario en Auth, se crea automáticamente su perfil
