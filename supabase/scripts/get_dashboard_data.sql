-- =====================================================
-- Función: Obtener datos del dashboard en una sola llamada
-- =====================================================
CREATE OR REPLACE FUNCTION get_dashboard_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'reservas', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'abonadas', COUNT(*) FILTER (WHERE estado = 'abonado'),
        'confirmadas', COUNT(*) FILTER (WHERE estado = 'confirmado'),
        'canceladas', COUNT(*) FILTER (WHERE estado = 'cancelado'),
        'pendientes', COUNT(*) FILTER (WHERE estado = 'pendiente'),
        'total_abono', COALESCE(SUM(abono), 0),
        'total_saldo', COALESCE(SUM(saldo), 0)
      )
      FROM reservations
      WHERE estado != 'cancelado'
    ),
    'pedidos', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'completados', COUNT(*) FILTER (WHERE estado = 'completado'),
        'pendientes', COUNT(*) FILTER (WHERE estado = 'pendiente'),
        'cancelados', COUNT(*) FILTER (WHERE estado = 'cancelado'),
        'ingresos_totales', COALESCE(SUM(total), 0),
        'ingresos_hoy', COALESCE(SUM(total) FILTER (WHERE DATE(fecha_pedido) = CURRENT_DATE), 0),
        'ingresos_semana', COALESCE(SUM(total) FILTER (WHERE fecha_pedido >= CURRENT_DATE - INTERVAL '7 days'), 0),
        'ingresos_mes', COALESCE(SUM(total) FILTER (WHERE DATE_TRUNC('month', fecha_pedido) = DATE_TRUNC('month', CURRENT_DATE)), 0)
      )
      FROM orders
    ),
    'productos', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'activos', COUNT(*) FILTER (WHERE activo = true),
        'en_liquidacion', COUNT(*) FILTER (WHERE en_liquidacion = true),
        'stock_bajo', COUNT(*) FILTER (WHERE stock <= stock_minimo AND stock > 0),
        'sin_stock', COUNT(*) FILTER (WHERE stock = 0),
        'stock_total', COALESCE(SUM(stock), 0)
      )
      FROM products
    ),
    'clientes', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'nuevos_mes', COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE))
      )
      FROM clients
    ),
    'ventas_por_dia', (
      SELECT COALESCE(jsonb_agg(row ORDER BY dia), '[]'::jsonb)
      FROM (
        SELECT 
          TO_CHAR(fecha_pedido, 'Dy') as dia,
          TO_CHAR(fecha_pedido, 'YYYY-MM-DD') as fecha,
          COUNT(*) as num_pedidos,
          COALESCE(SUM(total), 0) as total
        FROM orders
        WHERE fecha_pedido >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(fecha_pedido), TO_CHAR(fecha_pedido, 'Dy'), TO_CHAR(fecha_pedido, 'YYYY-MM-DD')
        ORDER BY DATE(fecha_pedido)
      ) row
    ),
    'logs', (
      SELECT COALESCE(jsonb_agg(row ORDER BY created_at DESC), '[]'::jsonb)
      FROM (
        SELECT 
          id,
          accion,
          tabla_afectada,
          datos_nuevos,
          created_at,
          usuario_id
        FROM activity_log
        ORDER BY created_at DESC
        LIMIT 20
      ) row
    ),
    'stock_bajo_productos', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id,
        'nombre', nombre,
        'codigo', codigo,
        'stock', stock,
        'stock_minimo', stock_minimo
      ) ORDER BY stock ASC), '[]'::jsonb)
      FROM products
      WHERE stock <= stock_minimo AND stock > 0
      LIMIT 10
    )
  );
  
  RETURN result;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION get_dashboard_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_data TO anon;
GRANT EXECUTE ON FUNCTION get_dashboard_data TO service_role;
