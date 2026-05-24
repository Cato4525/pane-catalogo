-- Agregar precio a la tabla de variantes de producto
ALTER TABLE product_sizes 
ADD COLUMN IF NOT EXISTS precio DECIMAL(12,2) DEFAULT 0;

-- Actualizar el stock del producto principal como suma de todos los stocks de variantes
CREATE OR REPLACE FUNCTION actualizar_stock_producto()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock = COALESCE(
        (SELECT SUM(ps.stock) FROM product_sizes ps WHERE ps.product_id = products.id),
        0
    )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar stock cuando se modifica product_sizes
DROP TRIGGER IF EXISTS trigger_stock_variante ON product_sizes;
CREATE TRIGGER trigger_stock_variante
AFTER INSERT OR UPDATE OR DELETE ON product_sizes
FOR EACH ROW EXECUTE FUNCTION actualizar_stock_producto();

-- Habilitar RLS en product_sizes si no está habilitado
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;

-- Políticas para product_sizes
DROP POLICY IF EXISTS "product_sizes_public_read" ON product_sizes;
CREATE POLICY "product_sizes_public_read" ON product_sizes FOR SELECT USING (true);

DROP POLICY IF EXISTS "product_sizes_auth_insert" ON product_sizes;
CREATE POLICY "product_sizes_auth_insert" ON product_sizes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "product_sizes_auth_update" ON product_sizes;
CREATE POLICY "product_sizes_auth_update" ON product_sizes FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "product_sizes_auth_delete" ON product_sizes;
CREATE POLICY "product_sizes_auth_delete" ON product_sizes FOR DELETE USING (auth.role() = 'authenticated');

COMMENT ON COLUMN product_sizes.precio IS 'Precio específico para esta combinación de producto y talla';