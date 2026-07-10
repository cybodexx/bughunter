# SecureScan Pro

An educational web-based security scanner that helps developers and security enthusiasts identify common vulnerabilities in web applications. Built for **authorized testing only**.

![SecureScan Pro](https://img.shields.io/badge/version-2.1.0-blue) ![Node.js](https://img.shields.io/badge/Node.js-20-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![License](https://img.shields.io/badge/license-MIT-yellow)

---

## ⚠️ Legal Disclaimer

This tool is designed for **educational purposes and authorized security testing only**.

- Only test systems you own or have **explicit written permission** to test
- Follow responsible disclosure practices for any vulnerabilities found
- Comply with all applicable laws and regulations in your jurisdiction
- Use findings to improve security, not to cause harm

Unauthorized use is illegal and unethical.

---

## Features

### 🔍 23 Vulnerability Detection Modules

| Module | Category | Risk Level |
|--------|----------|------------|
| SQL Injection | Injection | Critical |
| Cross-Site Scripting (XSS) | Injection | High |
| Command Injection | Injection | Critical |
| Directory Traversal | Access Control | High |
| Server-Side Request Forgery (SSRF) | Access Control | Critical |
| XML External Entity (XXE) | Injection | High |
| Server-Side Template Injection (SSTI) | Injection | Critical |
| NoSQL Injection | Injection | High |
| LDAP Injection | Injection | High |
| XML Injection | Injection | Medium |
| File Inclusion | Access Control | High |
| Auth Bypass | Authentication | Critical |
| Parameter Fuzzing | Input Validation | Medium |
| SSL/TLS Configuration | Cryptography | Medium |
| CSRF | Authentication | High |
| Open Redirect | Validation | Medium |
| CORS Misconfiguration | Configuration | High |
| Security Headers | Configuration | Medium |
| Sensitive Data Exposure | Information Disclosure | Critical |
| HTTP Methods Testing | Configuration | Medium |
| Clickjacking | UI Redressing | Medium |
| Rate Limiting | DoS Protection | Medium |
| Broken Access Control | Access Control | Critical |

### 📖 Attack Guide
Step-by-step breakdowns of how attackers exploit each vulnerability type — plus defensive controls to stop them.

### 🚀 One-Click Deployment Guide
Instructions for deploying to Render, Railway, Fly.io, and Heroku with Docker support and environment variable templates.

### 📊 Live Scan Progress
Real-time scanning progress with per-module status, request counts, and estimated completion time.

---

## Tech Stack

- **Backend:** Node.js 20, Express, TypeScript, tsx
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Scanner:** Axios-based HTTP probing with custom detection logic
- **Routing:** Wouter
- **State:** TanStack Query

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
git clone https://github.com/cybodexx/lop.git
cd lop
npm install
```

### Running in Development

```bash
npm run dev
```

The app starts on **http://localhost:5000**.

### Building for Production

```bash
npm run build
npm run start
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `SESSION_SECRET` | Secret for session signing | Required in production |
| `NODE_ENV` | Environment (`development` / `production`) | `development` |

Create a `.env` file in the project root:

```env
PORT=5000
SESSION_SECRET=your-secret-here
NODE_ENV=development
```

---

## Project Structure

```
├── client/                  # React frontend
│   └── src/
│       ├── components/
│       │   ├── layout/      # Sidebar, header
│       │   └── scanner/     # Scan modules, progress, results
│       ├── pages/           # Scanner, History, Attack Guide, Deploy
│       └── App.tsx
├── server/                  # Express backend
│   ├── index.ts             # Entry point
│   ├── scanner.ts           # All 23 vulnerability detection modules
│   ├── routes.ts            # API routes
│   ├── storage.ts           # In-memory data store
│   └── vite.ts              # Vite dev middleware
├── shared/                  # Shared types (schema)
└── vite.config.ts
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/scans` | List all past scans |
| `POST` | `/api/scans` | Start a new scan |
| `GET` | `/api/scans/:id` | Get scan details |
| `POST` | `/api/validate-url` | Validate a target URL |

---

## Deployment

See the in-app **Deploy** page (`/deploy`) for one-click guides for:
- **Render** (recommended, free tier available)
- **Railway**
- **Fly.io**
- **Heroku**

Or deploy with Docker:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "run", "start"]
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-module`
3. Commit your changes: `git commit -m "Add new scanner module"`
4. Push to the branch: `git push origin feature/new-module`
5. Open a Pull Request

---

## License

MIT — see [LICENSE](LICENSE) for details.
