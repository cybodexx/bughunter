# BugHunter — `lop` Service

This repository folder implements BugHunter: an Express + React application that performs web security scans and exposes a UI and API for managing scans, students, assignments, and batch jobs.

## High-level Architecture

- Backend: Node.js (ESM) + Express. The server exposes a REST API under `/api/*` and hosts the built frontend in production.
- Scanning engine: `scanner.ts` — a server-side `SecurityScanner` class that runs modular tests (SQLi, XSS, SSRF, etc.) and writes `vulnerabilities` to storage.
- Storage: abstracted via `storage` (DB layer). Schemas are defined in `@shared/schema`.
- Frontend: React (Vite) client in `src` (built to `dist/public`) — components live under `components/` and pages like `scanner.tsx` provide the UI.
- Dev integration: `vite.ts` integrates Vite middleware during development; production uses the built `dist/public` static site.

## Key Files

- `index.ts` — server entrypoint; registers routes and conditionally hooks Vite for dev.
- `routes.ts` — all Express routes (scans, vulnerabilities, students, assignments, batch jobs, reports).
- `scanner.ts` — server-side scanner implementation and exported `scanner` instance.
- `batch-scanner.ts` — orchestrates batch scan jobs and evaluation flows.
- `vite.ts` — Vite dev middleware setup and static serving helper.
- `vite.config.ts` — Vite configuration for the client.
- `scanner.tsx` — React UI page for scanner (client-side).

## How Scans Work (flow)

1. Client creates a scan via POST `/api/scans` (validated by Zod schemas).
2. Server creates a `Scan` record in storage and calls `scanner.startScan(scanId)` asynchronously.
3. `SecurityScanner` iterates enabled modules and runs tests (HTTP requests using `axios`) against the target URL.
4. When a module detects evidence, it writes a `Vulnerability` entry via `storage.createVulnerability`.
5. Progress and results are available via GET endpoints, e.g. `/api/scans`, `/api/scans/:id/vulnerabilities`.

## Run locally

Prerequisites: Node.js (>=18 or >=20 recommended), `npm`.

Install dependencies:
```bash
cd lop
npm install
```

Development (server + Vite dev middleware):
```bash
cd lop
npm run dev
```

Production (build client + run server):
```bash
cd lop
npm run build
npm start
```

Notes:
- `npm run dev` runs `tsx index.ts` and will load Vite in middleware mode for fast client HMR.
- `npm run build` builds the client (`vite build`) then bundles the server entry with `esbuild` to `dist/index.js`.

## Environment variables

Place environment variables in a `.env` file or in the environment. Common variables used:

- `PORT` — port to serve the app (default `5000`).
- `NODE_ENV` — `development` or `production` (some dev-only features are gated on this).
- Database and third-party credentials — configured via `storage` (check your deployment setup).

If you are using `.env`, review `index.ts` and `vite.ts` for places that call `dotenv.config()`.

## Scripts

- `npm run dev` — development server (Express + Vite middleware).
- `npm run build` — build client and bundle server into `dist`.
- `npm start` — start the production server (expects `dist` built).
- `npm run check` — TypeScript typecheck.
- `npm run db:push` — push DB migrations with `drizzle-kit` (if configured).

## Storage / Database

Storage is abstracted behind `storage` module. It exposes functions like `createScan`, `getAllScans`, `createVulnerability`, etc. The concrete implementation will use a database (Drizzle/Neon/Postgres based on dependencies). Check the `storage` implementation file to see database connection and migration steps.

## Deployment

Simple Dockerfile (example):

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN cd lop && npm ci --production && npm run build
ENV PORT=5000
EXPOSE 5000
CMD ["node", "lop/dist/index.js"]
```

Or build and deploy using a Node runtime (Cloud Run, Heroku, EC2). Ensure environment variables and a persistent DB are configured.

## Troubleshooting

- If the dev server fails due to Vite imports, prefer running `npm run build && npm start` to run the server without dev middleware.
- If the production server cannot find the built client, ensure `npm run build` completed and `lop/dist/public/index.html` exists.
- For Vite export/import issues, `vite` internals should not be imported at module-evaluation time; dynamic import is used in `vite.ts` to avoid bundling-time resolution problems.

## Testing

There are no automated tests included by default. To add tests, consider Jest or Vitest for unit tests and Supertest for route integration tests.

## Contributing / Extending

- Add new scanner modules by extending `scanner.ts`'s `initializeModules` and implementing a new test method.
- Add API endpoints in `routes.ts` and keep validation schemas in `@shared/schema`.
- Keep UI components in `components/` and pages under the client `src` structure.

## Security & Responsible Use

This project performs active scanning of web targets. Only scan systems you own or have explicit permission to test. Misuse may be illegal.

---

For a walkthrough or to add deployment automation (Docker Compose, CI/CD), tell me how you'd like to host it and I will add the necessary files and instructions.
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
