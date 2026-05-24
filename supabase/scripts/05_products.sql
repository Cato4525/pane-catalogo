-- =====================================================
-- 05_products.sql
-- Paso 5: Crear tabla de PRODUCTOS
-- =====================================================

-- Tabla de productos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(12,2) NOT NULL DEFAULT 0,
    precio_liquidacion DECIMAL(12,2),
    stock INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    
    -- Relaciones FK
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    model_id UUID REFERENCES models(id) ON DELETE SET NULL,
    
    -- Atributos como arrays
    colores VARCHAR(255)[],
    tallas VARCHAR(255)[],
    imagenes TEXT[],
    
    -- Estados del catálogo
    estado_catalogo VARCHAR(20) DEFAULT 'clasico',
    tipo_catalogo VARCHAR(20) DEFAULT 'permanente',
    coleccion VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    en_liquidacion BOOLEAN DEFAULT false,
    
    -- SEO
    slug VARCHAR(255),
    meta_titulo VARCHAR(255),
    meta_descripcion TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda
CREATE INDEX idx_products_codigo ON products(codigo);
CREATE INDEX idx_products_nombre ON products(nombre);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_estado ON products(estado_catalogo);
CREATE INDEX idx_products_activo ON products(activo);
CREATE INDEX idx_products_precio ON products(precio);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);
CREATE POLICY "products_auth_insert" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "products_auth_update" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "products_auth_delete" ON products FOR DELETE USING (auth.role() = 'authenticated');

-- =====================
-- TABLAS RELACIONALES (Mucho a Mucho)
-- =====================

-- Producto - Color
CREATE TABLE product_colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    color_id UUID REFERENCES colors(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, color_id)
);

-- Producto - Talla
CREATE TABLE product_sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    size_id UUID REFERENCES sizes(id) ON DELETE CASCADE,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, size_id)
);

-- =====================
-- INSERTAR PRODUCTOS DE EJEMPLO
-- =====================

-- Obtener IDs de categorías
DO $$
DECLARE
    panaderia_id UUID;
    pasteles_id UUID;
    bebidas_id UUID;
    galletas_id UUID;
    modelos_id UUID;
BEGIN
    SELECT id INTO panaderia_id FROM categories WHERE nombre = 'Panadería';
    SELECT id INTO pasteles_id FROM categories WHERE nombre = 'Pasteles';
    SELECT id INTO bebidas_id FROM categories WHERE nombre = 'Bebidas';
    SELECT id INTO galletas_id FROM categories WHERE nombre = 'Galletas';
    SELECT id INTO modelos_id FROM models WHERE nombre = 'Universo';
    
    -- Insertar productos
    INSERT INTO products (nombre, codigo, descripcion, precio, category_id, model_id, stock, estado_catalogo, tipo_catalogo, colores, tallas) VALUES
    ('Baguette Francés', 'SKU-001', 'Baguette crujiente recién horneado', 2.50, panaderia_id, modelos_id, 50, 'exclusivo', 'permanente', ARRAY['Dorado'], ARRAY['S','M','L']),
    ('Croissant', 'SKU-002', 'Croissant hojaldrado con mantequilla', 3.00, panaderia_id, modelos_id, 30, 'tendencia', 'permanente', ARRAY['Dorado'], ARRAY['S','M']),
    ('Pan Multigrano', 'SKU-003', 'Pan saludable con mezcla de granos', 4.50, panaderia_id, modelos_id, 25, 'clasico', 'permanente', ARRAY['Integral'], ARRAY['M','L','XL']),
    ('Donas Glaseadas', 'SKU-004', 'Donas con glaseado de vainilla', 3.50, galletas_id, modelos_id, 40, 'tendencia', 'permanente', ARRAY['Chocolate','Vanilla'], ARRAY['Único']),
    ('Café Latte', 'SKU-005', 'Café con leche cremosa', 4.00, bebidas_id, modelos_id, 100, 'clasico', 'permanente', ARRAY['Café'], ARRAY['Grande','Mediano']),
    ('Jugo de Naranja', 'SKU-006', 'Jugo natural exprimido', 3.00, bebidas_id, modelos_id, 80, 'clasico', 'permanente', ARRAY['Naranja'], ARRAY['500ml','1L']);
END $$;

-- Verificar productos
SELECT p.codigo, p.nombre, p.precio, p.stock, c.nombre as categoria
FROM products p
LEFT JOIN categories c ON c.id = p.category_id;

-- Contar productos
SELECT COUNT(*) as total_productos FROM products;
