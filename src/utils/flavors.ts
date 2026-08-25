import type { Product } from '../types';

/**
 * Extrai e normaliza a lista de sabores/opções de um produto,
 * suportando array de strings, string separada por vírgulas/barras/ponto-e-vírgula
 * ou JSON array stringificado do banco de dados (Supabase/Postgres).
 */
export const getProductFlavors = (product?: Product | { flavors?: any } | null): string[] => {
  if (!product || !product.flavors) return [];

  const raw = product.flavors;

  // Se já for um array
  if (Array.isArray(raw)) {
    return raw
      .map(item => (typeof item === 'string' ? item.trim() : String(item).trim()))
      .filter(Boolean);
  }

  // Se for uma string
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    // Se estiver no formato JSON array stringificado: '["Menta", "Uva"]'
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map(item => (typeof item === 'string' ? item.trim() : String(item).trim()))
            .filter(Boolean);
        }
      } catch {
        // Ignora erro de JSON e continua para split por delimitadores
      }
    }

    // Suporta separação por vírgula, ponto e vírgula, barra ou quebra de linha
    return trimmed
      .split(/[,;|/\n]+/)
      .map(item => item.replace(/^[\[\]"']+|[\[\]"']+$/g, '').trim())
      .filter(Boolean);
  }

  return [];
};
