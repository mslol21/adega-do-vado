import type { OrderInput } from '../types';

const attempts = new Map<string, { id: string; fingerprint: string }>();

export function getPendingOrderId(storeId: string, payload: OrderInput): string {
  const key = `vado_pending_order_${storeId}`;
  const fingerprint = JSON.stringify(payload);
  let previous = attempts.get(storeId);
  try {
    previous = JSON.parse(sessionStorage.getItem(key) || 'null') ?? previous;
  } catch { /* Memory fallback when sessionStorage is unavailable. */ }
  if (previous?.fingerprint === fingerprint) return previous.id;
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  const id = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  const next = { id, fingerprint };
  attempts.set(storeId, next);
  try { sessionStorage.setItem(key, JSON.stringify(next)); } catch { /* Memory fallback. */ }
  return id;
}

export function clearPendingOrderId(storeId: string, id: string) {
  if (attempts.get(storeId)?.id === id) attempts.delete(storeId);
  try {
    const key = `vado_pending_order_${storeId}`;
    if (JSON.parse(sessionStorage.getItem(key) || 'null')?.id === id) sessionStorage.removeItem(key);
  } catch { /* Nothing to clear when storage is unavailable. */ }
}
