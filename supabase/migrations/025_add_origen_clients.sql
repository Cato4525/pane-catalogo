-- Agregar columna origen a clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT 'panel';

-- Actualizar clientes existentes sin origen
UPDATE clients SET origen = 'panel' WHERE origen IS NULL;

-- Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_clients_origen ON clients(origen);
