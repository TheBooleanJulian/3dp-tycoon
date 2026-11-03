// 3DP Tycoon on Cloudflare Workers — port of server.js (static files + optional cloud save on Postgres).
//
//   /api/save/new  POST · /api/save/:code  GET, PUT        cloud saves (rate limited per IP, 30/min)
//   /api/admin/...                                          dev-only rollback tooling (ADMIN_TOKEN; 404 if unset)
//   everything else                                         the game (static assets, index.html fallback)
//   cron, hourly                                            daily backup of every save (idempotent per UTC day)
//
// Data: schema srv_3dp_tycoon in the shared Supabase project (thebooleanjulian-db) via the Hyperdrive binding. Without
// the binding, the save routes answer 503 "not configured" and the game works offline, exactly like server.js
// without a database.
import { withDb } from 'thebooleanjulian-bot-core/db';

// Codes are bearer secrets (whoever has one can read AND overwrite that save): 10 chars from a 31-symbol alphabet
// (no 0/O, 1/I/L), ~50 bits.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 10;
const CODE_RE = /^[A-Z0-9]{6,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SAVE_BYTES = 1024 * 1024;

export function generateSaveCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return code;
}

const todayUTC = () => new Date().toISOString().slice(0, 10);
const daysAgoUTC = (days) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
const retentionDays = (env) => Math.max(1, Number(env.BACKUP_RETENTION_DAYS) || 30);

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

const hasDb = (env) => Boolean(env.SQL || env.HYPERDRIVE);

async function readSave(request) {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_SAVE_BYTES) throw new HttpError(400, 'Payload too large');
  let payload;
  try { payload = JSON.parse(text); } catch { throw new HttpError(400, 'Invalid JSON'); }
  if (!payload || typeof payload.data !== 'object' || payload.data === null) throw new HttpError(400, 'Missing save data.');
  return payload;
}

// ── cloud save ──────────────────────────────────────────────────────────────
async function saveApi(request, env, ctx, parts) {
  if (!hasDb(env)) throw new HttpError(503, 'Cloud save is not configured on this server.');
  if (env.SAVE_LIMIT) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!(await env.SAVE_LIMIT.limit({ key: ip })).success) throw new HttpError(429, 'Too many requests — slow down and try again in a minute.');
  }

  if (request.method === 'POST' && parts[2] === 'new') {
    const { data } = await readSave(request);
    return withDb(env, ctx, async (sql) => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateSaveCode();
        try {
          await sql`insert into srv_3dp_tycoon.cloud_saves (code, data) values (${code}, ${sql.json(data)})`;
          return { code };
        } catch (e) {
          if (e.code === '23505') continue; // unique_violation on the code — vanishingly rare, just retry
          throw e;
        }
      }
      throw new HttpError(500, 'Could not allocate a save code — try again.');
    });
  }

  const code = (parts[2] || '').toUpperCase();
  if (!CODE_RE.test(code)) throw new HttpError(400, 'Invalid save code.');

  if (request.method === 'GET') {
    const rows = await withDb(env, ctx, (sql) => sql`select data, updated_at from srv_3dp_tycoon.cloud_saves where code = ${code}`);
    if (!rows.length) throw new HttpError(404, 'No cloud save found for that code.');
    return { data: rows[0].data, updatedAt: rows[0].updated_at };
  }

  if (request.method === 'PUT') {
    const { data } = await readSave(request);
    const result = await withDb(env, ctx, (sql) =>
      sql`update srv_3dp_tycoon.cloud_saves set data = ${sql.json(data)}, updated_at = now() where code = ${code}`);
    if (result.count === 0) throw new HttpError(404, 'No cloud save found for that code.');
    return { ok: true };
  }

  throw new HttpError(405, 'Method not allowed.');
}

// ── backups ─────────────────────────────────────────────────────────────────
// Snapshots every current save into today's backup row (upsert: a second run the same day refreshes it).
export async function takeBackupNow(sql, env) {
  const today = todayUTC();
  const result = await sql`
    insert into srv_3dp_tycoon.cloud_save_backups (code, data, backup_date)
    select code, data, ${today} from srv_3dp_tycoon.cloud_saves
    on conflict (code, backup_date) do update set data = excluded.data, backed_up_at = now()`;
  await sql`delete from srv_3dp_tycoon.cloud_save_backups where backup_date < ${daysAgoUTC(retentionDays(env))}`;
  console.log(`☁ Cloud save backup: snapshotted ${result.count} save(s) for ${today}`);
  return result.count;
}

export async function runDailyBackupIfNeeded(sql, env) {
  const already = await sql`select 1 from srv_3dp_tycoon.cloud_save_backups where backup_date = ${todayUTC()} limit 1`;
  if (already.length) return null;
  return takeBackupNow(sql, env);
}

