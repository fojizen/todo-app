<p align="center">
  <img src="https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Frontend-Vanilla_JS-F7DF1E?logo=javascript&logoColor=black" alt="Vanilla JS">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen" alt="Status">
</p>

<h1 align="center">Todo App</h1>

<p align="center">
  A modern, secure, and beautifully designed task management application.<br>
  Vanilla JS frontend + Express.js backend + PostgreSQL database.
</p>

<p align="center">
  <a href="https://fojizen-todo-app.onrender.com" target="_blank">Live Demo</a> &bull;
  <a href="#features">Features</a> &bull;
  <a href="#installation">Installation</a> &bull;
  <a href="#api-reference">API</a> &bull;
  <a href="#environment-variables">Environment</a>
</p>

---

## Features

### Task Management
- Create, edit, and delete tasks
- Toggle task completion (checkbox)
- Priority levels: Low, Medium, High
- Due dates with overdue highlighting
- Categories: Work, Personal, Shopping, Health, Education
- Tag system (comma-separated)
- Drag & drop reordering
- Filtering: status, priority, category, search
- Sorting: date, priority, creation, manual order
- Bulk delete completed tasks
- Task count and statistics

### User System
- Registration (username availability check, email verification)
- Login (button spinner + checkmark animation)
- Session management (JWT, httpOnly cookie, 7-day expiry)
- Secure password storage (bcrypt, 12 rounds, async)
- Page state persistence across refreshes

### Design & Theme
- Dark / Light / System theme
- Particle animated background (Canvas API)
- Animated orbs, grid, and code snippets on login page
- Glassmorphism effects
- Modern loader animation (rotating glow ring)
- Responsive design (mobile, tablet, desktop, TV)
- Zoom-compatible layout
- TR / EN language support
- Page transition animations
- Enhanced options panel (modern select, date picker, tag input)
- Footer social media links (GitHub, LinkedIn, Instagram, Portfolio)

### PWA (Progressive Web App)
- Installable on mobile (Android, iOS) and desktop
- Service worker with network-first and cache-first strategies
- Offline support for static assets
- App-like experience when installed

### Security
- Rate limiting (login: 15/min, register: 10/15min, task CRUD: 30/min)
- Brute force protection (5 failed attempts → 15 min lockout)
- Security headers: HSTS, CSP, X-Content-Type-Options, X-Frame-Options: DENY, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- CORS restriction (whitelist allowed origins)
- JWT authentication (httpOnly cookie, 7-day expiry)
- Input validation (type, length, regex, 500 char limit)
- XSS protection (HTML encoding, attribute escaping)
- SQL injection prevention (prepared statements)
- Double-submit prevention (POST-only, 1s cooldown)
- Race condition prevention (ON CONFLICT)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES5+) |
| Backend | Express.js 5.x |
| Database | PostgreSQL (Supabase) |
| Auth | JWT (jsonwebtoken) + httpOnly cookie |
| Password Hashing | bcryptjs (async) |
| Cookies | cookie-parser |
| Styling | Custom CSS (CSS Variables, Glassmorphism, Animations) |
| Animations | Canvas API (particles), CSS Animations |
| Email | Resend API (HTTPS, email verification) |
| PWA | Service Worker, Web App Manifest |
| Deployment | OnRender (backend) |

---

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ (tested: 24.x)
- npm
- PostgreSQL database (Supabase or local)

### Steps

```bash
# Clone the repository
git clone https://github.com/fojizen/todo-app.git
cd todo-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Start the server
node server.js
```

Server starts at `http://localhost:3000` by default.

---

## Project Structure

```
todo-app/
├── server.js            # Express backend, API routes, DB helpers
├── app.js               # Frontend JavaScript (IIFE, API, UI)
├── index.html           # Main HTML page (landing, login, tasks, modals)
├── styles.css           # CSS styles (theme, responsive, animations)
├── sw.js                # Service worker (PWA)
├── manifest.json        # Web App Manifest (PWA)
├── icon-192.png         # PWA icon 192x192
├── icon-512.png         # PWA icon 512x512
├── package.json         # Dependencies and scripts
├── favicon.svg          # SVG favicon (checkmark icon)
├── favicon.ico          # ICO favicon (search engines)
├── apple-touch-icon.png # Apple touch icon (mobile)
├── sitemap.xml          # Sitemap (search engines)
└── .env.example         # Environment variables template
```

---

## API Reference

