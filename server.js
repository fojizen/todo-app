const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = '7d';
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// ── PostgreSQL ──────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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
  return { changes: result.rowCount };
}

// ── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self' 'unsafe-inline'");
  next();
});

// Static files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/app.js', (req, res) => res.sendFile(path.join(__dirname, 'app.js')));
app.get('/styles.css', (req, res) => res.sendFile(path.join(__dirname, 'styles.css')));
app.get('/favicon.svg', (req, res) => res.sendFile(path.join(__dirname, 'favicon.svg')));
app.get('/favicon.ico', (req, res) => res.sendFile(path.join(__dirname, 'favicon.ico')));
app.get('/apple-touch-icon.png', (req, res) => res.sendFile(path.join(__dirname, 'apple-touch-icon.png')));
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

// ── Auth Middleware ──────────────────────────────────────
async function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Token gerekli' });
  try {
    const decoded = jwt.verify(h.slice(7), JWT_SECRET);
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

    const valid = bcrypt.compareSync(password, user.passwordhash);
    if (!valid) { recordFailedLogin(ip); return res.status(401).json({ error: 'Gecersiz giris bilgileri' }); }

    clearLoginAttempts(ip);
    await run('UPDATE users SET lastlogin = NOW() WHERE id = $1', [user.id]);
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.json({ token, username: user.username, role: user.role });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: 'Tum alanlar gerekli' });
    if (rateLimit('register:' + req.ip, 5, 60000)) return res.status(429).json({ error: 'Cok fazla istek' });

    const u = username.trim().toLowerCase();
    if (u.length < 3 || u.length > 20) return res.status(400).json({ error: 'Kullanici adi 3-20 karakter' });
    if (password.length < 6) return res.status(400).json({ error: 'Sifre en az 6 karakter' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Gecersiz e-posta' });

    const existing = await getOne('SELECT id FROM users WHERE username = $1', [u]);
    if (existing) return res.status(409).json({ error: 'Kullanici adi zaten alinmis' });

    const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
    await run('INSERT INTO users (username, email, passwordhash, role, createdat) VALUES ($1, $2, $3, $4, NOW())', [u, email.trim(), hash, 'user']);
    const user = await getOne('SELECT * FROM users WHERE username = $1', [u]);
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.json({ token, username: user.username, role: user.role });
  } catch (e) {
    console.error('Register error:', e.message);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
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
    tasks.forEach(t => {
      try { t.tags = t.tags ? JSON.parse(t.tags) : []; } catch { t.tags = []; }
      t.done = !!t.done;
    });
    res.json(tasks);
  } catch (e) {
    console.error('Tasks error:', e.message);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.post('/api/tasks', auth, async (req, res) => {
  try {
    const { text, priority, dueDate, category, tags } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ error: 'Gorev metni gerekli' });

    const maxOrder = await getOne('SELECT COALESCE(MAX(itemorder), 0) AS mx FROM tasks WHERE userid = $1', [req.user.id]);
    const order = (maxOrder.mx || 0) + 1;

    await run('INSERT INTO tasks (userid, text, done, priority, duedate, category, tags, itemorder, createdat, updatedat) VALUES ($1, $2, 0, $3, $4, $5, $6, $7, NOW(), NOW())',
      [req.user.id, text.trim(), priority || 'medium', dueDate || null, category || '', JSON.stringify(tags || []), order]);

    const task = await getOne('SELECT * FROM tasks WHERE userid = $1 ORDER BY id DESC LIMIT 1', [req.user.id]);
    if (task) { try { task.tags = task.tags ? JSON.parse(task.tags) : []; } catch { task.tags = []; } task.done = !!task.done; }
    res.json(task);
  } catch (e) {
    console.error('Task create error:', e.message);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.put('/api/tasks/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await getOne('SELECT * FROM tasks WHERE id = $1 AND userid = $2', [id, req.user.id]);
    if (!task) return res.status(404).json({ error: 'Gorev bulunamadi' });

    const { text, done, priority, dueDate, category, tags } = req.body || {};
    await run('UPDATE tasks SET text = $1, done = $2, priority = $3, duedate = $4, category = $5, tags = $6, updatedat = NOW() WHERE id = $7',
      [
        text !== undefined ? text : task.text,
        done !== undefined ? (done ? 1 : 0) : task.done,
        priority || task.priority,
        dueDate !== undefined ? dueDate : task.duedate,
        category !== undefined ? category : task.category,
        tags !== undefined ? JSON.stringify(tags) : task.tags,
        id
      ]);

    const updated = await getOne('SELECT * FROM tasks WHERE id = $1', [id]);
    if (updated) { try { updated.tags = updated.tags ? JSON.parse(updated.tags) : []; } catch { updated.tags = []; } updated.done = !!updated.done; }
    res.json(updated);
  } catch (e) {
    console.error('Task update error:', e.message);
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
    console.error('Task delete error:', e.message);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.put('/api/tasks/reorder', auth, async (req, res) => {
  try {
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds gerekli' });
    for (let i = 0; i < orderedIds.length; i++) {
      await run('UPDATE tasks SET itemorder = $1 WHERE id = $2 AND userid = $3', [i, orderedIds[i], req.user.id]);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('Reorder error:', e.message);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

// ── Admin Routes ────────────────────────────────────────
app.get('/api/admin/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await getAll('SELECT id, username, email, role, banned, lastlogin, createdat FROM users ORDER BY id ASC');
    for (const u of users) {
      const tc = await getOne('SELECT COUNT(*)::int AS cnt FROM tasks WHERE userid = $1', [u.id]);
      u.taskCount = tc ? tc.cnt : 0;
    }
    res.json(users);
  } catch (e) {
    console.error('Admin users error:', e.message);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.get('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await getOne('SELECT id, username, email, role, banned, lastlogin, createdat FROM users WHERE id = $1', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Kullanici bulunamadi' });
    const tc = await getOne('SELECT COUNT(*)::int AS cnt FROM tasks WHERE userid = $1', [user.id]);
    user.taskCount = tc ? tc.cnt : 0;
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.put('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getOne('SELECT * FROM users WHERE id = $1', [id]);
    if (!user) return res.status(404).json({ error: 'Kullanici bulunamadi' });

    const { username, email, password, role, banned } = req.body || {};
    if (username && username !== user.username) {
      const taken = await getOne('SELECT id FROM users WHERE username = $1 AND id != $2', [username.trim().toLowerCase(), id]);
      if (taken) return res.status(409).json({ error: 'Kullanici adi zaten alinmis' });
    }

    const updates = [];
    const params = [];
    let idx = 1;
    if (username) { updates.push(`username = $${idx++}`); params.push(username.trim().toLowerCase()); }
    if (email) { updates.push(`email = $${idx++}`); params.push(email.trim()); }
    if (password) { updates.push(`passwordhash = $${idx++}`); params.push(bcrypt.hashSync(password, BCRYPT_ROUNDS)); }
    if (role) { updates.push(`role = $${idx++}`); params.push(role); }
    if (banned !== undefined) { updates.push(`banned = $${idx++}`); params.push(banned ? true : false); }

    if (updates.length) { params.push(id); await run('UPDATE users SET ' + updates.join(', ') + ` WHERE id = $${idx}`, params); }
    res.json({ ok: true });
  } catch (e) {
    console.error('Admin update error:', e.message);
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

app.delete('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await getOne('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Kullanici bulunamadi' });
    if (user.username === 'admin') return res.status(403).json({ error: 'Admin silinemez' });
    await run('DELETE FROM tasks WHERE userid = $1', [req.params.id]);
    await run('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

// ── Error Handlers ──────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Bulunamadi' }));
app.use((err, req, res, next) => { console.error('Unhandled:', err.message); res.status(500).json({ error: 'Sunucu hatasi' }); });

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
    const hash = bcrypt.hashSync('fij9823r82fkowpefpowflwfw211dawdFDQ', BCRYPT_ROUNDS);
    await run('INSERT INTO users (username, email, passwordHash, role, createdAt) VALUES ($1, $2, $3, $4, NOW()::text)', ['admin', 'admin@example.com', hash, 'admin']);
  }

  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
})();