// ── admin (dev-only rollback) ───────────────────────────────────────────────
async function adminApi(request, env, ctx, parts) {
  if (!env.ADMIN_TOKEN) throw new HttpError(404, 'Not found.');
  const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('Authorization') || '');
  if (!m || m[1] !== env.ADMIN_TOKEN) throw new HttpError(401, 'Unauthorized.');
  if (!hasDb(env)) throw new HttpError(503, 'Cloud save is not configured on this server.');

  if (request.method === 'POST' && parts[2] === 'backup-now') {
    return { ok: true, snapshotted: await withDb(env, ctx, (sql) => takeBackupNow(sql, env)) };
  }

  if (request.method === 'GET' && parts[2] === 'backups' && !parts[3]) {
    const rows = await withDb(env, ctx, (sql) => sql`
      select backup_date, count(*)::int as count, max(backed_up_at) as last_backed_up_at
      from srv_3dp_tycoon.cloud_save_backups group by backup_date order by backup_date desc`);
    return { backups: rows };
  }

  if (request.method === 'GET' && parts[2] === 'backups' && parts[3] && !parts[4]) {
    const date = parts[3];
    if (!DATE_RE.test(date)) throw new HttpError(400, 'Invalid date — use YYYY-MM-DD.');
    const rows = await withDb(env, ctx, (sql) =>
      sql`select code, backed_up_at from srv_3dp_tycoon.cloud_save_backups where backup_date = ${date} order by code`);
    return { date, saves: rows };
  }

  if (request.method === 'GET' && parts[2] === 'backups' && parts[3] && parts[4]) {
    const date = parts[3];
    const code = parts[4].toUpperCase();
    if (!DATE_RE.test(date)) throw new HttpError(400, 'Invalid date — use YYYY-MM-DD.');
    if (!CODE_RE.test(code)) throw new HttpError(400, 'Invalid save code.');
    const rows = await withDb(env, ctx, (sql) =>
      sql`select data, backed_up_at from srv_3dp_tycoon.cloud_save_backups where backup_date = ${date} and code = ${code}`);
    if (!rows.length) throw new HttpError(404, 'No backup found for that date/code.');
    return { date, code, data: rows[0].data, backedUpAt: rows[0].backed_up_at };
  }

  // POST /api/admin/restore/:code  { "date": "YYYY-MM-DD" } — roll one save back to a backup.
  if (request.method === 'POST' && parts[2] === 'restore' && parts[3]) {
    const code = parts[3].toUpperCase();
    if (!CODE_RE.test(code)) throw new HttpError(400, 'Invalid save code.');
    const payload = await request.json().catch(() => null);
    const date = payload && payload.date;
    if (!DATE_RE.test(date || '')) throw new HttpError(400, 'Body must include "date" as YYYY-MM-DD.');
    return withDb(env, ctx, async (sql) => {
      const backup = await sql`select data from srv_3dp_tycoon.cloud_save_backups where backup_date = ${date} and code = ${code}`;
      if (!backup.length) throw new HttpError(404, 'No backup found for that date/code.');
      await sql`
        insert into srv_3dp_tycoon.cloud_saves (code, data, updated_at) values (${code}, ${sql.json(backup[0].data)}, now())
        on conflict (code) do update set data = excluded.data, updated_at = now()`;
      console.log(`☁ Admin restore: ${code} rolled back to ${date}`);
      return { ok: true, code, restoredFrom: date };
    });
  }

  // POST /api/admin/restore-all  { "date": "YYYY-MM-DD", "confirm": "ROLLBACK" } — replaces every save, in one transaction.
  if (request.method === 'POST' && parts[2] === 'restore-all') {
    const payload = await request.json().catch(() => null);
    const date = payload && payload.date;
    if (!DATE_RE.test(date || '')) throw new HttpError(400, 'Body must include "date" as YYYY-MM-DD.');
    if (!payload || payload.confirm !== 'ROLLBACK') throw new HttpError(400, 'Body must include "confirm": "ROLLBACK" to roll back every save.');
    return withDb(env, ctx, (sql) => sql.begin(async (tx) => {
      const [{ count }] = await tx`select count(*)::int as count from srv_3dp_tycoon.cloud_save_backups where backup_date = ${date}`;
      if (!count) throw new HttpError(404, 'No backup exists for that date.');
      await tx`delete from srv_3dp_tycoon.cloud_saves`;
      await tx`
        insert into srv_3dp_tycoon.cloud_saves (code, data, updated_at)
        select code, data, backed_up_at from srv_3dp_tycoon.cloud_save_backups where backup_date = ${date}`;
      console.log(`☁ Admin restore-all: cloud_saves rolled back to ${date} (${count} save(s))`);
      return { ok: true, restoredFrom: date, count };
    }));
  }

  throw new HttpError(404, 'Unknown admin route.');
}

export default {
  async fetch(request, env, ctx) {
    const urlPath = decodeURIComponent(new URL(request.url).pathname);
    const isSave = urlPath === '/api/save' || urlPath.startsWith('/api/save/');
    const isAdmin = urlPath === '/api/admin' || urlPath.startsWith('/api/admin/');
    if (!isSave && !isAdmin) return env.ASSETS.fetch(request);

    const parts = urlPath.split('/').filter(Boolean);
    try {
      return json(await (isSave ? saveApi : adminApi)(request, env, ctx, parts));
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error('Cloud save request failed:', err.message);
      return json({ error: 'Server error.' }, 500);
    }
  },

  // Hourly; only the first run of each UTC day takes a snapshot (same idempotent check as server.js).
  async scheduled(_event, env, ctx) {
    if (!hasDb(env)) return;
    await withDb(env, ctx, (sql) => runDailyBackupIfNeeded(sql, env));
  }
};