All API endpoints require the `/api` prefix.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/login` | Login (returns token via cookie) |
| `POST` | `/api/register` | Register (returns token via cookie) |
| `POST` | `/api/logout` | Logout (clears cookie) |
| `GET` | `/api/check-username/:username` | Check username availability |
| `GET` | `/api/me` | Get current user info (token required) |

### Tasks (token required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List all tasks |
| `POST` | `/api/tasks` | Create a new task |
| `PUT` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `PUT` | `/api/tasks/reorder` | Reorder tasks |

### Email Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/verify-email/:token` | Verify email address |
| `POST` | `/api/resend-verification` | Resend verification email |

---

## Environment Variables

Create a `.env` file (never commit this file):

```env
PORT=3000
DATABASE_URL=postgresql://user:pass@host:6543/dbname?pgbouncer=true
JWT_SECRET=your-secret-key-min-64-chars
ADMIN_PASSWORD=your-admin-password
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
RESEND_API_KEY=re_your_resend_api_key
```

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing key (min 64 chars) | Yes |
| `ADMIN_PASSWORD` | Admin password | Yes |
| `FRONTEND_URL` | Frontend URL (for CORS) | No (default: localhost:3000) |
| `NODE_ENV` | Environment (`production` / `development`) | No (default: development) |
| `RESEND_API_KEY` | Resend API key for email verification | Yes |

> **Never expose API keys, passwords, or connection strings in your code or repository.**

---

## Database Schema

### users

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key, auto-increment |
| username | TEXT | Unique username |
| email | TEXT | Email address |
| passwordhash | TEXT | bcrypt hashed password |
| role | TEXT | User role |
| verified | BOOLEAN | `true`: email verified, `false`: pending |
| banned | BOOLEAN | `true`: banned, `false`: active |
| lastlogin | TEXT | Last login timestamp |
| createdat | TEXT | Account creation timestamp |

### tasks

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key, auto-increment |
| userid | INTEGER | User ID (FK → users.id) |
| text | TEXT | Task text (max 500 chars) |
| done | BOOLEAN | `true`: completed, `false`: pending |
| priority | TEXT | `low`, `medium`, `high` |
| duedate | TEXT | Due date (YYYY-MM-DD) |
| category | TEXT | Category name |
| tags | TEXT | Tags as JSON array |
| itemorder | INTEGER | Sort order value |
| createdat | TEXT | Creation timestamp |
| updatedat | TEXT | Update timestamp |

### login_attempts (brute force protection)

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| username | TEXT | Username |
| ip | TEXT | IP address |
| success | BOOLEAN | Successful login attempt |
| createdat | TEXT | Attempt timestamp |

---

## Security

- **Password Hashing:** bcrypt (12 rounds, async)
- **Token:** JWT 7-day expiry, HS256, httpOnly cookie
- **Rate Limiting:** IP-based request limits (login, register, task CRUD)
- **Brute Force:** 5 failed attempts → 15 minute lockout
- **Headers:** HSTS, CSP, Clickjacking, MIME sniffing, XSS protection
- **CORS:** Whitelist allowed origins only
- **Input Validation:** Server-side type, length, and format checks
- **Prepared Statements:** SQL injection prevention
- **HTML Encoding:** XSS prevention via output sanitization
- **Double-Submit Prevention:** POST-only, 1-second cooldown
- **Race Condition Prevention:** ON CONFLICT for concurrent requests

---

## SEO & Deployment

- **Meta tags:** title, description, og:image, og:url, og:site_name, canonical
- **JSON-LD:** Person + WebSite structured data
- **Sitemap:** `/sitemap.xml`
- **Favicon:** SVG (browsers), ICO (search engines), Apple Touch Icon (mobile)
- **OnRender:** Backend deployment (auto-sleep prevention via ping)
- **UptimeRobot:** 5-minute ping interval (prevents OnRender sleep)

---

## Contact

- **GitHub:** [github.com/fojizen](https://github.com/fojizen)
- **LinkedIn:** [linkedin.com/in/fojizen](https://www.linkedin.com/in/fojizen/)
- **Instagram:** [instagram.com/fojizen](https://www.instagram.com/fojizen/)
- **Portfolio:** [fojizen.vercel.app](https://fojizen.vercel.app)

---

## License

MIT License. See [LICENSE](LICENSE) for details.

<p align="center">
  <sub>&copy; 2026 fojizen. All rights reserved.</sub>
</p>
