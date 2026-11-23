import { createClient as createNeonClient } from '@neon/neon-js/supabase';

// Neon é agora o provedor exclusivo de banco de dados e autenticação.
export const useNeon = true;

const neonUrl = (import.meta.env.VITE_NEON_URL || '').trim();
const neonAuthUrl = (import.meta.env.VITE_NEON_MIGRATION_AUTH_URL || import.meta.env.VITE_NEON_AUTH_URL || '').trim();

export const isOfflineMode = !neonUrl || !neonAuthUrl;

if (isOfflineMode) {
  console.warn('Neon não configurado (VITE_NEON_URL / VITE_NEON_AUTH_URL). Operando em modo offline com dados locais.');
}

const effectiveNeonUrl = isOfflineMode ? 'https://placeholder-neon.example.com' : neonUrl;
const effectiveNeonAuthUrl = isOfflineMode ? 'https://placeholder-auth.example.com' : neonAuthUrl;

export type NeonClient = ReturnType<typeof createNeonClient>;

export const supabase: NeonClient = createNeonClient({
  auth: { url: effectiveNeonAuthUrl, allowAnonymous: true },
  dataApi: { url: effectiveNeonUrl },
});
