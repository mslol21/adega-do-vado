import assert from 'node:assert/strict';
import { catalogQuery, catalogPages } from '../src/utils/catalogQuery.ts';

let calls = 0;
const recovered = await catalogQuery(async () => ++calls === 1
  ? { data: null, error: { code: '57014' } }
  : { data: ['product'], error: null });
assert.deepEqual(recovered.data, ['product']);
assert.equal(calls, 2);
const results = await Promise.all([
  catalogQuery(async () => ({ data: ['product'], error: null })),
  catalogQuery(async () => { throw new Error('offline'); }),
]);
assert.deepEqual(results[0].data, ['product']);
assert.ok(results[1].error);
const rows = Array.from({ length: 23 }, (_, id) => ({ id }));
assert.deepEqual((await catalogPages(async (from, to) => ({ data: rows.slice(from, to + 1), error: null }))).data, rows);
const partial = await catalogPages(async from => from === 0
  ? { data: rows.slice(0, 10), error: null }
  : { data: null, error: new Error('timeout') });
assert.equal(partial.data, null); // Never replace the catalog with a partial page.
assert.ok(partial.error);
console.log('Catalog retry, independent failures and complete pagination: passed');
