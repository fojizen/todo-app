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
  <a href="#environment-variables">Environment</a>
</p>

<p align="center">
  <img src="screenshots/homepage.png" alt="Homepage" width="350">
  &nbsp;
  <img src="screenshots/privacy.png" alt="Privacy Policy" width="350">
  &nbsp;
  <img src="screenshots/todo.png" alt="Todo App" width="350">
</p>

---

## Features

### Task Management
- Create, edit, and delete tasks
- Toggle task completion (checkbox)
- Priority levels: Low, Medium, High
- Due dates with overdue highlighting
- Categories with custom colors
- Tag system (comma-separated)
- Drag & drop reordering (desktop)
- Filtering: status, priority, category, search
- Sorting: date, priority, creation, manual order
- Bulk delete completed tasks
- Star/favorite tasks
- Recurring tasks (daily, weekly, monthly)
- Subtasks with completion tracking

### Sidebar
- Quick filters: All, Today, This Week, Overdue, Completed, Starred
- Custom categories with color picker
- Focus Timer (Pomodoro) with customizable duration
- Weekly stats chart
- Daily goal progress bar
- Toggle with Ctrl+B

### Gamification
- XP system with level progression
- Daily streak tracking
- Confetti animation on task completion

### User System
- Registration with email verification
- Login with spinner animation
- Social Login: Google, GitHub, Discord (OAuth2)
- Session management (JWT, httpOnly cookie)
- Page state persistence across refreshes

### Design & Theme
- Dark / Light / System theme
- Particle animated background (Canvas API)
- Glassmorphism effects
- Responsive design (mobile, tablet, desktop, TV)
- TR / EN language support (full i18n)
- Page transition animations
- Footer social media links

### Mobile Experience
- Slide-in drawer navigation (swipe-to-close)
- Segmented login/register toggle in drawer
- PWA install button (hidden when already installed)

### Landing Page
- About section with developer profile and social links
- Privacy Policy section (collapsible)
- Animated stars/sparkles in all sections
- Smooth scroll navigation

### PWA (Progressive Web App)
- Installable on mobile and desktop
- Service worker with network-first and cache-first strategies
- Offline support for static assets

### Admin Panel
- User management (view, edit, ban/unban, delete)
- Role-based access control

### Security
- Rate limiting on auth and task endpoints
- Brute force protection with temporary lockout
- Security headers (HSTS, CSP, X-Content-Type-Options, X-Frame-Options)
- CORS restriction (whitelist allowed origins)
- JWT authentication (httpOnly cookie)
- Input validation (type, length, format)
- XSS and SQL injection prevention
- Double-submit and race condition prevention

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES5+) |
| Backend | Express.js 5.x |
| Database | PostgreSQL (Supabase) |
| Auth | JWT + OAuth2 (Google, GitHub, Discord) |
| Password Hashing | bcryptjs (async) |
| Styling | Custom CSS (Variables, Glassmorphism) |
| Animations | Canvas API, CSS Animations |
| Email | Resend API |
| PWA | Service Worker, Web App Manifest |
| Deployment | OnRender |

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
├── app.js               # Frontend JavaScript
├── index.html           # Main HTML page
├── styles.css           # CSS styles
├── sw.js                # Service worker (PWA)
├── manifest.json        # Web App Manifest
├── package.json         # Dependencies
├── favicon.svg          # SVG favicon
├── favicon.ico          # ICO favicon
├── apple-touch-icon.png # Apple touch icon
├── sitemap.xml          # Sitemap
└── .env.example         # Environment variables template
```

---

## Environment Variables

Create a `.env` file (never commit this file):

```env
PORT=3000
DATABASE_URL=postgresql://user:pass@host:6543/dbname?pgbouncer=true
JWT_SECRET=your-secret-key-min-64-chars
ADMIN_PASSWORD=your-admin-password
FRONTEND_URL=https://your-domain.com
NODE_ENV=production
RESEND_API_KEY=re_your_resend_api_key

# Social Login (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
```

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing key (min 64 chars) | Yes |
| `ADMIN_PASSWORD` | Admin password | Yes |
| `FRONTEND_URL` | Frontend URL (for CORS & OAuth callbacks) | No |
| `NODE_ENV` | Environment mode | No (default: development) |
| `RESEND_API_KEY` | Resend API key for email | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | No |
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID | No |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret | No |
| `DISCORD_CLIENT_ID` | Discord OAuth Client ID | No |
| `DISCORD_CLIENT_SECRET` | Discord OAuth Client Secret | No |

> **Never expose API keys, passwords, or connection strings in your code or repository.**

---

## OAuth Setup

To enable social login, create OAuth apps on each provider and set the redirect URI to:

```
https://your-domain.com/api/auth/{provider}/callback
```

Replace `{provider}` with `google`, `github`, or `discord`.

| Provider | Setup Page |
|----------|------------|
| Google | [Cloud Console](https://console.cloud.google.com/apis/credentials) |
| GitHub | [Developer Settings](https://github.com/settings/developers) |
| Discord | [Developer Portal](https://discord.com/developers/applications) |

---

## SEO

- **Meta tags:** title, description, keywords, canonical, robots
- **Open Graph:** og:title, og:description, og:image, og:url, og:locale
- **Twitter Card:** summary_large_image with image
- **JSON-LD:** SoftwareApplication + Person + WebSite structured data
- **Cross-linking:** Mutual hreflang links with [Portfolio](https://fojizen.vercel.app)
- **Sitemap:** `/sitemap.xml` (includes both sites)

---

## Deployment

- **OnRender:** Backend hosting (auto-sleep prevention via UptimeRobot ping every 5 min)
- **Supabase:** PostgreSQL database

---

## Related Projects

| Project | Description | Link |
|---------|-------------|------|
| **Portfolio** | fojizen personal portfolio — frontend dev, UI/UX design, projects | [Live](https://fojizen.vercel.app) |

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
