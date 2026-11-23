import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createNeonClient } from '@neon/neon-js/supabase';

// Neon is the only database and authentication provider.
// The exported client name is a backwards-compatible local alias, never a Supabase connection.
export const useNeon = true;
export const isOfflineMode = false;

const neonUrl = (import.meta.env.VITE_NEON_URL || '').trim();
const neonAuthUrl = (import.meta.env.VITE_NEON_AUTH_URL || import.meta.env.VITE_NEON_MIGRATION_AUTH_URL || '').trim();
if (!neonUrl || !neonAuthUrl) {
  throw new Error('Neon não configurado. Configure VITE_NEON_URL e VITE_NEON_AUTH_URL na Vercel.');
}
export const supabase: SupabaseClient = createNeonClient({
  auth: { url: neonAuthUrl, allowAnonymous: true },
  dataApi: { url: neonUrl },
}) as unknown as SupabaseClient;
