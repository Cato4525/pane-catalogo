-- =============================================
-- MIGRATION 031: Fix reservas + reservation_items
-- =============================================

-- ========== RESERVATIONS ==========
ALTER TABLE reservations ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cliente_ciudad TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cliente_email VARCHAR(255);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS notas_admin TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS fecha_limite_abono TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS fecha_limite_pago TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS fecha_confirmado TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS fecha_cancelado TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS abonos JSONB DEFAULT '[]'::jsonb;

DROP POLICY IF EXISTS "Anyone can create reservations" ON reservations;
CREATE POLICY "Anyone can create reservations"
  ON reservations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view reservations" ON reservations;
CREATE POLICY "Anyone can view reservations"
  ON reservations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins full access reservations" ON reservations;
CREATE POLICY "Admins full access reservations"
  ON reservations FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ========== RESERVATION ITEMS ==========
CREATE TABLE IF NOT EXISTS reservation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    producto_id UUID,
    producto_nombre TEXT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservation_items_reserva ON reservation_items(reserva_id);

ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create reservation items" ON reservation_items;
CREATE POLICY "Anyone can create reservation items"
  ON reservation_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view reservation items" ON reservation_items;
CREATE POLICY "Anyone can view reservation items"
  ON reservation_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins full access reservation items" ON reservation_items;
CREATE POLICY "Admins full access reservation items"
  ON reservation_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
