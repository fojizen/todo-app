const express = require('express');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = '7d';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET env var is required');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

if (!process.env.ADMIN_PASSWORD) {
  console.error('FATAL: ADMIN_PASSWORD env var is required');
  process.exit(1);
}
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://fojizen-todo-app.onrender.com';
const isProd = process.env.NODE_ENV === 'production';

// ── PostgreSQL ──────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : false
});

async function getOne(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows[0] || null;
}

async function getAll(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function run(sql, params = []) {
  const result = await pool.query(sql, params);
  return { changes: result.rowCount, rows: result.rows };
}

function normalizeTask(t) {
  if (!t) return t;
  try { t.tags = t.tags ? (typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags) : []; } catch { t.tags = []; }
  try { t.subtasks = t.subtasks ? (typeof t.subtasks === 'string' ? JSON.parse(t.subtasks) : t.subtasks) : []; } catch { t.subtasks = []; }
  t.done = !!t.done;
  t.starred = !!t.starred;
  t.completedOnce = !!t.completedonce;
  t.dueDate = t.duedate || null;
  t.createdAt = t.createdat || t.createdAt;
  t.updatedAt = t.updatedat || t.updatedAt;
  t.itemOrder = t.itemorder || t.itemOrder;
  delete t.duedate; delete t.createdat; delete t.updatedat; delete t.itemorder; delete t.userid; delete t.completedonce;
  return t;
}

// ── Middleware ───────────────────────────────────────────
app.set('trust proxy', 1);

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  res.setHeader('Content-Security-Policy',
    "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data:; " +
    "script-src 'self'"
  );
  next();
});

// API cache busting
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); res.set('Pragma', 'no-cache'); res.set('Expires', '0'); next(); });

// Static files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/app.js', (req, res) => res.sendFile(path.join(__dirname, 'app.js')));
app.get('/styles.css', (req, res) => res.sendFile(path.join(__dirname, 'styles.css')));
app.get('/favicon.svg', (req, res) => res.sendFile(path.join(__dirname, 'favicon.svg')));
app.get('/favicon.ico', (req, res) => res.sendFile(path.join(__dirname, 'favicon.ico')));
app.get('/apple-touch-icon.png', (req, res) => res.sendFile(path.join(__dirname, 'apple-touch-icon.png')));
app.get('/icon-192.png', (req, res) => res.sendFile(path.join(__dirname, 'icon-192.png')));
app.get('/icon-512.png', (req, res) => res.sendFile(path.join(__dirname, 'icon-512.png')));
app.get('/manifest.json', (req, res) => res.sendFile(path.join(__dirname, 'manifest.json')));
app.get('/sw.js', (req, res) => { res.set('Cache-Control', 'no-cache'); res.sendFile(path.join(__dirname, 'sw.js')); });
app.get('/og-image.svg', (req, res) => res.sendFile(path.join(__dirname, 'og-image.svg')));
app.get('/sitemap.xml', (req, res) => { res.setHeader('Content-Type', 'application/xml'); res.sendFile(path.join(__dirname, 'sitemap.xml')); });
app.get('/robots.txt', (req, res) => { res.setHeader('Content-Type', 'text/plain'); res.send('User-agent: *\nAllow: /\nSitemap: https://fojizen-todo-app.onrender.com/sitemap.xml'); });

app.get('/api/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// ── Rate Limiting ───────────────────────────────────────
const rateBuckets = new Map();
function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const bucket = rateBuckets.get(key) || { count: 0, reset: now + windowMs };
  if (now > bucket.reset) { bucket.count = 0; bucket.reset = now + windowMs; }
  bucket.count++;
  rateBuckets.set(key, bucket);
  return bucket.count > limit;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of rateBuckets) { if (now > v.reset) rateBuckets.delete(k); } }, 60000);

