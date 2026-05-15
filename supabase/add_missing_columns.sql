-- Adiciona colunas que podem estar faltando na tabela de produtos
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS wholesale_min_quantity INTEGER,
ADD COLUMN IF NOT EXISTS name_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS has_name_option BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS customization_lists JSONB DEFAULT '[]'::jsonb;
