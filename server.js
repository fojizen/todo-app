const express = require('express');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'todo.sqlite');
const SECRET_FILE = path.join(DATA_DIR, '.jwt_secret');
const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = '7d';
const ALLOWED_STATIC = ['index.html', 'app.js', 'styles.css', 'favicon.ico'];

let db;
let saveTimer = null;

// ── JWT Secret ──────────────────────────────────────────
function getSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (fs.existsSync(SECRET_FILE)) return fs.readFileSync(SECRET_FILE, 'utf8').trim();
  const s = crypto.randomBytes(64).toString('hex');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SECRET_FILE, s, { mode: 0o600 });
  return s;
}
const JWT_SECRET = getSecret();

// ── DB Persistence ──────────────────────────────────────
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    if (!db) return;
    try { fs.writeFileSync(DB_FILE, Buffer.from(db.export())); }
    catch (e) { console.error('DB save error:', e.message); }
  }, 300);
}

function flushSave() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  if (!db) return;
  try { fs.writeFileSync(DB_FILE, Buffer.from(db.export())); }
  catch (e) { console.error('DB flush error:', e.message); }
}

function run(sql, params = []) {
  try { db.run(sql, params); scheduleSave(); return { changes: db.getRowsModified() }; }
  catch (e) { console.error('run error:', e.message, sql); return { changes: 0 }; }
}

function getOne(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    if (stmt.step()) { const r = stmt.getAsObject(); stmt.free(); return r; }
    stmt.free(); return null;
  } catch (e) { return null; }
}

function getAll(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free(); return rows;
  } catch (e) { return []; }
}

// ── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self' 'unsafe-inline'");
  next();
});

// Static files (whitelist)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/app.js', (req, res) => res.sendFile(path.join(__dirname, 'app.js')));
app.get('/styles.css', (req, res) => res.sendFile(path.join(__dirname, 'styles.css')));
app.get('/sitemap.xml', (req, res) => { res.setHeader('Content-Type', 'application/xml'); res.sendFile(path.join(__dirname, 'sitemap.xml')); });
app.get('/robots.txt', (req, res) => { res.setHeader('Content-Type', 'text/plain'); res.send('User-agent: *\nAllow: /\nSitemap: http://localhost:3000/sitemap.xml'); });

// Health check
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

// Brute force protection
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

function clearLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

// ── Auth Middleware ──────────────────────────────────────
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Token gerekli' });
  try {
    const decoded = jwt.verify(h.slice(7), JWT_SECRET);
    const user = getOne('SELECT id, username, role, banned FROM users WHERE id = ?', [decoded.userId]);
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

// ── Auth Routes ─────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Kullanici adi ve sifre gerekli' });

  const ip = req.ip;
  if (checkBruteForce(ip)) return res.status(429).json({ error: 'Cok fazla deneme. 15 dakika bekleyin.' });
  if (rateLimit('login:' + ip, 20, 60000)) return res.status(429).json({ error: 'Cok fazla istek' });

  const user = getOne('SELECT * FROM users WHERE username = ?', [username.trim().toLowerCase()]);
  if (!user) { recordFailedLogin(ip); return res.status(401).json({ error: 'Gecersiz giris bilgileri' }); }

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) { recordFailedLogin(ip); return res.status(401).json({ error: 'Gecersiz giris bilgileri' }); }

  clearLoginAttempts(ip);
  run('UPDATE users SET lastLogin = datetime("now") WHERE id = ?', [user.id]);
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  res.json({ token, username: user.username, role: user.role });
});

app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ error: 'Tum alanlar gerekli' });
  if (rateLimit('register:' + req.ip, 5, 60000)) return res.status(429).json({ error: 'Cok fazla istek' });

  const u = username.trim().toLowerCase();
  if (u.length < 3 || u.length > 20) return res.status(400).json({ error: 'Kullanici adi 3-20 karakter' });
  if (password.length < 6) return res.status(400).json({ error: 'Sifre en az 6 karakter' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Gecersiz e-posta' });

  const existing = getOne('SELECT id FROM users WHERE username = ?', [u]);
  if (existing) return res.status(409).json({ error: 'Kullanici adi zaten alinmis' });

  const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  run('INSERT INTO users (username, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, datetime("now"))', [u, email.trim(), hash, 'user']);
  const user = getOne('SELECT * FROM users WHERE username = ?', [u]);
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  res.json({ token, username: user.username, role: user.role });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role });
});

app.get('/api/check-username/:username', (req, res) => {
  const u = req.params.username.trim().toLowerCase();
  const exists = getOne('SELECT id FROM users WHERE username = ?', [u]);
  res.json({ available: !exists });
});

// ── Task Routes ─────────────────────────────────────────
app.get('/api/tasks', auth, (req, res) => {
  const tasks = getAll('SELECT * FROM tasks WHERE userId = ? ORDER BY itemOrder ASC', [req.user.id]);
  tasks.forEach(t => {
    try { t.tags = t.tags ? JSON.parse(t.tags) : []; }
    catch { t.tags = []; }
    t.done = !!t.done;
  });
  res.json(tasks);
});

app.post('/api/tasks', auth, (req, res) => {
  const { text, priority, dueDate, category, tags } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: 'Gorev metni gerekli' });

  const maxOrder = getOne('SELECT COALESCE(MAX(itemOrder), 0) AS mx FROM tasks WHERE userId = ?', [req.user.id]);
  const order = (maxOrder.mx || 0) + 1;

  run('INSERT INTO tasks (userId, text, done, priority, dueDate, category, tags, itemOrder, createdAt, updatedAt) VALUES (?, ?, 0, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
    [req.user.id, text.trim(), priority || 'medium', dueDate || null, category || '', JSON.stringify(tags || []), order]);

  const task = getOne('SELECT * FROM tasks WHERE userId = ? ORDER BY id DESC LIMIT 1', [req.user.id]);
  if (task) { try { task.tags = task.tags ? JSON.parse(task.tags) : []; } catch { task.tags = []; } task.done = !!task.done; }
  res.json(task);
});

