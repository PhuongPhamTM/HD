# Handong Content Hub

Next.js 16 dashboard rebuilt from the original single-file content studio. It includes the Jan–Oct 2026 tracker snapshot, English UI, local-first editing, dark mode, authenticated routes, reports, calendar, exports, and optional Google Apps Script sync.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Without environment configuration, local demo access is:

- Email: `admin@handong.local`
- Password: `handong`

Copy `.env.example` to `.env.local` and set `SESSION_SECRET` and `HUB_USERS` before deployment.

## Verify

```bash
pnpm test
pnpm typecheck
pnpm build
```

`pnpm build` uses webpack because Turbopack's CSS worker cannot bind its internal port in some sandboxed environments.
