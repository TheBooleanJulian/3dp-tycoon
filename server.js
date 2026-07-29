const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// ========================
// CLOUD SAVE (optional) — backed by a Postgres database linked in Zeabur. If no DB connection
// is configured (e.g. running locally, or a plain static deployment), the /api/save/* routes
// respond 503 and the rest of the game works exactly as before; nothing here is required.
// ========================
let Pool = null;
try { Pool = require('pg').Pool; } catch (e) { /* pg not installed — cloud save just stays disabled */ }

// Zeabur injects connection details for a linked Postgres service as env vars, but the exact
// var name has varied across templates — support a full connection string first, falling back
// to discrete host/port/user/pass/db vars.
const PG_CONNECTION_STRING =
  process.env.POSTGRES_CONNECTION_STRING ||
  process.env.DATABASE_URL ||
  (process.env.POSTGRES_HOST
    ? `postgres://${process.env.POSTGRES_USERNAME}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DATABASE}`
    : null);

let pool = null;
let dbReady = false;
if (Pool && PG_CONNECTION_STRING) {
  pool = new Pool({
    connectionString: PG_CONNECTION_STRING,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  });
  pool.query(`
    CREATE TABLE IF NOT EXISTS cloud_saves (
      code TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `).then(() => pool.query(`
    CREATE TABLE IF NOT EXISTS cloud_save_backups (
      id BIGSERIAL PRIMARY KEY,
      code TEXT NOT NULL,
      data JSONB NOT NULL,
      backup_date TEXT NOT NULL,
      backed_up_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(code, backup_date)
    )
  `)).then(() => pool.query(
    `CREATE INDEX IF NOT EXISTS idx_cloud_save_backups_date ON cloud_save_backups(backup_date)`
  )).then(() => {
    dbReady = true;
    console.log('☁ Cloud save: connected to Postgres.');
    startBackupScheduler();
  }).catch(err => {
    console.error('☁ Cloud save: failed to initialise Postgres tables:', err.message);
  });
} else {
  console.log('☁ Cloud save disabled — no Postgres connection configured (set POSTGRES_CONNECTION_STRING or DATABASE_URL).');
}

// Codes are bearer secrets (whoever has one can read AND overwrite that save), so they need
// real entropy despite being short enough to type — 10 chars from a 32-symbol alphabet is ~50
// bits. The alphabet excludes visually ambiguous characters (0/O, 1/I/L) for easier transcription.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 10;
function generateSaveCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return code;
}
const CODE_RE = /^[A-Z0-9]{6,20}$/;

// Small in-memory fixed-window rate limiter, per client IP — enough to blunt casual abuse
// (brute-forcing codes, hammering the DB) without needing an external dependency.
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX = 30;
const rateLimitMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) rateLimitMap.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS * 2).unref();

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

const MAX_SAVE_BYTES = 1024 * 1024; // 1MB — generous headroom over a typical save's JSON size
function readJsonBody(req, cb) {
  let data = '';
  let size = 0;
  let rejected = false;
  req.on('data', chunk => {
    if (rejected) return;
    size += chunk.length;
    if (size > MAX_SAVE_BYTES) { rejected = true; cb(new Error('Payload too large')); req.destroy(); return; }
    data += chunk;
  });
  req.on('end', () => {
    if (rejected) return;
    try { cb(null, JSON.parse(data)); } catch (e) { cb(new Error('Invalid JSON')); }
  });
  req.on('error', err => { if (!rejected) cb(err); });
}

