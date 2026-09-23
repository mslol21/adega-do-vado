// npm install --prefix ../adega-db-test @electric-sql/pglite@0.5.8
// node scripts/test-orders.mjs (isolated in-memory Postgres; no production credentials)
import { PGlite } from '../../adega-db-test/node_modules/@electric-sql/pglite/dist/index.js';
import { readFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth;
create function auth.uid() returns uuid language sql as 'select null::uuid';
create table profiles(id uuid primary key, user_id uuid, store_id text);
create table products(id uuid primary key default gen_random_uuid(),store_id text not null,
 name text not null,price numeric not null,stock_quantity integer,is_active boolean default true);`);
await db.exec(await readFile(new URL('supabase/migrations/002_create_orders_schema.sql', root), 'utf8'));
await db.exec(`alter table orders disable row level security; alter table order_items disable row level security;
grant usage on schema public,auth to anon,authenticated;
grant all on all tables in schema public to anon,authenticated;
grant all on all sequences in schema public to anon,authenticated;`);
await db.exec(await readFile(new URL('supabase/migrations/003_atomic_order_operations.sql', root), 'utf8'));
await db.exec(await readFile(new URL('supabase/tests/order_atomic.sql', root), 'utf8'));
console.log('PASS: address, change, totals, grouped stock, retry, edit delta, stale edit, cancellation, insufficient stock, rollback');
console.log((await db.query('select (select count(*) from orders) as orders, (select count(*) from products) as products')).rows);
await db.close();
