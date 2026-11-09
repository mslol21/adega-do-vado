import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createClient as createNeonClient } from '@neon/neon-js/supabase';

const useNeon = import.meta.env.VITE_DATA_PROVIDER === 'neon';
const neonUrl = (import.meta.env.VITE_NEON_URL || '').trim();
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Feature-flagged Neon client for migration preview. Production remains on
// Supabase until orders, administration, storage and authentication pass tests.
export const isOfflineMode = useNeon
  ? !neonUrl
  : !rawUrl || !rawKey || rawUrl === 'Sua_URL_do_Supabase' ||
    rawUrl === 'https://placeholder-project.supabase.co';

if (isOfflineMode) {
  console.error('Conexão do banco não configurada. Usando dados locais.');
}

const supabaseUrl = isOfflineMode ? 'https://placeholder-project.supabase.co' : rawUrl;
const supabaseAnonKey = isOfflineMode ? 'placeholder-key' : rawKey;

export const supabase: SupabaseClient = useNeon && !isOfflineMode
  ? createNeonClient(neonUrl, {
      auth: { allowAnonymous: true },
    }) as unknown as SupabaseClient
  : createClient(supabaseUrl, supabaseAnonKey);