async function handleSaveApi(req, res, urlPath) {
  if (!pool || !dbReady) { sendJson(res, 503, { error: 'Cloud save is not configured on this server.' }); return; }

  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) { sendJson(res, 429, { error: 'Too many requests — slow down and try again in a minute.' }); return; }

  const parts = urlPath.split('/').filter(Boolean); // ['api', 'save', ...]

  // POST /api/save/new — upload the current game state, get back a fresh code
  if (req.method === 'POST' && parts[2] === 'new') {
    readJsonBody(req, async (err, payload) => {
      if (err) { sendJson(res, 400, { error: err.message }); return; }
      if (!payload || typeof payload.data !== 'object' || payload.data === null) { sendJson(res, 400, { error: 'Missing save data.' }); return; }
      const dataStr = JSON.stringify(payload.data);
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateSaveCode();
        try {
          await pool.query('INSERT INTO cloud_saves (code, data) VALUES ($1, $2::jsonb)', [code, dataStr]);
          sendJson(res, 200, { code });
          return;
        } catch (e) {
          if (e.code === '23505') continue; // unique_violation on the code — vanishingly rare, just retry
          console.error('Cloud save insert failed:', e.message);
          sendJson(res, 500, { error: 'Server error.' });
          return;
        }
      }
      sendJson(res, 500, { error: 'Could not allocate a save code — try again.' });
    });
    return;
  }

  const code = (parts[2] || '').toUpperCase();
  if (!CODE_RE.test(code)) { sendJson(res, 400, { error: 'Invalid save code.' }); return; }

  // GET /api/save/:code — fetch a save
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT data, updated_at FROM cloud_saves WHERE code = $1', [code]);
      if (!result.rows.length) { sendJson(res, 404, { error: 'No cloud save found for that code.' }); return; }
      sendJson(res, 200, { data: result.rows[0].data, updatedAt: result.rows[0].updated_at });
    } catch (e) {
      console.error('Cloud save fetch failed:', e.message);
      sendJson(res, 500, { error: 'Server error.' });
    }
    return;
  }

  // PUT /api/save/:code — overwrite an existing save (used for auto-sync)
  if (req.method === 'PUT') {
    readJsonBody(req, async (err, payload) => {
      if (err) { sendJson(res, 400, { error: err.message }); return; }
      if (!payload || typeof payload.data !== 'object' || payload.data === null) { sendJson(res, 400, { error: 'Missing save data.' }); return; }
      const dataStr = JSON.stringify(payload.data);
      try {
        const result = await pool.query('UPDATE cloud_saves SET data = $2::jsonb, updated_at = now() WHERE code = $1', [code, dataStr]);
        if (result.rowCount === 0) { sendJson(res, 404, { error: 'No cloud save found for that code.' }); return; }
        sendJson(res, 200, { ok: true });
      } catch (e) {
        console.error('Cloud save update failed:', e.message);
        sendJson(res, 500, { error: 'Server error.' });
      }
    });
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed.' });
}

// ========================
// DAILY BACKUPS — a snapshot of every cloud save is taken once per calendar day (UTC) into
// cloud_save_backups, keyed by (code, backup_date) so re-running the check on the same day is
// a no-op rather than a duplicate. This runs from inside the same Node process (no external
// cron needed) via an hourly poll that's idempotent on the date, so it self-heals across
// restarts/redeploys instead of relying on the process staying up for a full 24h stretch.
// ========================
const BACKUP_RETENTION_DAYS = Math.max(1, Number(process.env.BACKUP_RETENTION_DAYS) || 30);
const BACKUP_POLL_MS = 60 * 60 * 1000; // hourly; the backup itself only actually runs once/day

// "Today" is computed here in JS as a fixed UTC calendar-day string (backup_date is a plain TEXT
// column, not a SQL DATE) rather than relying on Postgres' CURRENT_DATE — that keeps day
// boundaries independent of the server/session timezone, and comparisons are simple lexical
// string comparisons since YYYY-MM-DD sorts identically as text or as a real date.
function todayUTC() { return new Date().toISOString().slice(0, 10); }
function daysAgoUTC(days) { return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10); }

async function runDailyBackupIfNeeded() {
  if (!pool || !dbReady) return;
  try {
    const today = todayUTC();
    const already = await pool.query(`SELECT 1 FROM cloud_save_backups WHERE backup_date = $1 LIMIT 1`, [today]);
    if (already.rows.length) return; // already snapshotted today
    await takeBackupNow();
  } catch (e) {
    console.error('☁ Daily backup check failed:', e.message);
  }
}

// Snapshots every current cloud save into today's backup row (upsert, so calling this more than
// once on the same day just refreshes today's snapshot rather than erroring or duplicating).
async function takeBackupNow() {
  const today = todayUTC();
  const result = await pool.query(`
    INSERT INTO cloud_save_backups (code, data, backup_date)
    SELECT code, data, $1 FROM cloud_saves
    ON CONFLICT (code, backup_date) DO UPDATE SET data = EXCLUDED.data, backed_up_at = now()
  `, [today]);
  console.log(`☁ Cloud save backup: snapshotted ${result.rowCount} save(s) for ${today}`);
  await pruneOldBackups();
  return result.rowCount;
}

