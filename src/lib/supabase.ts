import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Consider offline if missing or if user just pasted the literal placeholder text
export const isOfflineMode = !rawUrl || !rawKey || rawUrl === 'Sua_URL_do_Supabase' || rawUrl === 'https://placeholder-project.supabase.co';

const supabaseUrl = isOfflineMode ? 'https://placeholder-project.supabase.co' : rawUrl;
const supabaseAnonKey = isOfflineMode ? 'placeholder-key' : rawKey;

if (isOfflineMode) {
  console.error('⚠️ ATENÇÃO: Chaves do Supabase inválidas ou não encontradas no .env. A aplicação está rodando com dados de demonstração (locais).');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
