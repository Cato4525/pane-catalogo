-- =============================================
-- TABLAS FALTANTES
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  imagen TEXT,
  activa BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Políticas para categories
DROP POLICY IF EXISTS "categories_read" ON categories;
CREATE POLICY "categories_read" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_insert" ON categories;
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "categories_update" ON categories;
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "categories_delete" ON categories;
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- INSERTAR CATEGORÍAS DE LEGGINS
-- =============================================

INSERT INTO categories (nombre, descripcion, imagen, activa, orden) VALUES
('Leggings Clásicos', 'Leggings básicos de alta calidad para uso diario', 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400', true, 1),
('Leggings Deportivos', 'Leggings técnicos para entrenamiento y ejercicio', 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400', true, 2),
('Leggings de Control', 'Leggings con control de abdomen y modelador', 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=400', true, 3),
('Leggings de Moda', 'Leggings con diseños y estilos modernos', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400', true, 4),
('Leggings de Compresión', 'Leggings de compresión para rendimiento deportivo', 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400', true, 5),
('Leggings de Talla Grande', 'Leggings adaptados para todas las tallas', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', true, 6),
('Leggings de Invierno', 'Leggings con tejido térmico para clima frío', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400', true, 7),
('Leggings de Yoga', 'Leggings elásticos ideales para yoga y pilates', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400', true, 8);

-- Verificar categorías
SELECT * FROM categories ORDER BY orden;

-- =============================================
-- ACTUALIZAR POLÍTICAS PARA TABLAS EXISTENTES
-- =============================================

-- Colors
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "colors_insert" ON colors;
CREATE POLICY "colors_insert" ON colors FOR INSERT WITH CHECK (true);

-- Sizes
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sizes_insert" ON sizes;
CREATE POLICY "sizes_insert" ON sizes FOR INSERT WITH CHECK (true);

-- Models
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "models_insert" ON models;
CREATE POLICY "models_insert" ON models FOR INSERT WITH CHECK (true);

-- Vista Catalogo
ALTER TABLE vista_catalogo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vista_catalogo_insert" ON vista_catalogo;
CREATE POLICY "vista_catalogo_insert" ON vista_catalogo FOR INSERT WITH CHECK (true);
