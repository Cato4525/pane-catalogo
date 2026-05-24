-- Migration: Fix product_colors and product_sizes tables
-- Fix 404 errors

-- Verificar y crear tablas si no existen
CREATE TABLE IF NOT EXISTS colors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo_hex TEXT DEFAULT '#000000',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sizes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_colors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  color_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, color_id)
);

CREATE TABLE IF NOT EXISTS product_sizes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  size_id UUID NOT NULL,
  stock INTEGER DEFAULT 0,
  precio DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, size_id)
);

-- RLS
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;

-- Políticas para acceso público
DROP POLICY IF EXISTS "colors_all" ON colors;
DROP POLICY IF EXISTS "sizes_all" ON sizes;
DROP POLICY IF EXISTS "product_colors_all" ON product_colors;
DROP POLICY IF EXISTS "product_sizes_all" ON product_sizes;

CREATE POLICY "colors_all" ON colors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "sizes_all" ON sizes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "product_colors_all" ON product_colors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "product_sizes_all" ON product_sizes FOR ALL USING (true) WITH CHECK (true);

-- Grants
GRANT SELECT ON colors TO anon, authenticated;
GRANT SELECT ON sizes TO anon, authenticated;
GRANT SELECT ON product_colors TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_sizes TO anon, authenticated;

-- Insertar datos de prueba si están vacías
INSERT INTO colors (nombre, codigo_hex) VALUES 
  ('Negro', '#1a1a1a'),
  ('Gris', '#808080'),
  ('Azul', '#4169E1'),
  ('Rosado', '#FF69B4'),
  ('Beige', '#F5F5DC'),
  ('Verde', '#228B22')
ON CONFLICT DO NOTHING;

INSERT INTO sizes (nombre, orden) VALUES 
  ('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5)
ON CONFLICT DO NOTHING;
