-- Migration: Create RPC function for 2x$28 promotion validation
-- This is the server-side source of truth for promotion validation.
-- Called before applying discounts, creating reservations, or processing sales.

-- Valida que un conjunto de variantes cumpla las reglas de la promoción 2x$28:
--   - Exactamente 2 prendas elegibles
--   - 1 prenda con color_tipo = 'oscuro'
--   - 1 prenda con color_tipo = 'color'
--   - Los colores específicos no deben ser iguales

CREATE OR REPLACE FUNCTION validate_2x28_promotion(
  p_variant_ids TEXT[],       -- IDs de product_variants
  p_quantities INT[]          -- Cantidades correspondientes
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total_qty INT := 0;
  v_dark_count INT := 0;
  v_color_count INT := 0;
  v_no_tipo_count INT := 0;
  v_dark_color_name TEXT := '';
  v_color_color_name TEXT := '';
  v_variant RECORD;
  v_i INT;
  v_result JSONB;
BEGIN
  -- Validate arrays have same length
  IF array_length(p_variant_ids, 1) IS DISTINCT FROM array_length(p_quantities, 1) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Los parámetros variant_ids y quantities deben tener la misma longitud.'
    );
  END IF;

  -- Calculate total quantity
  FOR v_i IN 1 .. COALESCE(array_length(p_quantities, 1), 0) LOOP
    v_total_qty := v_total_qty + p_quantities[v_i];
  END LOOP;

  -- Must be exactly 2 items
  IF v_total_qty < 2 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'La promoción 2x$28 requiere exactamente 2 prendas.'
    );
  END IF;

  IF v_total_qty > 2 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'La promoción 2x$28 requiere exactamente 2 prendas.'
    );
  END IF;

  -- Validate each variant
  FOR v_i IN 1 .. COALESCE(array_length(p_variant_ids, 1), 0) LOOP
    FOR v_j IN 1 .. p_quantities[v_i] LOOP
      SELECT
        pv.color_tipo,
        COALESCE(pv.color_name, '') AS color_name
      INTO v_variant
      FROM product_variants pv
      WHERE pv.id = p_variant_ids[v_i];

      IF v_variant.color_tipo IS NULL OR v_variant.color_tipo = '' THEN
        v_no_tipo_count := v_no_tipo_count + 1;
      ELSIF v_variant.color_tipo = 'oscuro' THEN
        v_dark_count := v_dark_count + 1;
        v_dark_color_name := v_variant.color_name;
      ELSIF v_variant.color_tipo = 'color' THEN
        v_color_count := v_color_count + 1;
        v_color_color_name := v_variant.color_name;
      ELSE
        v_no_tipo_count := v_no_tipo_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  -- Items without tipo or with unknown tipo
  IF v_no_tipo_count > 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'La promoción 2x$28 requiere exactamente una prenda oscura y una prenda de color.'
    );
  END IF;

  -- Must have exactly 1 dark and 1 color
  IF v_dark_count != 1 OR v_color_count != 1 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'La promoción 2x$28 requiere exactamente una prenda oscura y una prenda de color.'
    );
  END IF;

  -- Colors must not be identical
  IF v_dark_color_name != '' AND v_color_color_name != ''
     AND v_dark_color_name = v_color_color_name THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'No se permite aplicar la promoción con dos prendas del mismo color.'
    );
  END IF;

  -- Valid
  RETURN jsonb_build_object(
    'valid', true,
    'message', null
  );
END;
$$;

COMMENT ON FUNCTION validate_2x28_promotion IS 'Valida las reglas de la promoción 2x$28. Parámetros: variant_ids TEXT[], quantities INT[]. Retorna JSONB con {valid, message}.';
