# Repository Guidelines

## Project Structure & Module Organization
- `app/` — Next.js App Router code (Mini App UI). Pages live in `app/**/page.tsx`; API routes under `app/api/**/route.ts` (e.g., `app/api/webhook/route.ts`).
- `app/components/` — Reusable React components (PascalCase files, e.g., `FruitNinja.tsx`).
- `app/lib/` — Lightweight utilities (e.g., `telegram.ts`).
- `public/` — Static assets (e.g., `public/assets/sounds/*`).
- Root config: `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `vercel.json`.
- Note: `bot:*` scripts expect a `bot/` TypeScript folder; if missing, ignore or add when contributing.

## Build, Test, and Development Commands
- `npm run dev` — Start Next.js dev server on `localhost:3000`.
- `npm run build` — Production build (checks types, compiles app).
- `npm run start` — Start production server.
- `npm run lint` — Run ESLint (Next.js preset).
- Bot (optional): `npm run bot:dev`, `npm run bot:build`, `npm run bot:start`.
- Env: create `.env.local` with `BOT_TOKEN`, `WEBAPP_URL` (do not commit).

## Coding Style & Naming Conventions
- Language: TypeScript (strict mode enabled).
- Indentation: 2 spaces; use semicolons; prefer double quotes to match codebase.
- React components: PascalCase (`MyWidget.tsx`); hooks/utility modules: camelCase.
- App Router: pages as `app/**/page.tsx`; API handlers as `app/api/**/route.ts`.
- Imports: use `@/*` path alias from `tsconfig.json` where appropriate.

## Testing Guidelines
- No test suite is configured yet. If adding tests:
  - Unit: Vitest + Testing Library; name files `*.test.ts(x)` colocated with sources.
  - E2E: Playwright under `e2e/`; add `npm test`/`npm run e2e` scripts.
  - Keep fast, deterministic tests; add coverage thresholds once tests exist.

## Commit & Pull Request Guidelines
- Commits: imperative, concise subject (≤72 chars), optional body with rationale.
- Conventional Commits are welcome (e.g., `feat:`, `fix:`, `chore:`).
- PRs: include context, screenshots for UI changes, clear test steps, and link issues.
- Keep diffs focused; update README or inline docs when behavior changes.

## Security & Configuration Tips
- Never commit secrets. Use `.env.local` for `BOT_TOKEN` and dynamic `WEBAPP_URL` (e.g., ngrok).
- For local Telegram testing, expose `localhost:3000` via HTTPS and restart the bot when `WEBAPP_URL` changes.
