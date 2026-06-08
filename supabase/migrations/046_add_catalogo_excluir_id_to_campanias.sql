ALTER TABLE campanias ADD COLUMN catalogo_excluir_id UUID REFERENCES catalogos(id) ON DELETE SET NULL;
