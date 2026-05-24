-- =====================================================
-- 03_clients.sql
-- Paso 3: Crear tabla de CLIENTES
-- =====================================================

-- Tabla de clientes
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50) NOT NULL,
    direccion TEXT,
    ciudad VARCHAR(100),
    documento VARCHAR(50),
    tipo_documento VARCHAR(10) DEFAULT 'cc',
    observaciones TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_clients_nombre ON clients(nombre);
CREATE INDEX idx_clients_telefono ON clients(telefono);
CREATE INDEX idx_clients_email ON clients(email);

-- Función para generar código automático de cliente
CREATE OR REPLACE FUNCTION generar_codigo_cliente()
RETURNS TRIGGER AS $$
DECLARE
    secuencia INTEGER;
    codigo TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 5 FOR 6) AS INTEGER)), 0) + 1
    INTO secuencia
    FROM clients
    WHERE codigo LIKE 'CLI-%';
    
    codigo := 'CLI-' || LPAD(secuencia::TEXT, 6, '0');
    NEW.codigo := codigo;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para código automático
CREATE TRIGGER trigger_codigo_cliente
BEFORE INSERT ON clients
FOR EACH ROW
WHEN (NEW.codigo IS NULL)
EXECUTE FUNCTION generar_codigo_cliente();

-- Habilitar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "clients_read" ON clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "clients_insert" ON clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "clients_update" ON clients FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "clients_delete" ON clients FOR DELETE USING (auth.role() = 'authenticated');

-- Insertar clientes de ejemplo
INSERT INTO clients (nombre, email, telefono, direccion, ciudad, documento, tipo_documento) VALUES
('María López', 'maria@email.com', '3001234567', 'Calle 123 #45-67', 'Bogotá', '12345678', 'cc'),
('Carlos Ruiz', 'carlos@email.com', '3209876543', 'Carrera 78 #12-34', 'Medellín', '98765432', 'cc'),
('Ana Torres', 'ana@email.com', '3154567890', 'Avenida 56 #78-90', 'Cali', '45678901', 'nit');

-- Verificar códigos generados
SELECT codigo, nombre, telefono FROM clients;
