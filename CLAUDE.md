# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Telegram Mini App built with Next.js 15 that integrates with Telegram bots. The app includes a game component (Pika Splash) and Telegram Stars payment integration for in-app purchases.

## Development Setup

### Prerequisites
- Node.js 18+
- Telegram Bot Token from @BotFather
- ngrok or similar tunneling service for local development (Telegram requires HTTPS)

### Environment Variables
Create `.env.local` with:
```
BOT_TOKEN=your_bot_token_here
WEBAPP_URL=https://your-ngrok-url.ngrok.io
TEST_MODE=true
PAYMENT_PROVIDER_TOKEN=optional_for_payments
```

**Important:**
- `TEST_MODE=true` enables Telegram test environment by appending `/test` to bot token (for test payments)
- `TEST_MODE=false` uses production environment
- See `.env.example` for reference

### Running the App

**Start Next.js dev server:**
```bash
npm run dev
```

**Expose local server via ngrok (required for Telegram):**
```bash
ngrok http 3000
```
Update `WEBAPP_URL` in `.env.local` with the ngrok HTTPS URL.

**Other commands:**
```bash
npm run build         # Production build
npm run start         # Production server
npm run lint          # Run ESLint
npm run bot:dev       # Run bot in development (TypeScript)
npm run bot:build     # Compile bot TypeScript
npm run bot:start     # Run compiled bot
```

## Architecture

### Dual Deployment Model
This app operates in two distinct runtime environments:

1. **Next.js App (Frontend & API Routes)** - Deployed to Vercel
   - Serves the Mini App UI at `app/page.tsx`
   - Provides webhook endpoint at `app/api/webhook/route.ts`
   - Handles payment invoice creation at `app/api/payments/invoice/route.ts`

2. **Standalone Bot** - Can run independently (not currently used)
   - Located in `/bot` directory (deprecated/not in use)
   - All bot logic now runs via API routes

### Bot Integration Architecture

The bot operates entirely through Next.js API routes, not as a separate process:

- **Webhook Handler** (`app/api/webhook/route.ts`): Receives Telegram updates, processes commands (`/start`, `/webapp`), singleton bot instance using `getBotInstance()`

**Test Mode:** When `TEST_MODE=true` environment variable is set, the bot token automatically gets `/test` suffix appended (`BOT_TOKEN + '/test'`) to enable Telegram test environment. This is useful for testing Telegram Stars payments without real transactions.

### Mini App Frontend

- **Entry Point** (`app/page.tsx`): Initializes Telegram WebApp SDK, retrieves user data from launch params, handles fullscreen/orientation locks, implements pull-to-refresh prevention for mobile
- **Telegram SDK**: Uses `@telegram-apps/sdk-react` for launch params and native `telegram-web-app` script loaded in layout
- **WebApp Script**: Loaded via `<script src="https://telegram.org/js/telegram-web-app.js">` in `app/layout.tsx`
- **Haptic Feedback**: Integrated throughout UI for native app feel

### Key Components

- **FruitNinja Component** (`app/components/FruitNinja.tsx`): Game implementation
- **Task Components** (`app/components/TaskForm.tsx`, `TaskList.tsx`, `TaskItem.tsx`): Task board UI (appears unused in current main page)
- **Telegram Helper** (`app/lib/telegram.ts`): Utility to access `window.Telegram?.WebApp`

## Important Implementation Details

### Next.js Configuration
- **Cache Headers** (`next.config.ts`): All routes return `no-cache` headers to prevent stale Mini App states
- **Viewport Settings** (`app/layout.tsx`): Disables user scaling and sets maximum scale to 1 for app-like experience

### Bot Token Test Mode
The bot token automatically gets `/test` suffix when `TEST_MODE=true` environment variable is set:
```typescript
const botToken = TEST_MODE ? `${BOT_TOKEN}/test` : BOT_TOKEN;
new Telegraf<BotContext>(botToken);
```
This enables Telegram test environment for testing features like Telegram Stars payments without real transactions.

### Mobile Optimizations
- Fullscreen mode requested via `webApp.requestFullscreen()`
- Orientation locked via `webApp.lockOrientation()`
- Pull-to-refresh disabled via touch event handling
- Close confirmation enabled via `webApp.enableClosingConfirmation()`

## Webhook Setup

To receive Telegram updates, configure your bot webhook to point to:
```
https://your-vercel-app.vercel.app/api/webhook
```

## Common Gotchas

- ngrok URLs change on restart - update `.env.local` and restart dev server when this happens
- Telegram WebApp only works inside Telegram - show fallback message for web browsers
- `TEST_MODE=true` is required for testing Telegram features without real transactions
- Bot will log whether it's running in TEST or PRODUCTION mode on initialization
