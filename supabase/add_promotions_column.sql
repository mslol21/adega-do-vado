-- Adiciona a coluna de preço promocional caso ainda não exista
ALTER TABLE products ADD COLUMN IF NOT EXISTS promotional_price NUMERIC(10,2);
