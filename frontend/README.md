# TaskSystem Web App

React frontend for TaskSystem: landing page, dashboard, Kanban board, issues, projects, teams and admin screens.

> Running the whole stack with Docker is described in the [root README](../README.md). This file covers the frontend on its own.

## Tech stack

| Category | Technology |
|---|---|
| Framework | React 19 |
| Build tool | Vite 7 |
| Routing | React Router 7 |
| State | Zustand |
| Styling | Tailwind CSS 4, tw-animate-css |
| UI primitives | Radix UI + project components in `src/components/ui` |
| Icons & type | pixelarticons, self-hosted Silkscreen and Pixelify Sans (@fontsource) |
| Drag & drop | @hello-pangea/dnd |
| Charts | Recharts |
| Motion | GSAP (Flip, ScrollTrigger) |
| HTTP | Axios |
| Toasts | Sonner |
| PWA | vite-plugin-pwa |
| Tests | Vitest + Testing Library |

## Requirements

- Node.js 20.19+ or 22+
- A running API (see [`../backend`](../backend/README.md)) or the public demo API

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs on **http://localhost:3000**.

## Environment variables

| Variable | Example | Meaning |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:6901` | Where API requests go (see below) |
| `VITE_PROXY_TARGET` | `http://localhost:6901` | Optional: target for the Vite dev/preview `/api` proxy |
| `VITE_TOKEN_DEBUG` | `true` | Log token handling to the browser console |

How `VITE_API_BASE_URL` is interpreted ([`src/services/apiBase.js`](src/services/apiBase.js)):

- **not set:** `http://localhost:6901`, i.e. a backend started with `./mvnw spring-boot:run` in `../backend`
- **a URL:** that API, e.g. one running on another machine
- **set but empty:** same origin. The Docker image builds with this, so the browser calls `/api/...` on the address the app was loaded from and nginx forwards it to the backend.

## Scripts

```bash
npm run dev        # dev server with hot reload
npm run build      # production build into dist/
npm run preview    # serve the production build
npm run test       # tests in watch mode
npm run test:run   # tests once
npm run lint       # ESLint
```

## Docker image

[`Dockerfile`](Dockerfile) builds the app with Node and serves `dist/` with nginx. [`nginx/default.conf.template`](nginx/default.conf.template):

- serves the static files with client-side routing fallback to `index.html`,
- proxies `/api/` to `BACKEND_URL` (default `http://backend:6901`, the service name in `docker-compose.yml`),
- never caches the service worker and manifest, and caches hashed assets for a year.

```bash
docker build -t tasksystem-web .
```

## Project structure

```
src/
├── features/        # page-level modules: landing, dashboard, boards, issues, projects, teams, users, labels, auth
├── components/
│   ├── arcade/      # design-system primitives: pixel icons, status glyphs, meters, logo
│   ├── ui/          # buttons, badges, dialogs, selects, cards, …
│   ├── layout/      # app shell: sidebar, top bar, search
│   ├── modals/      # issue and project details, create dialogs
│   └── …
├── services/        # Axios client, API modules, apiBase.js
├── store/           # Zustand stores
├── styles/arcade.css
├── hooks/  utils/
└── main.jsx
```

## Design

The visual system ("Arcade Cabinet": printed instruction card in light mode, phosphor screen in dark mode) is documented in [`DESIGN.md`](DESIGN.md).
