import { Markup, Telegraf } from 'telegraf';
import type { Context } from 'telegraf';
import type { Update } from 'telegraf/types';

export type BotContext = Context<Update>;

// Local constants - not exported to comply with Next.js API route requirements
const BOT_TOKEN = process.env.BOT_TOKEN ?? '';
const WEBAPP_URL = process.env.WEBAPP_URL ?? 'http://localhost:3000';
const PROVIDER_TOKEN = process.env.PAYMENT_PROVIDER_TOKEN;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function registerHandlers(bot: Telegraf<BotContext>) {
  bot.catch((error, ctx) => {
    console.error('Unhandled bot error', {
      updateId: ctx.update.update_id,
      error,
    });
  });

  bot.command('start', async (ctx) => {
    const chatId = ctx.chat?.id;
    const encodedChatId = chatId ? Buffer.from(String(chatId)).toString('base64') : '';
    const webAppUrl = encodedChatId ? `${WEBAPP_URL}?startapp=${encodedChatId}` : WEBAPP_URL;

    await ctx.reply(
      'Welcome to another fantastic fruit slicer bot! 🍉🍓🍍.',
      Markup.inlineKeyboard([
        [Markup.button.url('play now', webAppUrl)]
      ]),
    );
  });

  bot.command('webapp', async (ctx) => {
    const chatId = ctx.chat?.id;
    const encodedChatId = chatId ? Buffer.from(String(chatId)).toString('base64') : '';
    const webAppUrl = encodedChatId ? `${WEBAPP_URL}?startapp=${encodedChatId}` : WEBAPP_URL;

    await ctx.reply(
      'Open the Task Board web app.',
      Markup.inlineKeyboard([[Markup.button.url('Open Task Board', webAppUrl)]]),
    );
  });
}
const globalState = globalThis as typeof globalThis & {
  taskBoardBot?: Telegraf<BotContext>;
};

function getBotInstance(onFirstCreate?: (bot: Telegraf<BotContext>) => void) {
  if (!globalState.taskBoardBot) {
    const bot = new Telegraf<BotContext>(BOT_TOKEN);
    if (onFirstCreate) {
      onFirstCreate(bot);
    }
    globalState.taskBoardBot = bot;
  }

  return globalState.taskBoardBot;
}

const bot = getBotInstance(registerHandlers);

export async function POST(request: Request) {
  try {
    const update = (await request.json()) as Update;
    await bot.handleUpdate(update);
    return new Response('OK');
  } catch (error) {
    console.error('Error processing webhook update', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function GET() {
  return new Response('Telegram webhook is healthy.', { status: 200 });
}
