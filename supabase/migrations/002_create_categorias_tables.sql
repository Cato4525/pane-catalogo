-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  imagen TEXT,
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias_read" ON categorias FOR SELECT USING (true);
CREATE POLICY "categorias_insert" ON categorias FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "categorias_update" ON categorias FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "categorias_delete" ON categorias FOR DELETE USING (auth.role() = 'authenticated');

-- Tabla de colores
CREATE TABLE IF NOT EXISTS colores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo_hex TEXT,
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE colores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colores_read" ON colores FOR SELECT USING (true);
CREATE POLICY "colores_manage" ON colores FOR ALL USING (auth.role() = 'authenticated');

-- Tabla de tallas
CREATE TABLE IF NOT EXISTS tallas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tallas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tallas_read" ON tallas FOR SELECT USING (true);
CREATE POLICY "tallas_manage" ON tallas FOR ALL USING (auth.role() = 'authenticated');

-- Tabla de modelos
CREATE TABLE IF NOT EXISTS modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modelos_read" ON modelos FOR SELECT USING (true);
CREATE POLICY "modelos_manage" ON modelos FOR ALL USING (auth.role() = 'authenticated');

-- Insertar datos por defecto
INSERT INTO colores (nombre, codigo_hex) VALUES
('Negro', '#1a1a1a'),
('Gris', '#808080'),
('Azul', '#4169E1'),
('Rosado', '#FF69B4'),
('Beige', '#F5F5DC'),
('Dorado', '#DAA520'),
('Verde', '#228B22'),
('Morado', '#800080')
ON CONFLICT DO NOTHING;

INSERT INTO tallas (nombre, orden) VALUES
('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5)
ON CONFLICT DO NOTHING;

INSERT INTO modelos (nombre, descripcion) VALUES
('Universe', 'Modelo de alta compresión'),
('Natural', 'Modelo de comodidad extrema'),
('Fitnets', 'Modelo con control abdominal')
ON CONFLICT DO NOTHING;