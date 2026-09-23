import assert from 'node:assert/strict';
import { getPendingOrderId, clearPendingOrderId } from '../src/utils/orderAttempt.ts';
const values = new Map();
globalThis.sessionStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: key => values.delete(key),
};
const payload = { source: 'ONLINE', customer_name: 'Teste', items: [] };
const id = getPendingOrderId('adega', payload);
assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
assert.equal(getPendingOrderId('adega', payload), id, 'Retry must use the same order ID');
assert.notEqual(getPendingOrderId('tabacaria', payload), id, 'Stores must not share an attempt');
clearPendingOrderId('adega', 'another-id');
assert.equal(getPendingOrderId('adega', payload), id, 'An unrelated response must not clear the pending attempt');
clearPendingOrderId('adega', id);
assert.notEqual(getPendingOrderId('adega', payload), id, 'A confirmed order must allow a new purchase');
values.set('vado_pending_order_adega', 'invalid json');
assert.doesNotThrow(() => getPendingOrderId('adega', payload));
console.log('PASS: stable UUID on retry, store isolation, confirmation and corrupted storage');
