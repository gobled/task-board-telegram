const { Telegraf, Markup } = require('telegraf');
const { BOT_TOKEN, WEBAPP_URL, DIRECT_LINK } = require('./config');

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN must be provided!');
}

const bot = new Telegraf(BOT_TOKEN);

// Basic commands
async function sendWebAppButton(ctx: any, message = 'Open the Mini App to get started!') {
  const chatId = ctx.chat.id;
  const encodedChatId = Buffer.from(chatId.toString()).toString('base64');
  const url = `${WEBAPP_URL}?startapp=${encodedChatId}`;

  console.log('Chat ID:', chatId);
  console.log('Encoded Group ID:', encodedChatId);

  try {
    await ctx.telegram.setChatMenuButton({
      type: 'web_app',
      text: 'Open App',
      web_app: { url },
    });
  } catch (error) {
    console.warn('Unable to set default menu button:', error);
  }

  try {
    await ctx.telegram.setChatMenuButton(chatId, {
      type: 'web_app',
      text: 'Open App',
      web_app: { url },
    });
  } catch (error) {
    console.warn('Unable to set chat-specific menu button:', error);
  }

  // Create keyboard with both Web App button and Direct Link button
  const buttons = [Markup.button.webApp('Open', url)];

  // Add direct link button if DIRECT_LINK is configured
  if (DIRECT_LINK) {
    buttons.push(Markup.button.url('Open', DIRECT_LINK));
  }

  const keyboard = Markup.inlineKeyboard(buttons);

  await ctx.reply(message, keyboard);
}

bot.command('start', async (ctx: any) => {
  await sendWebAppButton(ctx, 'Welcome to TaskVaultBot! 🚀\nTap the button below to launch the Mini App.');
});

bot.command('help', (ctx: any) => {
  ctx.reply(
    'Available commands:\n' +
    '/start - Start the bot\n' +
    '/help - Show this help message\n' +
    '/webapp - Open the Mini App'
  );
});

bot.command('webapp', async (ctx: any) => {
  await sendWebAppButton(ctx, 'Here you go 👇');
});

bot.launch().then(() => {
  console.log('Bot is running...');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
