-- Migration: Create RPC function for generic promotion rules validation
-- Server-side source of truth for color combination rules.
-- Supports three modes: different, same, custom
--
-- Modo "different": color_tipo_1 != color_tipo_2 (ej: color + oscuro, color + negro)
-- Modo "same": color_tipo_1 == color_tipo_2 (ej: color + color, oscuro + oscuro)
-- Modo "custom": combinaciones permitidas/bloqueadas explícitamente

CREATE OR REPLACE FUNCTION validate_promotion_rules(
  p_variant_ids TEXT[],       -- IDs de product_variants
  p_quantities INT[],         -- Cantidades correspondientes
  p_rules JSONB               -- { colorCombinationMode, allowedCombinations[], blockedCombinations[] }
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total_qty INT := 0;
  v_mode TEXT;
  v_allowed TEXT[];
  v_blocked TEXT[];
  v_tipos TEXT[];
  v_i INT;
  v_j INT;
  v_color_tipo TEXT;
  v_pair TEXT;
  v_tipo_a TEXT;
  v_tipo_b TEXT;
  v_result JSONB;
  v_sin_tipo INT := 0;
BEGIN
  -- Validate parameters
  IF p_rules IS NULL OR p_rules->>'colorCombinationMode' IS NULL THEN
    RETURN jsonb_build_object('valid', true, 'message', null);
  END IF;

  -- Extract rules
  v_mode := p_rules->>'colorCombinationMode';
  v_allowed := ARRAY(
    SELECT jsonb_array_elements_text(p_rules->'allowedCombinations')
  );
  v_blocked := ARRAY(
    SELECT jsonb_array_elements_text(p_rules->'blockedCombinations')
  );

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

  IF v_total_qty < 2 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Agrega al menos 2 productos para aplicar la promoción.'
    );
  END IF;

  -- Collect all color_tipos
  FOR v_i IN 1 .. COALESCE(array_length(p_variant_ids, 1), 0) LOOP
    FOR v_j IN 1 .. p_quantities[v_i] LOOP
      SELECT COALESCE(pv.color_tipo, '')
      INTO v_color_tipo
      FROM product_variants pv
      WHERE pv.id = p_variant_ids[v_i];

      IF v_color_tipo IS NULL OR v_color_tipo = '' THEN
        v_sin_tipo := v_sin_tipo + 1;
      END IF;
      v_tipos := array_append(v_tipos, v_color_tipo);
    END LOOP;
  END LOOP;

  IF v_sin_tipo > 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Todos los productos deben tener un tipo de color asignado.'
    );
  END IF;

  -- Validate by mode
  IF v_mode = 'different' THEN
    -- Check that we have at least 2 different types
    IF (SELECT count(DISTINCT t) FROM unnest(v_tipos) t) < 2 THEN
      RETURN jsonb_build_object(
        'valid', false,
        'message', 'Esta promoción requiere productos de diferentes tipos de color (ej: color + oscuro).'
      );
    END IF;

    -- Check balances
    DECLARE
      v_color_count INT := (SELECT count(*) FROM unnest(v_tipos) t WHERE t = 'color');
      v_dark_count INT := (SELECT count(*) FROM unnest(v_tipos) t WHERE t = 'oscuro');
      v_black_count INT := (SELECT count(*) FROM unnest(v_tipos) t WHERE t = 'negro');
    BEGIN
      IF v_color_count > 0 AND v_dark_count > 0 AND v_black_count = 0 THEN
        IF v_color_count = v_dark_count THEN
          RETURN jsonb_build_object('valid', true, 'message', null);
        END IF;
        RETURN jsonb_build_object(
          'valid', false,
          'message', 'Debe haber la misma cantidad de prendas de color y oscuras.'
        );
      END IF;

      IF v_color_count > 0 AND v_black_count > 0 AND v_dark_count = 0 THEN
        IF v_color_count = v_black_count THEN
          RETURN jsonb_build_object('valid', true, 'message', null);
        END IF;
        RETURN jsonb_build_object(
          'valid', false,
          'message', 'Debe haber la misma cantidad de prendas de color y negras.'
        );
      END IF;

      RETURN jsonb_build_object(
        'valid', false,
        'message', 'Esta promoción requiere combinaciones de tipos de color diferentes (color + oscuro, color + negro).'
      );
    END;
  END IF;

  IF v_mode = 'same' THEN
    IF (SELECT count(DISTINCT t) FROM unnest(v_tipos) t) = 1 THEN
      RETURN jsonb_build_object('valid', true, 'message', null);
    END IF;
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Esta promoción solo aplica para productos del mismo grupo de color.'
    );
  END IF;

  IF v_mode = 'custom' THEN
    -- Validate pairs
    IF array_length(v_tipos, 1) % 2 != 0 THEN
      -- If odd count, only fail if we need pairs
      -- Just pass the last unpaired item
    END IF;

    FOR v_i IN 1 .. array_length(v_tipos, 1) BY 2 LOOP
      IF v_i + 1 > array_length(v_tipos, 1) THEN EXIT; END IF;

      v_tipo_a := v_tipos[v_i];
      v_tipo_b := v_tipos[v_i + 1];

      -- Build pair key (sorted)
      IF v_tipo_a < v_tipo_b THEN
        v_pair := v_tipo_a || '+' || v_tipo_b;
      ELSE
        v_pair := v_tipo_b || '+' || v_tipo_a;
      END IF;

      -- Check blocked
      IF array_length(v_blocked, 1) > 0 AND v_pair = ANY(v_blocked) THEN
        RETURN jsonb_build_object(
          'valid', false,
          'message', 'Combinación no permitida: ' || replace(v_pair, '+', ' + ') || '.'
        );
      END IF;

      -- Check allowed
      IF array_length(v_allowed, 1) > 0 AND NOT (v_pair = ANY(v_allowed)) THEN
        RETURN jsonb_build_object(
          'valid', false,
          'message', 'Combinación no permitida: ' || replace(v_pair, '+', ' + ') || '.'
        );
      END IF;
    END LOOP;

    RETURN jsonb_build_object('valid', true, 'message', null);
  END IF;

  -- Unknown mode, passthrough
  RETURN jsonb_build_object('valid', true, 'message', null);
END;
$$;

COMMENT ON FUNCTION validate_promotion_rules IS 'Valida reglas de combinación de colores para promociones. Parámetros: variant_ids TEXT[], quantities INT[], rules JSONB. Retorna JSONB con {valid, message}.';
