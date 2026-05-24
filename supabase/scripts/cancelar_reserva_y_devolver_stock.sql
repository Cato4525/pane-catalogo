-- =====================================================
-- Función: Cancelar reserva y devolver stock
-- =====================================================
CREATE OR REPLACE FUNCTION cancelar_reserva_y_devolver_stock(
    p_reservation_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reserva reservations%ROWTYPE;
    v_item record;
    v_stock_actual INTEGER;
BEGIN
    -- 1. Obtener datos de la reserva
    SELECT * INTO v_reserva FROM reservations WHERE id = p_reservation_id;
    
    IF v_reserva IS NULL THEN
        RAISE EXCEPTION 'Reserva no encontrada';
    END IF;

    IF v_reserva.estado = 'cancelado' THEN
        RAISE EXCEPTION 'La reserva ya está cancelada';
    END IF;

    -- 2. Devolver stock por cada item
    FOR v_item IN SELECT * FROM reservation_items WHERE reservation_id = p_reservation_id
    LOOP
        -- Obtener stock actual
        SELECT stock INTO v_stock_actual FROM products WHERE id = v_item.product_id;
        
        -- Devolver stock
        UPDATE products 
        SET stock = stock + v_item.cantidad 
        WHERE id = v_item.product_id;

        -- Registrar movimiento
        INSERT INTO stock_movements (
            product_id,
            tipo,
            cantidad,
            stock_anterior,
            stock_nuevo,
            motivo,
            referencia,
            reservation_id,
            user_id
        ) VALUES (
            v_item.product_id,
            'devolucion_reserva',
            v_item.cantidad,
            v_stock_actual,
            v_stock_actual + v_item.cantidad,
            'Cancelación de reserva ' || v_reserva.codigo,
            v_reserva.codigo,
            p_reservation_id,
            p_user_id
        );
    END LOOP;

    -- 3. Marcar reserva como cancelada
    UPDATE reservations
    SET 
        estado = 'cancelado',
        fecha_cancelado = NOW(),
        notas_admin = COALESCE(notas_admin, '') || E'\n[Cancelada por usuario: ' || p_user_id || ' - ' || NOW() || ']'
    WHERE id = p_reservation_id;

    RETURN TRUE;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION cancelar_reserva_y_devolver_stock TO authenticated;
GRANT EXECUTE ON FUNCTION cancelar_reserva_y_devolver_stock TO service_role;
