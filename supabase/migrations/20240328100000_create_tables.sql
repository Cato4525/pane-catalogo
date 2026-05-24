-- Migration: Create product variant tables
-- Created: 2024-03-28

-- Tabla product_colors
CREATE TABLE IF NOT EXISTS product_colors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  color_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;

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

-- Insertar datos por defecto
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

INSERT INTO sizes (nombre, orden) VALUES 
  ('XS', 1), 
  ('S', 2), 
  ('M', 3), 
  ('L', 4), 
  ('XL', 5)
ON CONFLICT DO NOTHING;

INSERT INTO models (nombre, descripcion) VALUES 
  ('Universo', 'Modelo universe de alta compresión'),
  ('Natural', 'Modelo natural de comodidad extrema'),
  ('Fitnets', 'Modelo fitnets con control abdominal')
ON CONFLICT DO NOTHING;
