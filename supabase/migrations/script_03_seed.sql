-- =====================================================
-- SCRIPT 3: DATOS DE PRUEBA (Opcional - Comment out para producción)
-- =====================================================
-- Descomenta solo si necesitas datos de prueba

-- Datos de prueba para reservas
/*
INSERT INTO reservations (
  client_name, client_phone, client_document, client_city,
  total, abono, saldo, status, origen
) VALUES
  ('María López', '3001234567', '1010101010', 'Quito',
   45.00, 45.00, 0.00, 'confirmado', 'pos'),
  ('Carlos Ruiz', '3209876543', '2020202020', 'Guayaquil',
   30.00, 10.00, 20.00, 'abonado', 'tienda'),
  ('Ana Torres', '3154567890', '3030303030', 'Cuenca',
   18.00, 0.00, 18.00, 'pendiente', 'tienda'),
  ('Pedro Díaz', '3005678901', '4040404040', 'Loja',
   15.00, 5.00, 10.00, 'cancelado', 'tienda');

-- Items de prueba
INSERT INTO reservation_items (reserva_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
SELECT r.id, '1', 'Leggin Universe', 2, 22.50, 45.00
FROM reservations r WHERE r.client_name = 'María López';

INSERT INTO reservation_items (reserva_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
SELECT r.id, '2', 'Leggin Fitnets', 1, 30.00, 30.00
FROM reservations r WHERE r.client_name = 'Carlos Ruiz';
*/

-- =====================================================
-- CONSULTAS ÚTILES (Para verificar después de migrar)
-- =====================================================

-- Ver todas las reservas
-- SELECT * FROM reservations ORDER BY created_at DESC LIMIT 20;

-- Ver reservas por estado
-- SELECT status, COUNT(*), SUM(total) as total FROM reservations GROUP BY status;

-- Buscar reserva por teléfono
-- SELECT * FROM reservations WHERE client_phone = '3001234567';

-- Ver estructura de la tabla
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'reservations' ORDER BY ordinal_position;