const loginAttempts = new Map();
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function checkBruteForce(ip) {
  const info = loginAttempts.get(ip);
  if (!info) return false;
  if (Date.now() > info.lockUntil) { loginAttempts.delete(ip); return false; }
  return true;
}
function recordFailedLogin(ip) {
  const info = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
  info.count++;
  if (info.count >= MAX_ATTEMPTS) info.lockUntil = Date.now() + LOCKOUT_MS;
  loginAttempts.set(ip, info);
}
function clearLoginAttempts(ip) { loginAttempts.delete(ip); }

// ── Token helpers ───────────────────────────────────────
function setTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
}

function getTokenFromRequest(req) {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  const h = req.headers.authorization;
  if (h && h.startsWith('Bearer ')) return h.slice(7);
  return null;
}

// ── Auth Middleware ──────────────────────────────────────
async function auth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: 'Token gerekli' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getOne('SELECT id, username, role, banned FROM users WHERE id = $1', [decoded.userId]);
    if (!user) return res.status(401).json({ error: 'Kullanici bulunamadi' });
    if (user.banned) return res.status(403).json({ error: 'Hesabiniz banlandi' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Gecersiz token' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin gerekli' });
  next();
}

// ── Email Verification ─────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function sendVerificationEmail(email, token, lang) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping verification email');
    return false;
  }
  const verifyUrl = FRONTEND_URL + '/api/verify-email/' + token;
  var isTr = lang === 'tr';
  var title = isTr ? 'E-postani Dogrula' : 'Verify Your Email';
  var desc = isTr ? 'Hesabini aktif etmek icin asagidaki butona tikla.' : 'Click the button below to activate your account.';
  var btn = isTr ? 'E-postami Dogrula' : 'Verify My Email';
  var note = isTr ? 'Bu e-postayi sen talep etmediysen, gonemseme.' : 'If you didn\'t request this, ignore this email.';
  var subject = 'fojizen | TodoApp - ' + title;
  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif">' +
    '<div style="max-width:480px;margin:0 auto;padding:40px 24px">' +
    '<div style="text-align:center;margin-bottom:24px">' +
      '<div style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:#7c5cff;border-radius:10px">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>' +
        '<span style="color:#fff;font-weight:700;font-size:16px">fojizen | TodoApp</span>' +
      '</div>' +
    '</div>' +
    '<div style="background:#fff;border-radius:16px;padding:40px 32px;text-align:center;border:1px solid #e5e7eb">' +
      '<h1 style="font-size:22px;font-weight:700;color:#1a1a2e;margin:0 0 12px">' + title + '</h1>' +
      '<p style="color:#6b7280;font-size:15px;margin:0 0 28px;line-height:1.6">' + desc + '</p>' +
      '<a href="' + verifyUrl + '" style="display:inline-block;padding:14px 36px;background:#7c5cff;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px">' + btn + '</a>' +
      '<p style="color:#9ca3af;font-size:13px;margin:28px 0 0">' + note + '</p>' +
    '</div>' +
    '<p style="text-align:center;color:#d1d5db;font-size:11px;margin-top:24px">&copy; 2026 fojizen</p>' +
    '</div>' +
    '<style>@media(prefers-color-scheme:dark){body{background:#0f0f14!important}div[style*="background:#fff"]{background:#1a1a2e!important;border-color:#2d2d44!important}h1[style*="color:#1a1a2e"]{color:#e5e7eb!important}p[style*="color:#6b7280"]{color:#9ca3af!important}p[style*="color:#9ca3af"]{color:#6b7280!important}}</style>' +
    '</body></html>';
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'fojizen | TodoApp <onboarding@resend.dev>', to: email, subject: subject, html })
    });
    if (!resp.ok) {
      const err = await resp.text();
      console.error('Resend error:', err);
      return false;
    }
    console.log('Verification email sent via Resend');
    return true;
  } catch (e) {
    console.error('Email send failed:', e.message);
    return false;
  }
}