app.put('/api/tasks/:id', auth, (req, res) => {
  const { id } = req.params;
  const task = getOne('SELECT * FROM tasks WHERE id = ? AND userId = ?', [id, req.user.id]);
  if (!task) return res.status(404).json({ error: 'Gorev bulunamadi' });

  const { text, done, priority, dueDate, category, tags } = req.body || {};
  run('UPDATE tasks SET text = ?, done = ?, priority = ?, dueDate = ?, category = ?, tags = ?, updatedAt = datetime("now") WHERE id = ?',
    [
      text !== undefined ? text : task.text,
      done !== undefined ? (done ? 1 : 0) : task.done,
      priority || task.priority,
      dueDate !== undefined ? dueDate : task.dueDate,
      category !== undefined ? category : task.category,
      tags !== undefined ? JSON.stringify(tags) : task.tags,
      id
    ]);

  const updated = getOne('SELECT * FROM tasks WHERE id = ?', [id]);
  if (updated) { try { updated.tags = updated.tags ? JSON.parse(updated.tags) : []; } catch { updated.tags = []; } updated.done = !!updated.done; }
  res.json(updated);
});

app.delete('/api/tasks/:id', auth, (req, res) => {
  const task = getOne('SELECT id FROM tasks WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
  if (!task) return res.status(404).json({ error: 'Gorev bulunamadi' });
  run('DELETE FROM tasks WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

app.put('/api/tasks/reorder', auth, (req, res) => {
  const { orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds gerekli' });
  orderedIds.forEach((tid, i) => {
    run('UPDATE tasks SET itemOrder = ? WHERE id = ? AND userId = ?', [i, tid, req.user.id]);
  });
  res.json({ ok: true });
});

// ── Admin Routes ────────────────────────────────────────
app.get('/api/admin/users', auth, adminOnly, (req, res) => {
  const users = getAll('SELECT id, username, email, role, banned, lastLogin, createdAt FROM users ORDER BY id ASC');
  users.forEach(u => {
    const tc = getOne('SELECT COUNT(*) AS cnt FROM tasks WHERE userId = ?', [u.id]);
    u.taskCount = tc ? tc.cnt : 0;
  });
  res.json(users);
});

app.get('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  const user = getOne('SELECT id, username, email, role, banned, lastLogin, createdAt FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'Kullanici bulunamadi' });
  const tc = getOne('SELECT COUNT(*) AS cnt FROM tasks WHERE userId = ?', [user.id]);
  user.taskCount = tc ? tc.cnt : 0;
  res.json(user);
});

app.put('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  const { id } = req.params;
  const user = getOne('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) return res.status(404).json({ error: 'Kullanici bulunamadi' });

  const { username, email, password, role, banned } = req.body || {};
  if (username && username !== user.username) {
    const taken = getOne('SELECT id FROM users WHERE username = ? AND id != ?', [username.trim().toLowerCase(), id]);
    if (taken) return res.status(409).json({ error: 'Kullanici adi zaten alinmis' });
  }

  const updates = [];
  const params = [];
  if (username) { updates.push('username = ?'); params.push(username.trim().toLowerCase()); }
  if (email) { updates.push('email = ?'); params.push(email.trim()); }
  if (password) { updates.push('passwordHash = ?'); params.push(bcrypt.hashSync(password, BCRYPT_ROUNDS)); }
  if (role) { updates.push('role = ?'); params.push(role); }
  if (banned !== undefined) { updates.push('banned = ?'); params.push(banned ? 1 : 0); }

  if (updates.length) { params.push(id); run('UPDATE users SET ' + updates.join(', ') + ' WHERE id = ?', params); }
  res.json({ ok: true });
});

app.delete('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  const user = getOne('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'Kullanici bulunamadi' });
  if (user.username === 'admin') return res.status(403).json({ error: 'Admin silinemez' });
  run('DELETE FROM tasks WHERE userId = ?', [req.params.id]);
  run('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ── Error Handlers ──────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Bulunamadi' }));
app.use((err, req, res, next) => { console.error('Unhandled:', err.message); res.status(500).json({ error: 'Sunucu hatasi' }); });

// ── Start ───────────────────────────────────────────────
(async () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const SQL = await initSqlJs();
  const dbExists = fs.existsSync(DB_FILE);
  db = dbExists ? new SQL.Database(fs.readFileSync(DB_FILE)) : new SQL.Database();

  db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, email TEXT NOT NULL, passwordHash TEXT NOT NULL, role TEXT DEFAULT "user", banned INTEGER DEFAULT 0, lastLogin TEXT, createdAt TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, text TEXT NOT NULL, done INTEGER DEFAULT 0, priority TEXT DEFAULT "medium", dueDate TEXT, category TEXT, tags TEXT, itemOrder INTEGER DEFAULT 0, createdAt TEXT, updatedAt TEXT, FOREIGN KEY (userId) REFERENCES users(id))');
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(userId)');
  scheduleSave();

  // Default admin
  const admin = getOne('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!admin) {
    const hash = bcrypt.hashSync('fıj9823r82fkowpefpowflwfw211dawdFDQ', BCRYPT_ROUNDS);
    run('INSERT INTO users (username, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, datetime("now"))', ['admin', 'admin@example.com', hash, 'admin']);
  }

  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
})();
