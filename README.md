This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) with Telegram Mini App integration.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Telegram Bot Token (get it from [@BotFather](https://t.me/BotFather))
- ngrok or similar tunneling service for local development

### Environment Setup

1. Create a `.env.local` file in the root directory:

```env
BOT_TOKEN=your_bot_token_here
WEBAPP_URL=https://your-ngrok-url.ngrok.io
DIRECT_LINK=https://your-ngrok-url.ngrok.io
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Developing Telegram Mini Apps Locally

Developing Telegram Mini Apps requires your app to be accessible via HTTPS. Here's how to set up your local development environment:

#### Step 1: Start the Next.js Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Your app will be available at [http://localhost:3000](http://localhost:3000).

#### Step 2: Expose Your Local Server with ngrok

Since Telegram requires HTTPS URLs for Mini Apps, you need to expose your local server:

1. Install [ngrok](https://ngrok.com/download) or use an alternative like [localtunnel](https://localtunnel.github.io/www/)

2. Run ngrok to create a tunnel to your local server:

```bash
ngrok http 3000
```

3. Copy the HTTPS URL provided by ngrok (e.g., `https://abc123.ngrok.io`)

4. Update your `.env.local` file with the ngrok URL:

```env
WEBAPP_URL=https://abc123.ngrok.io
DIRECT_LINK=https://abc123.ngrok.io
```

#### Step 3: Start the Telegram Bot

In a new terminal window, start the bot:

```bash
npm run bot:dev
# or use the compiled version
npm run bot:build
npm run bot:start
```

#### Step 4: Test Your Mini App

1. Open Telegram and find your bot
2. Send the `/start` command
3. Click the "Open" button to launch your Mini App
4. The Mini App should open with your local development server

#### Development Tips

- **Hot Reload**: The Next.js dev server supports hot reload. Changes to your code will automatically reflect in the Mini App.
- **ngrok URL Changes**: Each time you restart ngrok, you'll get a new URL. Update your `.env.local` file and restart the bot when this happens.
- **Debugging**: Use browser DevTools in Telegram Desktop or the Telegram Web version for easier debugging.
- **Testing on Mobile**: The ngrok URL works on mobile devices too, so you can test on actual Telegram mobile apps.
- **Bot Menu Button**: The bot automatically sets up a menu button that appears in the chat. This makes it easy to reopen your Mini App.

#### Alternative: Using a Fixed Tunnel URL

For a more stable development experience, consider:
- ngrok paid plans (provides fixed URLs)
- [localhost.run](https://localhost.run/) (free, but URLs change)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) (free, fixed URLs)

### Project Structure

- `/app` - Next.js app directory (Mini App frontend)
- `/bot` - Telegram bot implementation using Telegraf
- `/bot/config.ts` - Bot configuration and environment variables
- `/bot/index.ts` - Bot commands and Web App button logic

### Available Commands

**Frontend (Mini App):**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

**Bot:**
- `npm run bot:dev` - Start bot in development mode
- `npm run bot:build` - Compile TypeScript bot code
- `npm run bot:start` - Start compiled bot

### Bot Commands

- `/start` - Initialize the bot and display the Mini App button
- `/help` - Show available commands
- `/webapp` - Open the Mini App

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
