// node --test   worker against an in-memory stand-in for the two tables (env.SQL, as thebooleanjulian-bot-core/db allows).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { generateSaveCode, runDailyBackupIfNeeded } from './index.js';

// Tiny fake of the postgres.js tagged template: dispatches on the SQL text, keeps rows in maps.
function fakeDb() {
  const saves = new Map();   // code -> { data, updated_at }
  const backups = new Map(); // `${date}|${code}` -> { code, data, backup_date, backed_up_at }
  const today = new Date().toISOString().slice(0, 10);
  const sql = async (strings, ...v) => {
    const q = strings.join('?').replace(/\s+/g, ' ').trim();
    const out = (rows, count = rows.length) => Object.assign(rows, { count });
    if (q.startsWith('insert into srv_3dp_tycoon.cloud_saves (code, data) values')) {
      if (saves.has(v[0])) throw Object.assign(new Error('dup'), { code: '23505' });
      saves.set(v[0], { data: v[1].value, updated_at: new Date() });
      return out([], 1);
    }
    if (q.startsWith('select data, updated_at')) return out(saves.has(v[0]) ? [saves.get(v[0])] : []);
    if (q.startsWith('update srv_3dp_tycoon.cloud_saves')) {
      if (!saves.has(v[1])) return out([], 0);
      saves.set(v[1], { data: v[0].value, updated_at: new Date() });
      return out([], 1);
    }
    if (q.startsWith('select 1 from srv_3dp_tycoon.cloud_save_backups')) return out([...backups.values()].some((b) => b.backup_date === v[0]) ? [{}] : []);
    if (q.startsWith('insert into srv_3dp_tycoon.cloud_save_backups')) {
      for (const [code, s] of saves) backups.set(`${v[0]}|${code}`, { code, data: s.data, backup_date: v[0], backed_up_at: new Date() });
      return out([], saves.size);
    }
    if (q.startsWith('delete from srv_3dp_tycoon.cloud_save_backups')) {
      for (const [k, b] of backups) if (b.backup_date < v[0]) backups.delete(k);
      return out([]);
    }
    if (q.startsWith('select data, backed_up_at from srv_3dp_tycoon.cloud_save_backups')) {
      const b = backups.get(`${v[0]}|${v[1]}`);
      return out(b ? [{ data: b.data, backed_up_at: b.backed_up_at }] : []);
    }
    if (q.startsWith('select data from srv_3dp_tycoon.cloud_save_backups')) {
      const b = backups.get(`${v[0]}|${v[1]}`);
      return out(b ? [{ data: b.data }] : []);
    }
    if (q.startsWith('insert into srv_3dp_tycoon.cloud_saves (code, data, updated_at) values')) {
      saves.set(v[0], { data: v[1].value, updated_at: new Date() });
      return out([], 1);
    }
    if (q.startsWith('select count(*)::int as count from srv_3dp_tycoon.cloud_save_backups')) {
      return out([{ count: [...backups.values()].filter((b) => b.backup_date === v[0]).length }]);
    }
    if (q === 'delete from srv_3dp_tycoon.cloud_saves') { saves.clear(); return out([]); }
    if (q.startsWith('insert into srv_3dp_tycoon.cloud_saves (code, data, updated_at) select')) {
      for (const b of backups.values()) if (b.backup_date === v[0]) saves.set(b.code, { data: b.data, updated_at: b.backed_up_at });
      return out([]);
    }
    throw new Error('unexpected query: ' + q);
  };
  sql.json = (value) => ({ value });
  sql.begin = (fn) => fn(sql);
  return { sql, saves, backups, today };
}

const assets = { fetch: async () => new Response('game') };
const call = (env, path, init) => worker.fetch(new Request('https://3dp.example' + path, init), { ASSETS: assets, ...env }, { waitUntil() {} });
const body = (o) => ({ method: 'POST', body: JSON.stringify(o) });

test('save codes use the unambiguous alphabet', () => {
  for (let i = 0; i < 50; i++) assert.match(generateSaveCode(), /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{10}$/);
});

test('without a database the save API answers 503 like server.js, and the game is still served', async () => {
  const res = await call({}, '/api/save/AAAAAAAAAA');
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: 'Cloud save is not configured on this server.' });
  assert.equal(await (await call({}, '/')).text(), 'game');
});

