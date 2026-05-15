-- ============================================================
-- FIX: Políticas RLS para as tabelas do sistema de catálogo
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

-- ──────────────────────────────────────────────
-- TABELA: products
-- ──────────────────────────────────────────────
-- Habilitar RLS (caso não esteja)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas que possam conflitar
DROP POLICY IF EXISTS "Allow public read products" ON products;
DROP POLICY IF EXISTS "Allow anon insert products" ON products;
DROP POLICY IF EXISTS "Allow anon update products" ON products;
DROP POLICY IF EXISTS "Allow anon delete products" ON products;
DROP POLICY IF EXISTS "Allow all products" ON products;

-- SELECT: qualquer um pode ler
CREATE POLICY "Allow public read products"
  ON products FOR SELECT
  USING (true);

-- INSERT: anon e authenticated podem inserir
CREATE POLICY "Allow anon insert products"
  ON products FOR INSERT
  WITH CHECK (true);

-- UPDATE: anon e authenticated podem atualizar
CREATE POLICY "Allow anon update products"
  ON products FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DELETE: anon e authenticated podem deletar
CREATE POLICY "Allow anon delete products"
  ON products FOR DELETE
  USING (true);


-- ──────────────────────────────────────────────
-- TABELA: categories
-- ──────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read categories" ON categories;
DROP POLICY IF EXISTS "Allow anon insert categories" ON categories;
DROP POLICY IF EXISTS "Allow anon update categories" ON categories;
DROP POLICY IF EXISTS "Allow anon delete categories" ON categories;
DROP POLICY IF EXISTS "Allow all categories" ON categories;

CREATE POLICY "Allow public read categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Allow anon insert categories"
  ON categories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anon update categories"
  ON categories FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete categories"
  ON categories FOR DELETE
  USING (true);


-- ──────────────────────────────────────────────
-- TABELA: settings
-- ──────────────────────────────────────────────
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read settings" ON settings;
DROP POLICY IF EXISTS "Allow anon upsert settings" ON settings;
DROP POLICY IF EXISTS "Allow all settings" ON settings;

CREATE POLICY "Allow public read settings"
  ON settings FOR SELECT
  USING (true);

CREATE POLICY "Allow anon insert settings"
  ON settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anon update settings"
  ON settings FOR UPDATE
  USING (true)
  WITH CHECK (true);


-- ──────────────────────────────────────────────
-- TABELA: global_options (se existir)
-- ──────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'global_options') THEN
    ALTER TABLE global_options ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read global_options" ON global_options;
    DROP POLICY IF EXISTS "Allow anon write global_options" ON global_options;

    CREATE POLICY "Allow public read global_options"
      ON global_options FOR SELECT USING (true);

    CREATE POLICY "Allow anon insert global_options"
      ON global_options FOR INSERT WITH CHECK (true);

    CREATE POLICY "Allow anon update global_options"
      ON global_options FOR UPDATE USING (true) WITH CHECK (true);

    CREATE POLICY "Allow anon delete global_options"
      ON global_options FOR DELETE USING (true);
  END IF;
END $$;


-- ──────────────────────────────────────────────
-- BUCKET DE STORAGE: products
-- (Execute separadamente se necessário)
-- ──────────────────────────────────────────────
-- No painel do Supabase: Storage > products bucket
-- Certifique-se que o bucket está como "Public"
-- E adicione a policy: Allow anon upload (INSERT)

-- Se quiser fazer via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy de upload para o bucket
DROP POLICY IF EXISTS "Allow anon upload" ON storage.objects;
CREATE POLICY "Allow anon upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "Allow public read storage" ON storage.objects;
CREATE POLICY "Allow public read storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');
