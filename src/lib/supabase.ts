import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createClient as createNeonClient } from '@neon/neon-js/supabase';

// A feature flag keeps the live Supabase deployment unchanged during testing.
export const useNeon = import.meta.env.VITE_DATA_PROVIDER === 'neon';
const neonUrl = (import.meta.env.VITE_NEON_URL || '').trim();
const neonAuthUrl = (import.meta.env.VITE_NEON_AUTH_URL || '').trim();
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isOfflineMode = useNeon
  ? !neonUrl || !neonAuthUrl
  : !rawUrl || !rawKey || rawUrl === 'Sua_URL_do_Supabase' ||
    rawUrl === 'https://placeholder-project.supabase.co';

if (isOfflineMode) {
  console.error('Banco ou autenticação não configurados. Usando dados locais.');
}

const supabaseUrl = isOfflineMode ? 'https://placeholder-project.supabase.co' : rawUrl;
const supabaseAnonKey = isOfflineMode ? 'placeholder-key' : rawKey;

export const supabase: SupabaseClient = useNeon && !isOfflineMode
  ? createNeonClient({
      auth: { url: neonAuthUrl, allowAnonymous: true },
      dataApi: { url: neonUrl },
    }) as unknown as SupabaseClient
  : createClient(supabaseUrl, supabaseAnonKey);
