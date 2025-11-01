import { Markup, Telegraf } from 'telegraf';
import type { Update } from 'telegraf';
import {
  ALL_PLANS,
  type BotContext,
  type PlanId,
  type PaymentPayload,
  VIEW_PLAN_CALLBACK,
  WEBAPP_URL,
  buildInvoiceRequest,
  getBotInstance,
  plansById,
} from '../payments/shared';

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
      'Welcome to Task Board. Use the buttons below to open the mini app or review premium plans.',
      Markup.inlineKeyboard([
        [Markup.button.url('Open Task Board', webAppUrl)],
        [Markup.button.callback('View Plans', VIEW_PLAN_CALLBACK)],
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

  bot.command('payments', async (ctx) => {
    await ctx.reply(formatPlanList());
  });

  for (const plan of ALL_PLANS) {
    bot.command(plan.command, async (ctx) => {
      await sendInvoiceForPlan(ctx, plan.id);
    });
  }

  bot.on('pre_checkout_query', async (ctx) => {
    const payload = parsePayload(ctx.preCheckoutQuery?.invoice_payload);

    if (!payload) {
      console.warn('Rejecting pre-checkout due to invalid payload', ctx.preCheckoutQuery);
      await ctx.answerPreCheckoutQuery(false, 'Invalid order data. Please try again.');
      return;
    }

    const plan = plansById.get(payload.planId);
    if (!plan) {
      console.warn('Rejecting pre-checkout due to unknown plan', payload);
      await ctx.answerPreCheckoutQuery(false, 'Selected plan is no longer available.');
      return;
    }

    if (payload.userId !== ctx.from?.id) {
      console.warn('Payload user mismatch', {
        payloadUserId: payload.userId,
        fromId: ctx.from?.id,
      });
    }

    console.info('Approved pre-checkout query', {
      userId: payload.userId,
      planId: payload.planId,
      isDemo: Boolean(payload.isDemo),
    });

    await ctx.answerPreCheckoutQuery(true);
  });

  bot.on('successful_payment', async (ctx) => {
    const payment = ctx.message?.successful_payment;
    if (!payment) {
      return;
    }

    const payload = parsePayload(payment.invoice_payload);
    const plan = payload ? plansById.get(payload.planId) : undefined;
    const planTitle = plan?.title ?? 'Selected plan';
    const totalStars = payment.total_amount ?? 0;
    const confirmationMessage = buildSuccessMessage({
      planTitle,
      totalStars,
      chargeId: payment.telegram_payment_charge_id,
      isDemo: payload?.isDemo ?? false,
    });

    console.info('Payment completed', {
      planId: plan?.id,
      isDemo: payload?.isDemo ?? false,
      totalStars,
      chargeId: payment.telegram_payment_charge_id,
      providerChargeId: payment.provider_payment_charge_id,
    });

    await ctx.reply(
      confirmationMessage,
      Markup.inlineKeyboard([
        [Markup.button.url('Open Task Board', WEBAPP_URL)],
        [Markup.button.callback('View Plan Status', VIEW_PLAN_CALLBACK)],
      ]),
    );
  });

  bot.on('refunded_payment', async (ctx) => {
    const refund = ctx.message?.refunded_payment;
    if (!refund) {
      return;
    }

    const payload = parsePayload(refund.invoice_payload);
    const plan = payload ? plansById.get(payload.planId) : undefined;
    const totalStars = refund.total_amount ?? 0;
    const lines = [
      'Refund processed.',
      plan ? `Plan: ${plan.title}` : undefined,
      `Amount: ${totalStars} Stars`,
      refund.telegram_payment_charge_id
        ? `Transaction ID: ${refund.telegram_payment_charge_id}`
        : undefined,
      'Funds have been returned to your balance.',
    ].filter(Boolean) as string[];

    console.info('Payment refunded', {
      planId: plan?.id,
      totalStars,
      chargeId: refund.telegram_payment_charge_id,
    });

    await ctx.reply(lines.join('\n'));
  });

  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery?.data;

    if (data === VIEW_PLAN_CALLBACK) {
      await ctx.answerCbQuery();
      await ctx.reply(
        'Your premium plan is active in test mode. Use /payments to review options or /demo_payment to trigger a sandbox payment.',
      );
      return;
    }

    await ctx.answerCbQuery();
  });

}

function formatPlanList(): string {
  const lines: string[] = ['Available premium plans:\n'];
  const paidPlans = ALL_PLANS.filter((plan) => !plan.isDemo);

  paidPlans.forEach((plan, index) => {
    lines.push(`${index + 1}. ${plan.title} (${plan.priceStars} Stars)`);
    plan.features.forEach((feature) => lines.push(`   - ${feature}`));
    lines.push(`   Command: /${plan.command}\n`);
  });

  lines.push(
    'Need a sandbox run? Send /demo_payment to trigger a one star demo transaction.',
  );
  lines.push('Test mode is enabled, so no real balances are affected.');

  return lines.join('\n');
}

async function sendInvoiceForPlan(ctx: BotContext, planId: PlanId) {
  const chatId = ctx.chat?.id;
  if (!chatId) {
    console.warn('Cannot send invoice without chat id', { planId });
    return;
  }

  const plan = plansById.get(planId);
  if (!plan) {
    console.warn('Requested invoice for unknown plan', { planId });
    await ctx.reply('That item is no longer available.');
    return;
  }

  const invoice = buildInvoiceRequest(plan, chatId);

  await ctx.replyWithInvoice(invoice);

  console.info('Invoice sent', {
    planId: plan.id,
    chatId,
    isDemo: Boolean(plan.isDemo),
  });
}

function parsePayload(rawPayload: string | undefined): PaymentPayload | null {
  if (!rawPayload) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawPayload) as Partial<PaymentPayload>;
    if (typeof parsed.planId !== 'string' || !plansById.has(parsed.planId as PlanId)) {
      return null;
    }

    if (typeof parsed.userId !== 'number' || typeof parsed.timestamp !== 'number') {
      return null;
    }

    return {
      planId: parsed.planId as PlanId,
      userId: parsed.userId,
      timestamp: parsed.timestamp,
      isDemo: Boolean(parsed.isDemo),
    };
  } catch (error) {
    console.warn('Unable to parse invoice payload', { error, rawPayload });
    return null;
  }
}

function buildSuccessMessage(options: {
  planTitle: string;
  totalStars: number;
  chargeId?: string;
  isDemo: boolean;
}): string {
  const lines = [
    options.isDemo ? 'Demo payment confirmed.' : 'Payment confirmed.',
    `Plan: ${options.planTitle}`,
    `Total: ${options.totalStars} Stars`,
    options.chargeId ? `Transaction ID: ${options.chargeId}` : undefined,
    '',
    'Premium features are now active. Enjoy your upgraded workspace!',
  ].filter(Boolean) as string[];

  return lines.join('\n');
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
