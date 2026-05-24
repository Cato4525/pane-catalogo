-- Insertar productos de leggins en Supabase
-- Ejecutar en SQL Editor de Supabase

-- Primero verificar que existen las categorías necesarias
-- Si no existen, crearlas
INSERT INTO categories (nombre, descripcion, orden) VALUES
('Llanas', 'Leggings lisos sin ningún detalle adicional', 1),
('Troqueleadas', 'Leggings con diseños troquelados y texturas', 2),
('Cierres', 'Leggings con cierre en cintura o tobillo', 3),
('Con Bolsillo', 'Leggings con bolsillo lateral o en cintura', 4),
('Con Pedrería', 'Leggings con detalles en pedrería y brillo', 5)
ON CONFLICT DO NOTHING;

-- Verificar modelos
INSERT INTO models (nombre, descripcion) VALUES
('Universe', 'Modelo de alta compresión'),
('Natural', 'Modelo de comodidad extrema'),
('Fitnets', 'Modelo con control abdominal')
ON CONFLICT DO NOTHING;

-- Obtener IDs de categorías y modelos
DO $$
DECLARE
  cat_llanas UUID;
  cat_troqueleadas UUID;
  mod_universe UUID;
  mod_natural UUID;
  mod_fitnets UUID;
BEGIN
  SELECT id INTO cat_llanas FROM categories WHERE nombre = 'Llanas' LIMIT 1;
  SELECT id INTO cat_troqueleadas FROM categories WHERE nombre = 'Troqueleadas' LIMIT 1;
  SELECT id INTO mod_universe FROM models WHERE nombre = 'Universe' LIMIT 1;
  SELECT id INTO mod_natural FROM models WHERE nombre = 'Natural' LIMIT 1;
  SELECT id INTO mod_fitnets FROM models WHERE nombre = 'Fitnets' LIMIT 1;
  
  -- Insertar productos de leggins
  INSERT INTO products (codigo, nombre, descripcion, precio, stock, category_id, model_id, colores, tallas, imagenes, estado_catalogo, tipo_catalogo, coleccion, activo, en_liquidacion, slug) VALUES
  ('LEG-001', 'Leggin Universe Negro', 'Leggin de alta compresión, tela suave y stretch. Ideal para ejercicio y uso diario.', 25000, 50, cat_llanas, mod_universe, ARRAY['Negro'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80', 'clasico', 'permanente', 'Colección Universo', true, false, 'leggin-universe-negro'),
  ('LEG-002', 'Leggin Fitnets Rosado', 'Leggin con tecnología fitnets, control abdominal y tela transpirable. Perfecto para entrenamiento intenso.', 28000, 30, cat_troqueleadas, mod_fitnets, ARRAY['Rosado'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80'], 'tendencia', 'temporada', 'Primavera-Verano 2024', true, false, 'leggin-fitnets-rosado'),
  ('LEG-003', 'Leggin Natural Gris', 'Leggin de corte natural, tela orgánica sin químicos. Máxima comodidad para todo el día.', 22000, 25, cat_llanas, mod_natural, ARRAY['Gris'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80'], 'exclusivo', 'temporada', 'Edición Limitada', true, false, 'leggin-natural-gris'),
  ('LEG-004', 'Leggin Universe Azul', 'Leggin universe en color azul vibrante. Perfecto para quienes buscan estilo y comodidad.', 26000, 40, cat_llanas, mod_universe, ARRAY['Azul'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80'], 'clasico', 'permanente', 'Colección Universo', true, false, 'leggin-universe-azul'),
  ('LEG-005', 'Leggin Fitnets Beige', 'Leggin fitnets en tono beige elegante. Ideal para瑜伽 y ejercicios de baja intensidad.', 27000, 35, cat_troqueleadas, mod_fitnets, ARRAY['Beige'], ARRAY['S', 'M', 'L'], ARRAY['https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80'], 'tendencia', 'permanente', 'Essential', true, false, 'leggin-fitnets-beige'),
  ('LEG-006', 'Leggin Natural Negro', 'Leggin natural de corte clásico en negro. Tela premium que no se transparenta.', 23000, 45, cat_llanas, mod_natural, ARRAY['Negro'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80'], 'clasico', 'permanente', 'Basic', true, false, 'leggin-natural-negro'),
  ('LEG-007', 'Leggin Universe Morado', 'Leggin universe en color morado vibrante. Luce genial en cualquier ocasião.', 26000, 28, cat_llanas, mod_universe, ARRAY['Morado'], ARRAY['S', 'M', 'L'], ARRAY['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80'], 'exclusivo', 'temporada', 'Primavera 2024', true, false, 'leggin-universe-morado'),
  ('LEG-008', 'Leggin Fitnets Verde', 'Leggin fitnets en verde esmeralda. Perfecto para entrenamiento y uso diario.', 28000, 22, cat_troqueleadas, mod_fitnets, ARRAY['Verde'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80'], 'tendencia', 'permanente', 'Colección Verde', true, false, 'leggin-fitnets-verde'),
  ('LEG-009', 'Leggin Natural Dorado', 'Leggin natural con detalles en dorado. Para ocasiones especiales.', 32000, 15, cat_troqueleadas, mod_natural, ARRAY['Dorado'], ARRAY['S', 'M', 'L'], ARRAY['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80'], 'exclusivo', 'temporada', 'Edición Premium', true, false, 'leggin-natural-dorado'),
  ('LEG-010', 'Leggin Universe Rosado', 'Leggin universe en tonos rosa. Ideal para любители del ejercicio.', 25000, 38, cat_llanas, mod_universe, ARRAY['Rosado'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80'], 'clasico', 'permanente', 'Colección Rosa', true, false, 'leggin-universe-rosado'),
  ('LEG-011', 'Leggin Fitnets Negro', 'Leggin fitnets clásico en negro. El más vendido por su versatilidad.', 28000, 55, cat_troqueleadas, mod_fitnets, ARRAY['Negro'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80'], 'clasico', 'permanente', 'Best Seller', true, false, 'leggin-fitnets-negro'),
  ('LEG-012', 'Leggin Natural Gris Claro', 'Leggin natural en gris claro. Tela suave y confortável.', 22000, 30, cat_llanas, mod_natural, ARRAY['Gris'], ARRAY['S', 'M', 'L'], ARRAY['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80'], 'clasico', 'permanente', 'Basic', true, false, 'leggin-natural-gris-claro')
  ON CONFLICT DO NOTHING;
END $$;

-- Verificar productos insertados
SELECT id, codigo, nombre, precio, stock, estado_catalogo FROM products ORDER BY created_at DESC LIMIT 20;


--EASCRIPT  CORREGIDO EJECUTADO EN LA BASE DE DATOSM, -- Categorías
INSERT INTO categories (nombre, descripcion, orden) VALUES
('Llanas',        'Leggings lisos sin ningún detalle adicional', 1),
('Troqueleadas',  'Leggings con diseños troquelados y texturas',  2),
('Cierres',       'Leggings con cierre en cintura o tobillo',     3),
('Con Bolsillo',  'Leggings con bolsillo lateral o en cintura',   4),
('Con Pedrería',  'Leggings con detalles en pedrería y brillo',   5)
ON CONFLICT DO NOTHING;

-- Modelos
INSERT INTO models (nombre, descripcion) VALUES
('Universe', 'Modelo de alta compresión'),
('Natural',  'Modelo de comodidad extrema'),
('Fitnets',  'Modelo con control abdominal')
ON CONFLICT DO NOTHING;

-- Productos
DO $$
DECLARE
  cat_llanas       UUID;
  cat_troqueleadas UUID;
  mod_universe     UUID;
  mod_natural      UUID;
  mod_fitnets      UUID;
BEGIN
  SELECT id INTO cat_llanas       FROM categories WHERE nombre = 'Llanas'       LIMIT 1;
  SELECT id INTO cat_troqueleadas FROM categories WHERE nombre = 'Troqueleadas' LIMIT 1;
  SELECT id INTO mod_universe     FROM models     WHERE nombre = 'Universe'     LIMIT 1;
  SELECT id INTO mod_natural      FROM models     WHERE nombre = 'Natural'      LIMIT 1;
  SELECT id INTO mod_fitnets      FROM models     WHERE nombre = 'Fitnets'      LIMIT 1;

  INSERT INTO products (
    codigo, nombre, descripcion,
    precio, stock,
    category_id, model_id,
    colores, tallas, imagenes,
    estado_catalogo, tipo_catalogo, coleccion,
    activo, en_liquidacion, slug
  ) VALUES
  (
    'LEG-001', 'Leggin Universe Negro',
    'Leggin de alta compresión, tela suave y stretch. Ideal para ejercicio y uso diario.',
    25000, 50, cat_llanas, mod_universe,
    ARRAY['Negro'], ARRAY['S','M','L','XL'],
    ARRAY['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80'],
    'clasico', 'permanente', 'Colección Universo', true, false, 'leggin-universe-negro'
  ),
  (
    'LEG-002', 'Leggin Fitnets Rosado',
    'Leggin con tecnología fitnets, control abdominal y tela transpirable. Perfecto para entrenamiento intenso.',
    28000, 30, cat_troqueleadas, mod_fitnets,
    ARRAY['Rosado'], ARRAY['S','M','L','XL'],
    ARRAY['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80'],
    'tendencia', 'temporada', 'Primavera-Verano 2024', true, false, 'leggin-fitnets-rosado'
  ),
  (
    'LEG-003', 'Leggin Natural Gris',
    'Leggin de corte natural, tela orgánica sin químicos. Máxima comodidad para todo el día.',
    22000, 25, cat_llanas, mod_natural,
    ARRAY['Gris'], ARRAY['XS','S','M','L','XL'],
    ARRAY['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80'],
    'exclusivo', 'temporada', 'Edición Limitada', true, false, 'leggin-natural-gris'
  ),
  (
    'LEG-004', 'Leggin Universe Azul',
    'Leggin universe en color azul vibrante. Perfecto para quienes buscan estilo y comodidad.',
    26000, 40, cat_llanas, mod_universe,
    ARRAY['Azul'], ARRAY['S','M','L','XL'],
    ARRAY['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80'],
    'clasico', 'permanente', 'Colección Universo', true, false, 'leggin-universe-azul'
  ),
  (
    'LEG-005', 'Leggin Fitnets Beige',
    'Leggin fitnets en tono beige elegante. Ideal para yoga y ejercicios de baja intensidad.',
    27000, 35, cat_troqueleadas, mod_fitnets,
    ARRAY['Beige'], ARRAY['S','M','L'],
    ARRAY['https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80'],
    'tendencia', 'permanente', 'Essential', true, false, 'leggin-fitnets-beige'
  ),
  (
    'LEG-006', 'Leggin Natural Negro',
    'Leggin natural de corte clásico en negro. Tela premium que no se transparenta.',
    23000, 45, cat_llanas, mod_natural,
    ARRAY['Negro'], ARRAY['XS','S','M','L','XL'],
    ARRAY['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80'],
    'clasico', 'permanente', 'Basic', true, false, 'leggin-natural-negro'
  ),
  (
    'LEG-007', 'Leggin Universe Morado',
    'Leggin universe en color morado vibrante. Luce genial en cualquier ocasión.',
    26000, 28, cat_llanas, mod_universe,
    ARRAY['Morado'], ARRAY['S','M','L'],
    ARRAY['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80'],
    'exclusivo', 'temporada', 'Primavera 2024', true, false, 'leggin-universe-morado'
  ),
  (
    'LEG-008', 'Leggin Fitnets Verde',
    'Leggin fitnets en verde esmeralda. Perfecto para entrenamiento y uso diario.',
    28000, 22, cat_troqueleadas, mod_fitnets,
    ARRAY['Verde'], ARRAY['S','M','L','XL'],
    ARRAY['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80'],
    'tendencia', 'permanente', 'Colección Verde', true, false, 'leggin-fitnets-verde'
  ),
  (
    'LEG-009', 'Leggin Natural Dorado',
    'Leggin natural con detalles en dorado. Para ocasiones especiales.',
    32000, 15, cat_troqueleadas, mod_natural,
    ARRAY['Dorado'], ARRAY['S','M','L'],
    ARRAY['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80'],
    'exclusivo', 'temporada', 'Edición Premium', true, false, 'leggin-natural-dorado'
  ),
  (
    'LEG-010', 'Leggin Universe Rosado',
    'Leggin universe en tonos rosa. Ideal para amantes del ejercicio.',
    25000, 38, cat_llanas, mod_universe,
    ARRAY['Rosado'], ARRAY['XS','S','M','L','XL'],
    ARRAY['https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80'],
    'clasico', 'permanente', 'Colección Rosa', true, false, 'leggin-universe-rosado'
  ),
  (
    'LEG-011', 'Leggin Fitnets Negro',
    'Leggin fitnets clásico en negro. El más vendido por su versatilidad.',
    28000, 55, cat_troqueleadas, mod_fitnets,
    ARRAY['Negro'], ARRAY['XS','S','M','L','XL'],
    ARRAY['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80'],
    'clasico', 'permanente', 'Best Seller', true, false, 'leggin-fitnets-negro'
  ),
  (
    'LEG-012', 'Leggin Natural Gris Claro',
    'Leggin natural en gris claro. Tela suave y confortable.',
    22000, 30, cat_llanas, mod_natural,
    ARRAY['Gris'], ARRAY['S','M','L'],
    ARRAY['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80'],
    'clasico', 'permanente', 'Basic', true, false, 'leggin-natural-gris-claro'
  )
  ON CONFLICT (codigo) DO NOTHING;

END $$;

-- Verificar
SELECT id, codigo, nombre, precio, stock, estado_catalogo
FROM products
ORDER BY created_at DESC
LIMIT 20;