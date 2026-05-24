-- =============================================
-- MIGRATION: Fix reservation_items table
-- =============================================

-- 1. Check current structure (comentado - run manually if needed)
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'reservation_items' ORDER BY ordinal_position;

-- 2. If product_id exists but producto_id doesn't, rename it
DO $$
BEGIN
  -- Rename product_id to producto_id if needed
  IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'reservation_items' AND column_name = 'product_id') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'reservation_items' AND column_name = 'producto_id') THEN
    ALTER TABLE reservation_items RENAME COLUMN product_id TO producto_id;
  END IF;
  
  -- Rename product_name to producto_nombre if needed
  IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'reservation_items' AND column_name = 'product_name') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'reservation_items' AND column_name = 'producto_nombre') THEN
    ALTER TABLE reservation_items RENAME COLUMN product_name TO producto_nombre;
  END IF;
END $$;

-- 3. Make sure reserva_id is properly linked
-- (Already has: reserva_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE)

-- 4. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_reservation_items_reserva_id ON reservation_items(reserva_id);
CREATE INDEX IF NOT EXISTS idx_reservation_items_producto_id ON reservation_items(producto_id);

-- 5. Verify the structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'reservation_items' 
-- ORDER BY ordinal_position;