async function pruneOldBackups() {
  const cutoff = daysAgoUTC(BACKUP_RETENTION_DAYS);
  const result = await pool.query(`DELETE FROM cloud_save_backups WHERE backup_date < $1`, [cutoff]);
  if (result.rowCount) console.log(`☁ Pruned ${result.rowCount} backup row(s) older than ${BACKUP_RETENTION_DAYS} days`);
}

function startBackupScheduler() {
  runDailyBackupIfNeeded(); // catch up immediately on boot if today's snapshot is missing
  setInterval(runDailyBackupIfNeeded, BACKUP_POLL_MS).unref();
}

// ========================
// ADMIN API — dev-only rollback tooling, gated behind a bearer token (ADMIN_TOKEN env var).
// Entirely disabled (every route 404s) if that env var isn't set, so there's no accidental
// exposure on a deployment where nobody configured it.
// ========================
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || null;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function checkAdminAuth(req) {
  if (!ADMIN_TOKEN) return false;
  const auth = req.headers['authorization'] || '';
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  return !!match && match[1] === ADMIN_TOKEN;
}

async function handleAdminApi(req, res, urlPath) {
  if (!ADMIN_TOKEN) { sendJson(res, 404, { error: 'Not found.' }); return; }
  if (!checkAdminAuth(req)) { sendJson(res, 401, { error: 'Unauthorized.' }); return; }
  if (!pool || !dbReady) { sendJson(res, 503, { error: 'Cloud save is not configured on this server.' }); return; }

  const parts = urlPath.split('/').filter(Boolean); // ['api', 'admin', ...]

  // POST /api/admin/backup-now — force an immediate snapshot (in addition to the daily one)
  if (req.method === 'POST' && parts[2] === 'backup-now') {
    try {
      const count = await takeBackupNow();
      sendJson(res, 200, { ok: true, snapshotted: count });
    } catch (e) {
      console.error('Manual backup failed:', e.message);
      sendJson(res, 500, { error: 'Server error.' });
    }
    return;
  }

  // GET /api/admin/backups — list every available backup date with its row count
  if (req.method === 'GET' && parts[2] === 'backups' && !parts[3]) {
    try {
      const result = await pool.query(
        `SELECT backup_date, COUNT(*)::int AS count, MAX(backed_up_at) AS last_backed_up_at
         FROM cloud_save_backups GROUP BY backup_date ORDER BY backup_date DESC`
      );
      sendJson(res, 200, { backups: result.rows });
    } catch (e) {
      console.error('List backups failed:', e.message);
      sendJson(res, 500, { error: 'Server error.' });
    }
    return;
  }

  // GET /api/admin/backups/:date — list every code backed up on that date (no save data, just
  // an index so the dev can find the code they're after before pulling the full save)
  if (req.method === 'GET' && parts[2] === 'backups' && parts[3] && !parts[4]) {
    const date = parts[3];
    if (!DATE_RE.test(date)) { sendJson(res, 400, { error: 'Invalid date — use YYYY-MM-DD.' }); return; }
    try {
      const result = await pool.query(
        `SELECT code, backed_up_at FROM cloud_save_backups WHERE backup_date = $1 ORDER BY code`,
        [date]
      );
      sendJson(res, 200, { date, saves: result.rows });
    } catch (e) {
      console.error('List backup date failed:', e.message);
      sendJson(res, 500, { error: 'Server error.' });
    }
    return;
  }

  // GET /api/admin/backups/:date/:code — inspect one save's backed-up data before restoring it
  if (req.method === 'GET' && parts[2] === 'backups' && parts[3] && parts[4]) {
    const date = parts[3];
    const code = parts[4].toUpperCase();
    if (!DATE_RE.test(date)) { sendJson(res, 400, { error: 'Invalid date — use YYYY-MM-DD.' }); return; }
    if (!CODE_RE.test(code)) { sendJson(res, 400, { error: 'Invalid save code.' }); return; }
    try {
      const result = await pool.query(
        `SELECT data, backed_up_at FROM cloud_save_backups WHERE backup_date = $1 AND code = $2`,
        [date, code]
      );
      if (!result.rows.length) { sendJson(res, 404, { error: 'No backup found for that date/code.' }); return; }
      sendJson(res, 200, { date, code, data: result.rows[0].data, backedUpAt: result.rows[0].backed_up_at });
    } catch (e) {
      console.error('Inspect backup failed:', e.message);
      sendJson(res, 500, { error: 'Server error.' });
    }
    return;
  }

  // POST /api/admin/restore/:code — roll a single save back to a specific backup date.
  // Body: { "date": "YYYY-MM-DD" }
  if (req.method === 'POST' && parts[2] === 'restore' && parts[3]) {
    const code = parts[3].toUpperCase();
    if (!CODE_RE.test(code)) { sendJson(res, 400, { error: 'Invalid save code.' }); return; }
    readJsonBody(req, async (err, payload) => {
      if (err) { sendJson(res, 400, { error: err.message }); return; }
      const date = payload && payload.date;
      if (!DATE_RE.test(date || '')) { sendJson(res, 400, { error: 'Body must include "date" as YYYY-MM-DD.' }); return; }
      try {
        const backup = await pool.query(
          `SELECT data FROM cloud_save_backups WHERE backup_date = $1 AND code = $2`,
          [date, code]
        );
        if (!backup.rows.length) { sendJson(res, 404, { error: 'No backup found for that date/code.' }); return; }
        await pool.query(
          `INSERT INTO cloud_saves (code, data, updated_at) VALUES ($1, $2::jsonb, now())
           ON CONFLICT (code) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
          [code, JSON.stringify(backup.rows[0].data)]
        );
        console.log(`☁ Admin restore: ${code} rolled back to ${date}`);
        sendJson(res, 200, { ok: true, code, restoredFrom: date });
      } catch (e) {
        console.error('Restore failed:', e.message);
        sendJson(res, 500, { error: 'Server error.' });
      }
    });
    return;
  }

  // POST /api/admin/restore-all — roll EVERY cloud save back to a specific backup date. This
  // replaces the live table wholesale, so it requires an explicit confirm string, not just a
  // date, to guard against firing it by accident.
  // Body: { "date": "YYYY-MM-DD", "confirm": "ROLLBACK" }
  if (req.method === 'POST' && parts[2] === 'restore-all') {
    readJsonBody(req, async (err, payload) => {
      if (err) { sendJson(res, 400, { error: err.message }); return; }
      const date = payload && payload.date;
      if (!DATE_RE.test(date || '')) { sendJson(res, 400, { error: 'Body must include "date" as YYYY-MM-DD.' }); return; }
      if (!payload || payload.confirm !== 'ROLLBACK') {
        sendJson(res, 400, { error: 'Body must include "confirm": "ROLLBACK" to roll back every save.' });
        return;
      }
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const check = await client.query(`SELECT COUNT(*)::int AS count FROM cloud_save_backups WHERE backup_date = $1`, [date]);
        if (!check.rows[0].count) { await client.query('ROLLBACK'); sendJson(res, 404, { error: 'No backup exists for that date.' }); return; }
        await client.query('DELETE FROM cloud_saves');
        await client.query(
          `INSERT INTO cloud_saves (code, data, updated_at)
           SELECT code, data, backed_up_at FROM cloud_save_backups WHERE backup_date = $1`,
          [date]
        );
        await client.query('COMMIT');
        console.log(`☁ Admin restore-all: entire cloud_saves table rolled back to ${date} (${check.rows[0].count} save(s))`);
        sendJson(res, 200, { ok: true, restoredFrom: date, count: check.rows[0].count });
      } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Restore-all failed:', e.message);
        sendJson(res, 500, { error: 'Server error.' });
      } finally {
        client.release();
      }
    });
    return;
  }

  sendJson(res, 404, { error: 'Unknown admin route.' });
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  if (urlPath === '/api/save' || urlPath.startsWith('/api/save/')) {
    handleSaveApi(req, res, urlPath);
    return;
  }

  if (urlPath === '/api/admin' || urlPath.startsWith('/api/admin/')) {
    handleAdminApi(req, res, urlPath);
    return;
  }

  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(__dirname, safePath === '/' ? 'index.html' : safePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(__dirname, 'index.html'), (fallbackErr, fallbackData) => {
        if (fallbackErr) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fallbackData);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`3DP Tycoon running on port ${PORT}`);
});
