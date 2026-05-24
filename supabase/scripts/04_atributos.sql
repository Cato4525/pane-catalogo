-- =====================================================
-- 04_atributos.sql
-- Paso 4: Crear tablas de ATRIBUTOS (Categories, Colors, Sizes, Models)
-- =====================================================

-- =====================
-- TABLA: CATEGORIES
-- =====================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    imagen VARCHAR(500),
    orden INTEGER DEFAULT 0,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_auth_insert" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "categories_auth_update" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "categories_auth_delete" ON categories FOR DELETE USING (auth.role() = 'authenticated');

-- =====================
-- TABLA: COLORS
-- =====================
CREATE TABLE colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    codigo_hex VARCHAR(7) DEFAULT '#000000',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colors_public_read" ON colors FOR SELECT USING (true);
CREATE POLICY "colors_auth_insert" ON colors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "colors_auth_update" ON colors FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "colors_auth_delete" ON colors FOR DELETE USING (auth.role() = 'authenticated');

-- =====================
-- TABLA: SIZES (Tallas)
-- =====================
CREATE TABLE sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(20) NOT NULL,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sizes_public_read" ON sizes FOR SELECT USING (true);
CREATE POLICY "sizes_auth_insert" ON sizes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "sizes_auth_update" ON sizes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "sizes_auth_delete" ON sizes FOR DELETE USING (auth.role() = 'authenticated');

-- =====================
-- TABLA: MODELS
-- =====================
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "models_public_read" ON models FOR SELECT USING (true);
CREATE POLICY "models_auth_insert" ON models FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "models_auth_update" ON models FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "models_auth_delete" ON models FOR DELETE USING (auth.role() = 'authenticated');

-- =====================
-- INSERTAR DATOS INICIALES
-- =====================

-- Categorías
INSERT INTO categories (nombre, descripcion, orden) VALUES
('Panadería', 'Productos de panadería', 1),
('Pasteles', 'Pasteles y repostería', 2),
('Bebidas', 'Bebidas frías y calientes', 3),
('Galletas', 'Galletas y bocadillos', 4),
('Especiales', 'Productos especiales de temporada', 5);

-- Colores
INSERT INTO colors (nombre, codigo_hex) VALUES
('Negro', '#1a1a1a'),
('Gris', '#808080'),
('Azul', '#4169E1'),
('Rosado', '#FF69B4'),
('Beige', '#F5F5DC'),
('Dorado', '#DAA520'),
('Verde', '#228B22'),
('Morado', '#800080');

-- Tallas
INSERT INTO sizes (nombre, orden) VALUES
('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5);

-- Modelos
INSERT INTO models (nombre, descripcion) VALUES
('Universo', 'Modelo de alta compresión'),
('Natural', 'Modelo de comodidad extrema'),
('Fitnets', 'Modelo con control abdominal');

-- Verificar datos
SELECT 'categories' as tabla, COUNT(*) as total FROM categories
UNION ALL
SELECT 'colors', COUNT(*) FROM colors
UNION ALL
SELECT 'sizes', COUNT(*) FROM sizes
UNION ALL
SELECT 'models', COUNT(*) FROM models;
