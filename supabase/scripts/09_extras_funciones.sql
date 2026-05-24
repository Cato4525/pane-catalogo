-- =====================================================
-- 09_extras_funciones.sql
-- Paso 9: Tablas adicionales y FUNCIONES AUXILIARES
-- =====================

-- =====================
-- TABLA: VISITS
-- =====================
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip VARCHAR(50),
    user_agent TEXT,
    url VARCHAR(500),
    referrer VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visits_fecha ON visits(created_at);

-- =====================
-- TABLA: ACTIVITY_LOG
-- =====================
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(100),
    registro_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_usuario ON activity_log(usuario_id);
CREATE INDEX idx_activity_log_fecha ON activity_log(created_at);

-- =====================
-- TABLA: CATALOGS
-- =====================
CREATE TABLE catalogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) DEFAULT 'permanente',
    estado VARCHAR(20) DEFAULT 'clasico',
    activo BOOLEAN DEFAULT true,
    fecha_inicio DATE,
    fecha_fin DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla relacional
CREATE TABLE catalog_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catalog_id UUID REFERENCES catalogs(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(catalog_id, product_id)
);

-- RLS
ALTER TABLE catalogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalogs_public_read" ON catalogs FOR SELECT USING (true);
CREATE POLICY "catalogs_auth_insert" ON catalogs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "catalogs_auth_update" ON catalogs FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================
-- FUNCIONES AUXILIARES
-- =====================

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_social_networks_updated_at BEFORE UPDATE ON social_networks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_shipping_fields_updated_at BEFORE UPDATE ON shipping_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_catalogs_updated_at BEFORE UPDATE ON catalogs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- STORAGE BUCKET
-- =====================

-- Crear bucket para productos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'productos',
    'productos',
    true,
    524288,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso al Storage
DROP POLICY IF EXISTS "Public Access - productos" ON storage.objects;
CREATE POLICY "Public Access - productos" ON storage.objects 
FOR SELECT USING (bucket_id = 'productos');

DROP POLICY IF EXISTS "Allow uploads" ON storage.objects;
CREATE POLICY "Allow uploads" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'productos' AND auth.role() IN ('authenticated', 'anon', 'service_role'));

DROP POLICY IF EXISTS "Allow updates" ON storage.objects;
CREATE POLICY "Allow updates" ON storage.objects 
FOR UPDATE USING (bucket_id = 'productos');

DROP POLICY IF EXISTS "Allow deletes" ON storage.objects;
CREATE POLICY "Allow deletes" ON storage.objects 
FOR DELETE USING (bucket_id = 'productos');

-- Verificar bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'productos';

-- =====================
-- VERIFICAR TODO
-- =====================

SELECT 
    'perfiles' as tabla, COUNT(*) as total FROM perfiles
UNION ALL SELECT 'clients', COUNT(*) FROM clients
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL SELECT 'settings', COUNT(*) FROM settings
UNION ALL SELECT 'social_networks', COUNT(*) FROM social_networks
UNION ALL SELECT 'shipping_fields', COUNT(*) FROM shipping_fields;

-- Listar todas las tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
