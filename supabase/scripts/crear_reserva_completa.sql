-- =====================================================
-- Función: Crear reserva completa (reserva + items)
-- =====================================================
CREATE OR REPLACE FUNCTION crear_reserva_completa(
    p_client_id UUID,
    p_user_id UUID,
    p_items JSONB,
    p_cliente_nombre VARCHAR(255),
    p_cliente_telefono VARCHAR(50),
    p_cliente_cedula VARCHAR(50) DEFAULT NULL,
    p_cliente_direccion TEXT DEFAULT NULL,
    p_abono DECIMAL(12,2) DEFAULT 0,
    p_notas TEXT DEFAULT NULL
)
RETURNS TABLE (
    reserva_id UUID,
    codigo VARCHAR(50),
    total DECIMAL(12,2),
    abono DECIMAL(12,2),
    saldo DECIMAL(12,2),
    estado VARCHAR(20),
    items JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reserva_id UUID;
    v_codigo TEXT;
    v_item JSONB;
    v_subtotal DECIMAL(12,2);
    v_total DECIMAL(12,2) := 0;
BEGIN
    -- 1. Crear la reserva
    INSERT INTO reservations (
        client_id,
        user_id,
        cliente_nombre,
        cliente_telefono,
        cliente_cedula,
        cliente_direccion,
        abono,
        notas_admin,
        estado
    ) VALUES (
        p_client_id,
        p_user_id,
        p_cliente_nombre,
        p_cliente_telefono,
        p_cliente_cedula,
        p_cliente_direccion,
        p_abono,
        p_notas,
        CASE WHEN p_abono > 0 THEN 'abonado' ELSE 'pendiente' END
    )
    RETURNING id, codigo INTO v_reserva_id, v_codigo;

    -- 2. Insertar items y calcular total
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_subtotal := (v_item->>'cantidad')::INTEGER * (v_item->>'precio_unitario')::DECIMAL(12,2);
        v_total := v_total + v_subtotal;

        INSERT INTO reservation_items (
            reservation_id,
            product_id,
            producto_nombre,
            cantidad,
            precio_unitario,
            subtotal
        ) VALUES (
            v_reserva_id,
            (v_item->>'product_id')::UUID,
            v_item->>'producto_nombre',
            (v_item->>'cantidad')::INTEGER,
            (v_item->>'precio_unitario')::DECIMAL(12,2),
            v_subtotal
        );
    END LOOP;

    -- 3. Actualizar totales de la reserva
    UPDATE reservations
    SET total = v_total,
        saldo = v_total - p_abono
    WHERE id = v_reserva_id;

    -- 4. Retornar resultado
    RETURN QUERY
    SELECT 
        r.id,
        r.codigo,
        r.total,
        r.abono,
        r.saldo,
        r.estado,
        COALESCE(
            (
                SELECT jsonb_agg(jsonb_build_object(
                    'id', ri.id,
                    'product_id', ri.product_id,
                    'producto_nombre', ri.producto_nombre,
                    'cantidad', ri.cantidad,
                    'precio_unitario', ri.precio_unitario,
                    'subtotal', ri.subtotal
                ))
                FROM reservation_items ri
                WHERE ri.reservation_id = r.id
            ),
            '[]'::jsonb
        ) as items
    FROM reservations r
    WHERE r.id = v_reserva_id;
END;
$$;

-- Permitir ejecución
GRANT EXECUTE ON FUNCTION crear_reserva_completa TO authenticated;
GRANT EXECUTE ON FUNCTION crear_reserva_completa TO anon;
GRANT EXECUTE ON FUNCTION crear_reserva_completa TO service_role;
