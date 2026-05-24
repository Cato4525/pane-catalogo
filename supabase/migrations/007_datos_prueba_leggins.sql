-- =====================================================
-- DATOS DE PRUEBA PARA EL CATÁLOGO DE LEGGINGS
-- Ejecutar en SQL Editor de Supabase
-- =====================================================

-- NOTA: Este script inserta datos de prueba
-- Si ya existen datos, usa ON CONFLICT para no duplicar

-- =====================================================
-- 1. CATEGORÍAS
-- =====================================================
INSERT INTO categories (nombre, descripcion, orden) VALUES
('Llanas', 'Leggings lisos sin ningún detalle adicional', 1),
('Troqueleadas', 'Leggings con diseños troquelados y texturas', 2),
('Cierres', 'Leggings con cierre en cintura o tobillo', 3),
('Con Bolsillo', 'Leggings con bolsillo lateral o en cintura', 4),
('Con Pedrería', 'Leggings con detalles en pedrería y brillo', 5),
('Deportivas', 'Leggings especiales para deporte y ejercicio', 6),
('Casual', 'Leggings para uso diario y casual', 7)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. COLORES
-- =====================================================
INSERT INTO colors (nombre, codigo_hex) VALUES
('Negro', '#1a1a1a'),
('Gris Oscuro', '#3a3a3a'),
('Gris Claro', '#a0a0a0'),
('Azul Marino', '#1e3a5f'),
('Azul Claro', '#60a5fa'),
('Rosado', '#ec4899'),
('Rosa Fuerte', '#db2777'),
('Beige', '#f5f5dc'),
('Dorado', '#daa520'),
('Verde Militar', '#228b22'),
('Verde Menta', '#98fb98'),
('Morado', '#9333ea'),
('Rojo', '#dc2626'),
('Blanco', '#ffffff'),
('Marron', '#8b4513')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. TALLAS
-- =====================================================
INSERT INTO sizes (nombre, orden) VALUES
('XS', 1),
('S', 2),
('M', 3),
('L', 4),
('XL', 5),
('XXL', 6)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. MODELOS
-- =====================================================
INSERT INTO models (nombre, descripcion) VALUES
('Universe', 'Modelo de alta compresión, ideal para ejercicio intenso. Tela suave con tecnología stretch que se adapta al cuerpo.'),
('Natural', 'Modelo de comodidad extrema, perfecto para uso diario. Tela orgánica sin químicos, suave al tacto.'),
('Fitnets', 'Modelo con control abdominal integrado. Ideal para entrenar y moldear la figura.'),
('Classic', 'Modelo clásico de cintura alta, versátil para cualquier ocasión.')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. PRODUCTOS (Leggings)
-- =====================================================

-- Obtener IDs para usar en productos
DO $$
DECLARE
  cat_llanas UUID;
  cat_troqueleadas UUID;
  cat_cierres UUID;
  cat_bolsillo UUID;
  cat_pedreria UUID;
  cat_deportivas UUID;
  cat_casual UUID;
  mod_universe UUID;
  mod_natural UUID;
  mod_fitnets UUID;
  mod_classic UUID;
  col_negro UUID;
  col_gris UUID;
  col_azul UUID;
  col_rosado UUID;
  col_beige UUID;
  col_dorado UUID;
  col_verde UUID;
  col_morado UUID;
  tallas_principal TEXT[];
  tallas_extendido TEXT[];
