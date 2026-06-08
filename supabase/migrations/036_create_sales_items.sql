-- =====================================================
-- MIGRATION 036: Create sales_items table for direct_sales
-- =====================================================

CREATE TABLE IF NOT EXISTS public.sales_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.direct_sales(id) ON DELETE CASCADE,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100) DEFAULT '',
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(12,2) GENERATED ALWAYS AS (quantity * price) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_items_sale_id ON public.sales_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_product_id ON public.sales_items(product_id);

ALTER TABLE public.sales_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_items_select"
ON public.sales_items FOR SELECT TO authenticated
USING (true);

CREATE POLICY "sales_items_insert"
ON public.sales_items FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "sales_items_delete"
ON public.sales_items FOR DELETE TO authenticated
USING (true);


 ejeutar tiggers para que se guarde en items sales, -- =====================================================
-- FUNCIÓN: sync_direct_sales_items
-- Convierte el JSON items → filas en sales_items
-- =====================================================

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
            sale_type,
            created_at
        )
        VALUES (
            NEW.id,
            (item->>'productId')::uuid,
            item->>'productName',
            item->>'productCode',
            (item->>'quantity')::integer,
            (item->>'price')::numeric,
            'direct_sale',
            NOW()
        );

    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;