# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Telegram Mini App built with Next.js 15 that integrates with Telegram bots. The app includes a game component (Fruit Ninja) and Telegram Stars payment integration for in-app purchases.

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
PAYMENT_PROVIDER_TOKEN=optional_for_payments
```

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

- **Webhook Handler** (`app/api/webhook/route.ts`): Receives Telegram updates, processes commands (`/start`, `/webapp`, `/payments`), handles payment flows (pre-checkout, successful_payment, refunded_payment)
- **Shared Bot Logic** (`app/api/payments/shared.ts`): Singleton bot instance using `getBotInstance()`, payment plans configuration, bot token appended with `/test` for Telegram Stars test mode
- **Invoice Creation** (`app/api/payments/invoice/route.ts`): Generates payment invoice links for in-app purchases

**Critical:** The bot token uses `/test` suffix (`new Telegraf(BOT_TOKEN + '/test')`) to enable Telegram Stars test mode. This affects all payment operations.

### Mini App Frontend

- **Entry Point** (`app/page.tsx`): Initializes Telegram WebApp SDK, retrieves user data from launch params, handles fullscreen/orientation locks, implements pull-to-refresh prevention for mobile
- **Telegram SDK**: Uses `@telegram-apps/sdk-react` for launch params and native `telegram-web-app` script loaded in layout
- **WebApp Script**: Loaded via `<script src="https://telegram.org/js/telegram-web-app.js">` in `app/layout.tsx`
- **Haptic Feedback**: Integrated throughout UI for native app feel

### Payment Flow

1. User taps "Buy Sticker Pack" in Mini App
2. Frontend calls `POST /api/payments/invoice` with `planId` and `userId`
3. API creates invoice link via Telegram Bot API
4. Frontend opens invoice using `webApp.openInvoice(invoiceUrl, callback)`
5. Telegram processes payment (test mode via `/test` suffix)
6. Webhook receives `pre_checkout_query` → validates → answers
7. Webhook receives `successful_payment` → confirms in chat
8. Refunds handled via `refunded_payment` webhook event

### Key Components

- **FruitNinja Component** (`app/components/FruitNinja.tsx`): Game implementation
- **Task Components** (`app/components/TaskForm.tsx`, `TaskList.tsx`, `TaskItem.tsx`): Task board UI (appears unused in current main page)
- **Telegram Helper** (`app/lib/telegram.ts`): Utility to access `window.Telegram?.WebApp`

## Important Implementation Details

### Next.js Configuration
- **Cache Headers** (`next.config.ts`): All routes return `no-cache` headers to prevent stale Mini App states
- **Viewport Settings** (`app/layout.tsx`): Disables user scaling and sets maximum scale to 1 for app-like experience

### Bot Token Test Mode
The bot instance is created with `/test` suffix for all operations:
```typescript
new Telegraf<BotContext>(`${BOT_TOKEN}/test`)
```
This enables Telegram Stars test payments without real transactions.

### Payment Plans
Defined in `app/api/payments/shared.ts`:
- `demo`: 1 Star (test payment)
- `sticker`: 10 Stars (current main offering)
- `basic`: 50 Stars
- `premium`: 100 Stars
- `enterprise`: 250 Stars

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

- ngrok URLs change on restart - update `.env.local` and restart bot when this happens
- Telegram WebApp only works inside Telegram - show fallback message for web browsers
- Payment provider token is optional - Stars payments work without it in test mode
- Invoice payload must be valid JSON with `planId`, `userId`, `timestamp` for validation