BEGIN
  -- Obtener categorías
  SELECT id INTO cat_llanas FROM categories WHERE nombre = 'Llanas' LIMIT 1;
  SELECT id INTO cat_troqueleadas FROM categories WHERE nombre = 'Troqueleadas' LIMIT 1;
  SELECT id INTO cat_cierres FROM categories WHERE nombre = 'Cierres' LIMIT 1;
  SELECT id INTO cat_bolsillo FROM categories WHERE nombre = 'Con Bolsillo' LIMIT 1;
  SELECT id INTO cat_pedreria FROM categories WHERE nombre = 'Con Pedrería' LIMIT 1;
  SELECT id INTO cat_deportivas FROM categories WHERE nombre = 'Deportivas' LIMIT 1;
  SELECT id INTO cat_casual FROM categories WHERE nombre = 'Casual' LIMIT 1;
  
  -- Obtener modelos
  SELECT id INTO mod_universe FROM models WHERE nombre = 'Universe' LIMIT 1;
  SELECT id INTO mod_natural FROM models WHERE nombre = 'Natural' LIMIT 1;
  SELECT id INTO mod_fitnets FROM models WHERE nombre = 'Fitnets' LIMIT 1;
  SELECT id INTO mod_classic FROM models WHERE nombre = 'Classic' LIMIT 1;
  
  -- Obtener colores
  SELECT id INTO col_negro FROM colors WHERE nombre = 'Negro' LIMIT 1;
  SELECT id INTO col_gris FROM colors WHERE nombre = 'Gris Oscuro' LIMIT 1;
  SELECT id INTO col_azul FROM colors WHERE nombre = 'Azul Marino' LIMIT 1;
  SELECT id INTO col_rosado FROM colors WHERE nombre = 'Rosado' LIMIT 1;
  SELECT id INTO col_beige FROM colors WHERE nombre = 'Beige' LIMIT 1;
  SELECT id INTO col_dorado FROM colors WHERE nombre = 'Dorado' LIMIT 1;
  SELECT id INTO col_verde FROM colors WHERE nombre = 'Verde Militar' LIMIT 1;
  SELECT id INTO col_morado FROM colors WHERE nombre = 'Morado' LIMIT 1;
  
  tallas_principal := ARRAY['S', 'M', 'L', 'XL'];
  tallas_extendido := ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  
  -- Insertar productos
  INSERT INTO products (codigo, nombre, descripcion, precio, stock, category_id, model_id, colores, tallas, imagenes, estado_catalogo, tipo_catalogo, coleccion, activo) VALUES
  
  -- Leggings Llanas - Universe
  ('LEG-001', 'Leggin Universe Negro Premium', 'Leggin de alta compresión, tela suave y stretch. Ideal para ejercicio y uso diario. Costuras planas para máximo confort.', 35000, 45, cat_llanas, mod_universe, ARRAY['Negro'], tallas_principal, ARRAY['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80'], 'clasico', 'permanente', 'Colección Universe', true),
  
  ('LEG-002', 'Leggin Universe Azul Marino', 'Leggin universe en color azul vibrante. Perfecto para quienes buscan estilo y comodidad en el gimnasio.', 35000, 38, cat_llanas, mod_universe, ARRAY['Azul Marino'], tallas_principal, ARRAY['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80'], 'clasico', 'permanente', 'Colección Universe', true),
  
  ('LEG-003', 'Leggin Universe Gris Oscuro', 'Leggin universe en gris elegante. Combina con cualquier outfit, ideal para treino o casual.', 32000, 30, cat_llanas, mod_universe, ARRAY['Gris Oscuro'], tallas_extendido, ARRAY['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80'], 'clasico', 'permanente', 'Colección Universe', true),
  
  -- Leggings Llanas - Natural
  ('LEG-004', 'Leggin Natural Negro Básico', 'Leggin natural de corte clásico en negro. Tela premium que no se transparenta, máxima comodidad.', 28000, 55, cat_llanas, mod_natural, ARRAY['Negro'], tallas_extendido, ARRAY['https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80'], 'clasico', 'permanente', 'Basic Collection', true),
  
  ('LEG-005', 'Leggin Natural Beige', 'Leggin natural en tono beige elegante. Ideal para yoga y ejercicios de baja intensidad.', 30000, 25, cat_llanas, mod_natural, ARRAY['Beige'], ARRAY['S', 'M', 'L'], ARRAY['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80'], 'tendencia', 'permanente', 'Essential', true),
  
  ('LEG-006', 'Leggin Natural Verde Menta', 'Leggin natural en verde menta fresco. Perfecto para verano y actividades al aire libre.', 29000, 20, cat_llanas, mod_natural, ARRAY['Verde Menta'], tallas_principal, ARRAY['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80'], 'nuevo', 'temporada', 'Primavera 2024', true),
  
  -- Leggings Troqueleadas - Fitnets
  ('LEG-007', 'Leggin Fitnets Rosado', 'Leggin con tecnología fitnets, control abdominal y tela transpirable. Perfecto para entrenamiento intenso.', 38000, 32, cat_troqueleadas, mod_fitnets, ARRAY['Rosado'], tallas_principal, ARRAY['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80'], 'tendencia', 'temporada', 'Primavera-Verano 2024', true),
  
  ('LEG-008', 'Leggin Fitnets Negro', 'Leggin fitnets clásico en negro. El más vendido por su versatilidad y control.', 38000, 50, cat_troqueleadas, mod_fitnets, ARRAY['Negro'], tallas_extendido, ARRAY['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80'], 'clasico', 'permanente', 'Best Seller', true),
  
  ('LEG-009', 'Leggin Fitnets Morado', 'Leggin fitnets en color morado vibrante. Para destacar en el gimnasio con estilo.', 36000, 28, cat_troqueleadas, mod_fitnets, ARRAY['Morado'], tallas_principal, ARRAY['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80'], 'exclusivo', 'temporada', 'Edición Premium', true),
  
  ('LEG-010', 'Leggin Fitnets Verde Militar', 'Leggin fitnets en verde militar. Perfecto para entrenamiento y uso diario.', 36000, 22, cat_troqueleadas, mod_fitnets, ARRAY['Verde Militar'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80'], 'tendencia', 'permanente', 'Colección Verde', true),
  
  -- Leggings con Diseño Especial
  ('LEG-011', 'Leggin Clásico Azul Marino', 'Leggin clásico de cintura alta, versátil para cualquier ocasión. Tela de alta calidad.', 32000, 40, cat_casual, mod_classic, ARRAY['Azul Marino'], tallas_principal, ARRAY['https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80'], 'clasico', 'permanente', 'Classic Collection', true),
  
  ('LEG-012', 'Leggin Dorado Premium', 'Leggin natural con detalles en dorado. Para ocasiones especiales y eventos.', 45000, 15, cat_pedreria, mod_natural, ARRAY['Dorado'], ARRAY['S', 'M', 'L'], ARRAY['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80'], 'exclusivo', 'temporada', 'Edición Premium', true),
  
  -- Leggings Deportivos
  ('LEG-013', 'Leggin Universe Deportivo Negro', 'Leggin universe especial para deporte. Secado rápido y control de sudor.', 40000, 35, cat_deportivas, mod_universe, ARRAY['Negro'], tallas_extendido, ARRAY['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80'], 'clasico', 'permanente', 'Sport Line', true),
  
  ('LEG-014', 'Leggin Fitnets Deportivo Rosado', 'Leggin fitnets diseñado para entrenamiento intenso. Máxima compresión y soporte.', 42000, 28, cat_deportivas, mod_fitnets, ARRAY['Rosado'], tallas_principal, ARRAY['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80'], 'tendencia', 'permanente', 'Sport Line', true),
  
  -- Productos en Liquidación
  ('LEG-015', 'Leggin Natural Gris Claro - Liquidación', 'Leggin natural en gris claro. Tela suave y confortável. ¡Últimas unidades!', 15000, 8, cat_llanas, mod_natural, ARRAY['Gris Oscuro'], ARRAY['M', 'L'], ARRAY['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80'], 'liquidacion', 'permanente', 'Liquidación', true)
  ON CONFLICT DO NOTHING;
  
END $$;

-- =====================================================
-- 6. VERIFICACIÓN
-- =====================================================

-- Ver conteo de registros
SELECT 'products' as tabla, COUNT(*) as total FROM products
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'colors', COUNT(*) FROM colors
UNION ALL
SELECT 'sizes', COUNT(*) FROM sizes
UNION ALL
SELECT 'models', COUNT(*) FROM models;

-- Ver productos
SELECT codigo, nombre, precio, stock, estado_catalogo FROM products ORDER BY created_at DESC;