-- Tabla de productos para Supabase
-- Ejecutar este script en el editor SQL de Supabase

-- 1. Crear tabla productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  categoria TEXT,
  images TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  estado_producto TEXT DEFAULT 'activo',
  modelo TEXT,
  color TEXT,
  codigo TEXT,
  estado_catalogo TEXT DEFAULT 'clasico',
  tipo_catalogo TEXT DEFAULT 'permanente',
  coleccion TEXT DEFAULT '',
  activo BOOLEAN DEFAULT true,
  en_liquidacion BOOLEAN DEFAULT false,
  precio_liquidacion DECIMAL(10,2),
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- 3. Política de lectura (público)
CREATE POLICY "productos_read_policy" ON productos
  FOR SELECT USING (true);

-- 4. Política de inserción (autenticados)
CREATE POLICY "productos_insert_policy" ON productos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. Política de actualización (autenticados)
CREATE POLICY "productos_update_policy" ON productos
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 6. Política de eliminación (autenticados)
CREATE POLICY "productos_delete_policy" ON productos
  FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS productos_nombre_idx ON productos(nombre);
CREATE INDEX IF NOT EXISTS productos_categoria_idx ON productos(categoria);
CREATE INDEX IF NOT EXISTS productos_estado_idx ON productos(estado_producto);

-- 8. Crear bucket para imágenes si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Policy para acceso público a imágenes
CREATE POLICY "productos_images_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'productos');

-- 10. Policy para subir imágenes (autenticados)
CREATE POLICY "productos_images_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'productos' AND auth.role() = 'authenticated');

-- 11. Policy para eliminar imágenes (autenticados)
CREATE POLICY "productos_images_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'productos' AND auth.role() = 'authenticated');

-- 12. Insertar algunos productos de ejemplo (opcional)
INSERT INTO productos (nombre, descripcion, precio, stock, categoria, modelo, estado_producto) VALUES
('Leggings Universe', 'Leggings de alta compresión con tecnología de control abdominal', 35000, 50, 'Leggings', 'Universo', 'activo'),
('Leggings Natural', 'Leggings de comodidad extrema para uso diario', 32000, 30, 'Leggings', 'Natural', 'activo'),
('Leggings Fitnets', 'Leggings con control abdominal para ejercicios', 38000, 25, 'Leggings', 'Fitnets', 'activo')
ON CONFLICT DO NOTHING;

-- Verificar estructura
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'productos' ORDER BY ordinal_position;