ALTER TABLE campanias_reglas ADD COLUMN IF NOT EXISTS monto_maximo DECIMAL(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN campanias_reglas.monto_maximo IS 'Monto máximo de compra para aplicar la regla (0 = sin límite)';
