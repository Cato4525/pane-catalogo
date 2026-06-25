ALTER TABLE campanias ADD COLUMN IF NOT EXISTS codigo VARCHAR(100) DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_campanias_codigo ON campanias(codigo);

COMMENT ON COLUMN campanias.codigo IS 'Código promocional interno para identificar la campaña (ej: PROMO28)';
