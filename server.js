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
  `).then(() => {
    dbReady = true;
    console.log('☁ Cloud save: connected to Postgres.');
  }).catch(err => {
    console.error('☁ Cloud save: failed to initialise Postgres table:', err.message);
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

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  if (urlPath === '/api/save' || urlPath.startsWith('/api/save/')) {
    handleSaveApi(req, res, urlPath);
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
