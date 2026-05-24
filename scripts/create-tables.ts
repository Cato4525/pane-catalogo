import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tepfloisnlddowhmlfld.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlcGZsb2lzbmxkZG93aG1sZmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjYyNTEsImV4cCI6MjA4OTM0MjI1MX0.Dy3cT3kUbei4nwtrpIMWkIQumt4c9ZgaBWHjK52FvuE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTables() {
  console.log('Creando tablas en Supabase...')

  // Tabla product_colors
  const { error: productColorsError } = await supabase.rpc('create_table_if_not_exists', {
    table_name: 'product_colors',
    sql: `
      CREATE TABLE IF NOT EXISTS product_colors (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        product_id UUID NOT NULL,
        color_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow all access to product_colors" ON product_colors FOR ALL USING (true) WITH CHECK (true);
    `
  }).catch(() => null)

  // Si RPC no funciona, intentamos con sql directa (esto requiere permisos de service_role)
  // Como no tenemos service_role key, mostraremos el SQL a ejecutar
  
  console.log('\n=== SQL para ejecutar en Supabase Dashboard ===\n')
  console.log(`
-- Tabla product_colors
CREATE TABLE IF NOT EXISTS product_colors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  color_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;

-- Política de acceso
CREATE POLICY "Allow all access to product_colors" ON product_colors 
  FOR ALL USING (true) WITH CHECK (true);

-- Tabla product_sizes
CREATE TABLE IF NOT EXISTS product_sizes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  size_id UUID NOT NULL,
  stock INTEGER DEFAULT 0,
  precio DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to product_sizes" ON product_sizes 
  FOR ALL USING (true) WITH CHECK (true);

-- Tabla colors
CREATE TABLE IF NOT EXISTS colors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo_hex TEXT DEFAULT '#000000',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to colors" ON colors 
  FOR ALL USING (true) WITH CHECK (true);

-- Tabla sizes
CREATE TABLE IF NOT EXISTS sizes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to sizes" ON sizes 
  FOR ALL USING (true) WITH CHECK (true);

-- Tabla models
CREATE TABLE IF NOT EXISTS models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to models" ON models 
  FOR ALL USING (true) WITH CHECK (true);

-- Insertar colores por defecto
INSERT INTO colors (nombre, codigo_hex) VALUES 
  ('Negro', '#1a1a1a'),
  ('Gris', '#808080'),
  ('Azul', '#4169E1'),
  ('Rosado', '#FF69B4'),
  ('Beige', '#F5F5DC'),
  ('Dorado', '#DAA520'),
  ('Verde', '#228B22'),
  ('Morado', '#800080')
ON CONFLICT DO NOTHING;

-- Insertar tallas por defecto
INSERT INTO sizes (nombre, orden) VALUES 
  ('XS', 1),
  ('S', 2),
  ('M', 3),
  ('L', 4),
  ('XL', 5)
ON CONFLICT DO NOTHING;

-- Insertar modelos por defecto
INSERT INTO models (nombre, descripcion) VALUES 
  ('Universo', 'Modelo universe de alta compresión'),
  ('Natural', 'Modelo natural de comodidad extrema'),
  ('Fitnets', 'Modelo fitnets con control abdominal')
ON CONFLICT DO NOTHING;
  `)
  
  console.log('\n=== Copia y pega el SQL de arriba en el SQL Editor de Supabase ===\n')
}

createTables()