app.get('/api/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).send('<h2> Gecersiz link</h2>');
    const user = await getOne('SELECT id FROM users WHERE verificationtoken = $1', [token]);
    if (!user) return res.status(400).send('<h2>Gecersiz veya kullanilmis dogrulama linki</h2>');
    await run('UPDATE users SET verified = true, verificationtoken = NULL WHERE id = $1', [user.id]);
    res.send('<div style="font-family:system-ui,sans-serif;text-align:center;padding:60px 20px">' +
      '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>' +
      '<h2 style="color:#1a1a2e">E-posta Dogrulandi!</h2>' +
      '<p style="color:#6b7280">Simdi <a href="' + FRONTEND_URL + '">giris yapabilirsin</a>.</p></div>');
  } catch (e) {
    console.error('Verify error:', e.stack);
    res.status(500).send('<h2>Sunucu hatasi</h2>');
  }
});

app.post('/api/resend-verification', async (req, res) => {
  try {
    const { username, lang } = req.body || {};
    if (!username) return res.status(400).json({ error: 'Kullanici adi gerekli' });
    if (rateLimit('resend:' + req.ip, 3, 60000)) return res.status(429).json({ error: 'Cok fazla istek. 1 dk bekleyin.' });

    const user = await getOne('SELECT id, email, verified, verificationtoken FROM users WHERE username = $1', [username.trim().toLowerCase()]);
    if (!user) return res.status(404).json({ error: 'Kullanici bulunamadi' });
    if (user.verified) return res.status(400).json({ error: 'E-posta zaten dogrulanmis' });

    const newToken = crypto.randomBytes(32).toString('hex');
    await run('UPDATE users SET verificationtoken = $1 WHERE id = $2', [newToken, user.id]);
    const sent = await sendVerificationEmail(user.email, newToken, lang);
    if (!sent) return res.status(500).json({ error: 'E-posta gonderilemedi' });
    res.json({ ok: true });
  } catch (e) {
    console.error('Resend verification error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

// ── Auth Routes ─────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Kullanici adi ve sifre gerekli' });

    const ip = req.ip;
    if (checkBruteForce(ip)) return res.status(429).json({ error: 'Cok fazla deneme. 15 dakika bekleyin.' });
    if (rateLimit('login:' + ip, 20, 60000)) return res.status(429).json({ error: 'Cok fazla istek' });

    const user = await getOne('SELECT * FROM users WHERE username = $1', [username.trim().toLowerCase()]);
    if (!user) { recordFailedLogin(ip); return res.status(401).json({ error: 'Gecersiz giris bilgileri' }); }

    const valid = await bcrypt.compare(password, user.passwordhash);
    if (!valid) { recordFailedLogin(ip); return res.status(401).json({ error: 'Gecersiz giris bilgileri' }); }

    if (!user.verified) {
      return res.status(403).json({ error: 'E-posta dogrulanmamis', emailNotVerified: true });
    }

    clearLoginAttempts(ip);
    await run('UPDATE users SET lastlogin = NOW()::text WHERE id = $1', [user.id]);
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    setTokenCookie(res, token);
    res.json({ token, username: user.username, role: user.role });
  } catch (e) {
    console.error('Login error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, lang } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: 'Tum alanlar gerekli' });
    if (rateLimit('register:' + req.ip, 5, 60000)) return res.status(429).json({ error: 'Cok fazla istek' });

    const u = username.trim().toLowerCase();
    if (u.length < 3 || u.length > 20) return res.status(400).json({ error: 'Kullanici adi 3-20 karakter' });
    if (!/^[a-z0-9._]+$/.test(u)) return res.status(400).json({ error: 'Kullanici adi sadece harf, rakam, nokta ve alt cizgi icerabilir' });
    if (password.length < 6) return res.status(400).json({ error: 'Sifre en az 6 karakter' });
    if (password.length > 128) return res.status(400).json({ error: 'Sifre en fazla 128 karakter' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Gecersiz e-posta' });
    if (email.length > 254) return res.status(400).json({ error: 'E-posta cok uzun' });

    const emailCheck = await getOne('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (emailCheck) return res.status(409).json({ error: 'Bu e-posta adresi zaten kayitli' });

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const result = await run(
      'INSERT INTO users (username, email, passwordhash, role, verified, verificationtoken, createdat) VALUES ($1, $2, $3, $4, false, $5, NOW()::text) ON CONFLICT (username) DO NOTHING RETURNING id, username, role',
      [u, email.trim().toLowerCase(), hash, 'user', verificationToken]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(409).json({ error: 'Kullanici adi zaten alinmis' });
    }

    const user = result.rows[0];
    sendVerificationEmail(email.trim().toLowerCase(), verificationToken, lang).catch(function (e) { console.error('Verify email failed:', e.message); });
    res.json({ ok: true, pendingVerification: true, username: user.username });
  } catch (e) {
    console.error('Register error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ ok: true });
});

app.get('/api/me', auth, async (req, res) => {
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role });
});

app.get('/api/check-username/:username', async (req, res) => {
  const u = req.params.username.trim().toLowerCase();
  const exists = await getOne('SELECT id FROM users WHERE username = $1', [u]);
  res.json({ available: !exists });
});

// ── Task Routes ─────────────────────────────────────────
app.get('/api/tasks', auth, async (req, res) => {
  try {
    const tasks = await getAll('SELECT * FROM tasks WHERE userid = $1 ORDER BY itemorder ASC', [req.user.id]);
    tasks.forEach(t => normalizeTask(t));
    res.json(tasks);
  } catch (e) {
    console.error('Tasks error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.post('/api/tasks', auth, async (req, res) => {
  try {
    if (rateLimit('tasks:' + req.user.id, 60, 60000)) return res.status(429).json({ error: 'Cok fazla istek' });

    const { text, priority, dueDate, category, tags, starred, recurring, subtasks } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ error: 'Gorev metni gerekli' });
    if (text.trim().length > 500) return res.status(400).json({ error: 'Gorev metni en fazla 500 karakter' });
    if (priority && !['low', 'medium', 'high'].includes(priority)) return res.status(400).json({ error: 'Gecersiz oncelik' });
    if (recurring && !['daily', 'weekly', 'monthly'].includes(recurring)) return res.status(400).json({ error: 'Gecersiz tekrar' });

    const maxOrder = await getOne('SELECT COALESCE(MAX(itemorder), 0) AS mx FROM tasks WHERE userid = $1', [req.user.id]);
    const order = (maxOrder.mx || 0) + 1;

    const result = await run(
      'INSERT INTO tasks (userid, text, done, priority, duedate, category, tags, itemorder, starred, recurring, subtasks, createdat, updatedat) VALUES ($1, $2, false, $3, $4, $5, $6, $7, $8, $9, $10, NOW()::text, NOW()::text) RETURNING *',
      [req.user.id, text.trim(), priority || 'medium', dueDate || null, category || '', JSON.stringify(tags || []), order, starred || false, recurring || null, JSON.stringify(subtasks || [])]
    );

    const task = result.rows[0];
    if (task) normalizeTask(task);
    res.json(task);
  } catch (e) {
    console.error('Task create error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.put('/api/tasks/reorder', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds gerekli' });
    await client.query('BEGIN');
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query('UPDATE tasks SET itemorder = $1 WHERE id = $2 AND userid = $3', [i, orderedIds[i], req.user.id]);
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Reorder error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  } finally {
    client.release();
  }
});

app.put('/api/tasks/:id', auth, async (req, res) => {
  try {
    if (rateLimit('taskupd:' + req.user.id, 120, 60000)) return res.status(429).json({ error: 'Cok fazla istek' });

    const { id } = req.params;
    const task = await getOne('SELECT * FROM tasks WHERE id = $1 AND userid = $2', [id, req.user.id]);
    if (!task) return res.status(404).json({ error: 'Gorev bulunamadi' });

    const { text, done, priority, dueDate, category, tags, starred, recurring, subtasks } = req.body || {};
    if (text !== undefined && text.trim().length > 500) return res.status(400).json({ error: 'Gorev metni en fazla 500 karakter' });
    if (priority && !['low', 'medium', 'high'].includes(priority)) return res.status(400).json({ error: 'Gecersiz oncelik' });
    if (recurring && !['daily', 'weekly', 'monthly'].includes(recurring)) return res.status(400).json({ error: 'Gecersiz tekrar' });

    const newDone = done !== undefined ? (done ? true : false) : task.done;
    const markCompletedOnce = newDone && !task.done && !task.completedonce;

    await run('UPDATE tasks SET text = $1, done = $2, priority = $3, duedate = $4, category = $5, tags = $6, starred = $7, recurring = $8, subtasks = $9, updatedat = NOW()::text' + (markCompletedOnce ? ', completedonce = true' : '') + ' WHERE id = $10',
      [
        text !== undefined ? text.trim() : task.text,
        newDone,
        priority || task.priority,
        dueDate !== undefined ? dueDate : task.duedate,
        category !== undefined ? category : task.category,
        tags !== undefined ? JSON.stringify(tags) : task.tags,
        starred !== undefined ? !!starred : !!task.starred,
        recurring !== undefined ? recurring : task.recurring,
        subtasks !== undefined ? JSON.stringify(subtasks) : task.subtasks,
        id
      ]);

    const updated = await getOne('SELECT * FROM tasks WHERE id = $1', [id]);
    if (updated) normalizeTask(updated);
    res.json(updated);
  } catch (e) {
    console.error('Task update error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.delete('/api/tasks/:id', auth, async (req, res) => {
  try {
    const task = await getOne('SELECT id FROM tasks WHERE id = $1 AND userid = $2', [req.params.id, req.user.id]);
    if (!task) return res.status(404).json({ error: 'Gorev bulunamadi' });
    await run('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Task delete error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.delete('/api/tasks/completed', auth, async (req, res) => {
  try {
    const result = await run('DELETE FROM tasks WHERE userid = $1 AND done = true', [req.user.id]);
    res.json({ ok: true, deleted: result.changes });
  } catch (e) {
    console.error('Delete completed error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

// ── Admin Routes ────────────────────────────────────────
app.get('/api/admin/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await getAll(`
      SELECT u.id, u.username, u.email, u.role, u.banned, u.lastlogin, u.createdat,
             COALESCE(t.cnt, 0)::int AS "taskCount"
      FROM users u
      LEFT JOIN (SELECT userid, COUNT(*) AS cnt FROM tasks GROUP BY userid) t ON t.userid = u.id
      ORDER BY u.id ASC
    `);
    res.json(users);
  } catch (e) {
    console.error('Admin users error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.get('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await getOne(`
      SELECT u.id, u.username, u.email, u.role, u.banned, u.lastlogin, u.createdat,
             COALESCE(t.cnt, 0)::int AS "taskCount"
      FROM users u
      LEFT JOIN (SELECT userid, COUNT(*) AS cnt FROM tasks GROUP BY userid) t ON t.userid = u.id
      WHERE u.id = $1
    `, [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Kullanici bulunamadi' });
    res.json(user);
  } catch (e) {
    console.error('Admin user get error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.put('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getOne('SELECT * FROM users WHERE id = $1', [id]);
    if (!user) return res.status(404).json({ error: 'Kullanici bulunamadi' });

    const { username, email, password, role, banned } = req.body || {};

    if (username && username.trim().toLowerCase() !== user.username) {
      const u = username.trim().toLowerCase();
      if (u.length < 3 || u.length > 20) return res.status(400).json({ error: 'Kullanici adi 3-20 karakter' });
      if (!/^[a-z0-9._]+$/.test(u)) return res.status(400).json({ error: 'Kullanici adi gecersiz' });
      const taken = await getOne('SELECT id FROM users WHERE username = $1 AND id != $2', [u, id]);
      if (taken) return res.status(409).json({ error: 'Kullanici adi zaten alinmis' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Gecersiz e-posta' });
    if (password && (password.length < 6 || password.length > 128)) return res.status(400).json({ error: 'Sifre 6-128 karakter olmali' });
    if (role && !['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Gecersiz rol' });

    const updates = [];
    const params = [];
    let idx = 1;
    if (username) { updates.push(`username = $${idx++}`); params.push(username.trim().toLowerCase()); }
    if (email) { updates.push(`email = $${idx++}`); params.push(email.trim().toLowerCase()); }
    if (password) { updates.push(`passwordhash = $${idx++}`); params.push(await bcrypt.hash(password, BCRYPT_ROUNDS)); }
    if (role) { updates.push(`role = $${idx++}`); params.push(role); }
    if (banned !== undefined) { updates.push(`banned = $${idx++}`); params.push(banned ? true : false); }

    if (updates.length) {
      params.push(id);
      await run('UPDATE users SET ' + updates.join(', ') + ` WHERE id = $${idx}`, params);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('Admin update error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.delete('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await getOne('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Kullanici bulunamadi' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Admin kullanilari silinemez' });
    await run('DELETE FROM tasks WHERE userid = $1', [req.params.id]);
    await run('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Admin delete error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

// ── Categories Routes ───────────────────────────────────
app.get('/api/categories', auth, async (req, res) => {
  try {
    const cats = await getAll('SELECT * FROM categories WHERE userid = $1 ORDER BY itemorder ASC', [req.user.id]);
    res.json(cats);
  } catch (e) {
    console.error('Categories error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.post('/api/categories', auth, async (req, res) => {
  try {
    const { name, color } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'Kategori adi gerekli' });
    if (name.trim().length > 30) return res.status(400).json({ error: 'Kategori adi en fazla 30 karakter' });
    if (rateLimit('cat:' + req.user.id, 30, 60000)) return res.status(429).json({ error: 'Cok fazla istek' });

    const maxOrder = await getOne('SELECT COALESCE(MAX(itemorder), 0) AS mx FROM categories WHERE userid = $1', [req.user.id]);
    const order = (maxOrder.mx || 0) + 1;

    const result = await run(
      'INSERT INTO categories (userid, name, color, itemorder, createdat) VALUES ($1, $2, $3, $4, NOW()::text) RETURNING *',
      [req.user.id, name.trim(), color || '#7c5cff', order]
    );
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Category create error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.put('/api/categories/:id', auth, async (req, res) => {
  try {
    const { name, color } = req.body || {};
    const cat = await getOne('SELECT * FROM categories WHERE id = $1 AND userid = $2', [req.params.id, req.user.id]);
    if (!cat) return res.status(404).json({ error: 'Kategori bulunamadi' });
    await run('UPDATE categories SET name = $1, color = $2 WHERE id = $3',
      [name || cat.name, color || cat.color, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Category update error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.delete('/api/categories/:id', auth, async (req, res) => {
  try {
    const cat = await getOne('SELECT * FROM categories WHERE id = $1 AND userid = $2', [req.params.id, req.user.id]);
    if (!cat) return res.status(404).json({ error: 'Kategori bulunamadi' });
    await run('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Category delete error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

// ── Stats Routes ────────────────────────────────────────
app.get('/api/stats/weekly', auth, async (req, res) => {
  try {
    const rows = await getAll(`
      SELECT EXTRACT(DOW FROM updatedat::timestamp)::int as day, COUNT(*)::int as count
      FROM tasks
      WHERE userid = $1 AND done = true
        AND updatedat::timestamp >= date_trunc('week', NOW())
      GROUP BY day ORDER BY day
    `, [req.user.id]);
    const weekStats = [0, 0, 0, 0, 0, 0, 0];
    rows.forEach(r => { weekStats[r.day] = r.count; });
    const total = weekStats.reduce((a, b) => a + b, 0);
    res.json({ weekStats, total });
  } catch (e) {
    console.error('Weekly stats error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

// ── Star Toggle ─────────────────────────────────────────
app.put('/api/tasks/:id/star', auth, async (req, res) => {
  try {
    const task = await getOne('SELECT * FROM tasks WHERE id = $1 AND userid = $2', [req.params.id, req.user.id]);
    if (!task) return res.status(404).json({ error: 'Gorev bulunamadi' });
    const newStarred = !task.starred;
    await run('UPDATE tasks SET starred = $1, updatedat = NOW()::text WHERE id = $2', [newStarred, req.params.id]);
    const updated = await getOne('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (updated) normalizeTask(updated);
    res.json(updated);
  } catch (e) {
    console.error('Star toggle error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

// ── User Profile / Gamification ─────────────────────────
app.get('/api/user/profile', auth, async (req, res) => {
  try {
    const user = await getOne('SELECT id, username, xp, level, streak, lastcompletiondate, dailygoal, weeklygoal FROM users WHERE id = $1', [req.user.id]);
    res.json(user);
  } catch (e) {
    console.error('Profile error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.put('/api/user/profile', auth, async (req, res) => {
  try {
    const { xp, level, streak, lastcompletiondate, dailygoal, weeklygoal } = req.body || {};
    const updates = [];
    const params = [];
    let idx = 1;
    if (xp !== undefined) { updates.push(`xp = $${idx++}`); params.push(xp); }
    if (level !== undefined) { updates.push(`level = $${idx++}`); params.push(level); }
    if (streak !== undefined) { updates.push(`streak = $${idx++}`); params.push(streak); }
    if (lastcompletiondate !== undefined) { updates.push(`lastcompletiondate = $${idx++}`); params.push(lastcompletiondate); }
    if (dailygoal !== undefined) { updates.push(`dailygoal = $${idx++}`); params.push(dailygoal); }
    if (weeklygoal !== undefined) { updates.push(`weeklygoal = $${idx++}`); params.push(weeklygoal); }
    if (updates.length) {
      params.push(req.user.id);
      await run('UPDATE users SET ' + updates.join(', ') + ` WHERE id = $${idx}`, params);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('Profile update error:', e.stack);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

// ── Error Handlers ──────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Bulunamadi' }));
app.use((err, req, res, next) => { console.error('Unhandled:', err.stack || err.message); res.status(500).json({ error: 'Sunucu hatasi' }); });

// ── Start ───────────────────────────────────────────────
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      banned BOOLEAN DEFAULT false,
      lastLogin TEXT,
      createdAt TEXT DEFAULT NOW()::text
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id),
      text TEXT NOT NULL,
      done BOOLEAN DEFAULT false,
      priority TEXT DEFAULT 'medium',
      dueDate TEXT,
      category TEXT,
      tags TEXT,
      itemOrder INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT NOW()::text,
      updatedAt TEXT DEFAULT NOW()::text
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(userId)');

  const admin = await getOne('SELECT id FROM users WHERE username = $1', ['admin']);
  if (!admin) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
    await run('INSERT INTO users (username, email, passwordHash, role, verified, createdAt) VALUES ($1, $2, $3, $4, true, NOW()::text)', ['admin', 'admin@example.com', hash, 'admin']);
    console.log('Admin user created. Set ADMIN_PASSWORD env var to change the default password.');
  }

  // Add verification columns if missing
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS verificationToken TEXT');
  await pool.query('UPDATE users SET verified = true WHERE role = $1', ['admin']);

  // Gamification columns
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS lastcompletiondate TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS dailygoal INTEGER DEFAULT 5');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS weeklygoal INTEGER DEFAULT 25');

  // Task extensions
  await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false');
  await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring TEXT');
  await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtasks TEXT DEFAULT '[]'");
  await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completedOnce BOOLEAN DEFAULT false');

  // Categories table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      userid INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      color TEXT DEFAULT '#7c5cff',
      itemorder INTEGER DEFAULT 0,
      createdat TEXT DEFAULT NOW()::text
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(userid)');

  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
})();