test('new → get → put round trip, with validation', async () => {
  const db = fakeDb();
  const env = { SQL: db.sql };
  const { code } = await (await call(env, '/api/save/new', body({ data: { money: 5 } }))).json();
  assert.match(code, /^[A-Z0-9]{10}$/);
  const got = await (await call(env, '/api/save/' + code.toLowerCase())).json();
  assert.deepEqual(got.data, { money: 5 });
  const put = await call(env, '/api/save/' + code, { method: 'PUT', body: JSON.stringify({ data: { money: 9 } }) });
  assert.deepEqual(await put.json(), { ok: true });
  assert.deepEqual(db.saves.get(code).data, { money: 9 });
  assert.equal((await call(env, '/api/save/ZZZZZZZZZZ', { method: 'PUT', body: '{"data":{}}' })).status, 404);
  assert.equal((await call(env, '/api/save/ab')).status, 400);
  assert.deepEqual(await (await call(env, '/api/save/new', body({ nope: 1 }))).json(), { error: 'Missing save data.' });
  assert.deepEqual(await (await call(env, '/api/save/new', { method: 'POST', body: '{' })).json(), { error: 'Invalid JSON' });
  assert.equal((await call(env, '/api/save/' + code, { method: 'DELETE' })).status, 405);
});

test('rate limit: 429 with the same message', async () => {
  const env = { SQL: fakeDb().sql, SAVE_LIMIT: { limit: async () => ({ success: false }) } };
  const res = await call(env, '/api/save/AAAAAAAAAA');
  assert.equal(res.status, 429);
  assert.match((await res.json()).error, /Too many requests/);
});

test('daily backup runs once per UTC day; admin can list, inspect and restore', async () => {
  const db = fakeDb();
  const env = { SQL: db.sql, ADMIN_TOKEN: 'tok' };
  const { code } = await (await call(env, '/api/save/new', body({ data: { v: 1 } }))).json();
  assert.equal(await runDailyBackupIfNeeded(db.sql, env), 1);
  assert.equal(await runDailyBackupIfNeeded(db.sql, env), null); // already done today
  await call(env, '/api/save/' + code, { method: 'PUT', body: JSON.stringify({ data: { v: 2 } }) });

  const auth = { headers: { Authorization: 'Bearer tok' } };
  const inspect = await (await call(env, `/api/admin/backups/${db.today}/${code}`, auth)).json();
  assert.deepEqual(inspect.data, { v: 1 });
  const restored = await call(env, `/api/admin/restore/${code}`, { method: 'POST', headers: auth.headers, body: JSON.stringify({ date: db.today }) });
  assert.deepEqual(await restored.json(), { ok: true, code, restoredFrom: db.today });
  assert.deepEqual(db.saves.get(code).data, { v: 1 });

  const noConfirm = await call(env, '/api/admin/restore-all', { method: 'POST', headers: auth.headers, body: JSON.stringify({ date: db.today }) });
  assert.equal(noConfirm.status, 400);
  const all = await call(env, '/api/admin/restore-all', { method: 'POST', headers: auth.headers, body: JSON.stringify({ date: db.today, confirm: 'ROLLBACK' }) });
  assert.deepEqual(await all.json(), { ok: true, restoredFrom: db.today, count: 1 });
  const missing = await call(env, '/api/admin/restore-all', { method: 'POST', headers: auth.headers, body: JSON.stringify({ date: '2000-01-01', confirm: 'ROLLBACK' }) });
  assert.equal(missing.status, 404);
});

test('admin is invisible without ADMIN_TOKEN and needs the bearer token', async () => {
  const db = fakeDb();
  assert.equal((await call({ SQL: db.sql }, '/api/admin/backups')).status, 404);
  assert.equal((await call({ SQL: db.sql, ADMIN_TOKEN: 'tok' }, '/api/admin/backups', { headers: { Authorization: 'Bearer nope' } })).status, 401);
  assert.equal((await call({ SQL: db.sql, ADMIN_TOKEN: 'tok' }, '/api/admin/backups/2026-1-1', { headers: { Authorization: 'Bearer tok' } })).status, 400);
});
