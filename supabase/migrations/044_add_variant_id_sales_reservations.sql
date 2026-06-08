-- =====================================================
-- MIGRATION 044: Add product_variant_id to sales_items and reservation_items
-- =====================================================

-- 1. Add product_variant_id to sales_items
ALTER TABLE IF EXISTS public.sales_items
ADD COLUMN IF NOT EXISTS product_variant_id UUID;

CREATE INDEX IF NOT EXISTS idx_sales_items_variant_id
ON public.sales_items(product_variant_id);

-- 2. Add product_variant_id to reservation_items
ALTER TABLE IF EXISTS public.reservation_items
ADD COLUMN IF NOT EXISTS product_variant_id UUID;

CREATE INDEX IF NOT EXISTS idx_reservation_items_variant_id
ON public.reservation_items(product_variant_id);

-- 3. Add sale_type column (referenced by trigger but was never created)
ALTER TABLE IF EXISTS public.sales_items
ADD COLUMN IF NOT EXISTS sale_type VARCHAR(50) DEFAULT 'direct_sale';

-- 4. Update sync_direct_sales_items function to propagate productVariantId and promo fields
CREATE OR REPLACE FUNCTION public.sync_direct_sales_items()
RETURNS TRIGGER AS $$
DECLARE
    item JSONB;
BEGIN

    -- Evitar duplicados
    DELETE FROM public.sales_items
    WHERE sale_id = NEW.id;

    -- Recorrer items del JSON
    FOR item IN
        SELECT * FROM jsonb_array_elements(NEW.items::jsonb)
    LOOP

        INSERT INTO public.sales_items (
            sale_id,
            product_id,
            product_name,
            product_code,
            quantity,
            price,
            product_variant_id,
            sale_type,
            precio_original,
            precio_final,
            descuento_aplicado,
            created_at
        )
        VALUES (
            NEW.id,
            item->>'productId',
            item->>'productName',
            item->>'productCode',
            (item->>'quantity')::integer,
            (item->>'price')::numeric,
            (item->>'variantId')::uuid,
            'direct_sale',
            (item->>'price')::numeric,
            (item->>'price')::numeric,
            0,
            NOW()
        );

    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: reservation_items variant_id is populated directly from the frontend
-- (dataService.createReserva includes variantId in the insert)

-- 5. Activar trigger sync_direct_sales_items on INSERT to direct_sales
DROP TRIGGER IF EXISTS trg_sync_direct_sales_items ON public.direct_sales;
CREATE TRIGGER trg_sync_direct_sales_items
AFTER INSERT ON public.direct_sales
FOR EACH ROW
EXECUTE FUNCTION public.sync_direct_sales_items();

-- 6. Función para deducir stock de product_variants al completar una venta
CREATE OR REPLACE FUNCTION public.deduct_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    item JSONB;
    v_variant_id UUID;
    v_qty INTEGER;
BEGIN
    FOR item IN
        SELECT * FROM jsonb_array_elements(NEW.items::jsonb)
    LOOP
        v_variant_id := (item->>'variantId')::uuid;
        v_qty := (item->>'quantity')::integer;

        IF v_variant_id IS NOT NULL AND v_qty > 0 THEN
            UPDATE public.product_variants
            SET stock = GREATEST(0, stock - v_qty)
            WHERE id = v_variant_id;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deduct_stock_on_sale ON public.direct_sales;
CREATE TRIGGER trg_deduct_stock_on_sale
AFTER INSERT ON public.direct_sales
FOR EACH ROW
WHEN (NEW.estado = 'completado')
EXECUTE FUNCTION public.deduct_stock_on_sale();

-- 7. Función para deducir stock de product_variants al confirmar una reserva
CREATE OR REPLACE FUNCTION public.deduct_stock_on_reservation()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    IF NEW.status = 'confirmado' AND OLD.status != 'confirmado' THEN
        FOR item IN
            SELECT ri.product_variant_id, ri.cantidad
            FROM public.reservation_items ri
            WHERE ri.reserva_id = NEW.id
              AND ri.product_variant_id IS NOT NULL
        LOOP
            UPDATE public.product_variants
            SET stock = GREATEST(0, stock - item.cantidad)
            WHERE id = item.product_variant_id;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deduct_stock_on_reservation ON public.reservations;
CREATE TRIGGER trg_deduct_stock_on_reservation
AFTER UPDATE OF status ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.deduct_stock_on_reservation();

