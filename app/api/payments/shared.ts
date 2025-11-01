import { Telegraf } from 'telegraf';
import type { Context, Update } from 'telegraf';

export type BotContext = Context<Update>;
export type PlanId = 'demo' | 'sticker' | 'basic' | 'premium' | 'enterprise';

export interface PaymentPlan {
  id: PlanId;
  command: string;
  title: string;
  description: string;
  priceStars: number;
  features: string[];
  startParameter?: string;
  isDemo?: boolean;
}

export interface PaymentPayload {
  planId: PlanId;
  userId: number;
  timestamp: number;
  isDemo?: boolean;
}

export const BOT_TOKEN = process.env.BOT_TOKEN ?? '';
export const WEBAPP_URL = process.env.WEBAPP_URL ?? 'http://localhost:3000';
export const PROVIDER_TOKEN = process.env.PAYMENT_PROVIDER_TOKEN;
export const VIEW_PLAN_CALLBACK = 'view_plan';

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN environment variable is required');
}

export const ALL_PLANS: PaymentPlan[] = [
  {
    id: 'demo',
    command: 'demo_payment',
    title: 'Demo Purchase',
    description: 'Simulate a one star test payment. No real funds move.',
    priceStars: 1,
    features: ['Demo transaction for sandbox testing', 'Immediate success flow'],
    startParameter: 'demo-stars',
    isDemo: true,
  },
  {
    id: 'sticker',
    command: 'buy_sticker',
    title: 'Task Board Sticker Pack',
    description: 'Collectible holographic Task Board stickers shipped to your door.',
    priceStars: 10,
    features: [
      'Limited edition 3-piece sticker pack',
      'Ships within 5 business days (demo)',
      'Perfect for laptops and notebooks',
    ],
    startParameter: 'sticker-pack',
  },
  {
    id: 'basic',
    command: 'buy_basic',
    title: 'Basic Plan',
    description: '100 tasks per month, 2 custom themes, email support.',
    priceStars: 50,
    features: ['100 tasks limit', '2 custom themes', 'Email support'],
  },
  {
    id: 'premium',
    command: 'buy_premium',
    title: 'Premium Plan',
    description: 'Unlimited tasks, all themes, priority support, analytics.',
    priceStars: 100,
    features: ['Unlimited tasks', 'All custom themes', 'Priority support', 'Advanced analytics'],
  },
  {
    id: 'enterprise',
    command: 'buy_enterprise',
    title: 'Enterprise Plan',
    description: 'Premium features plus team collaboration, API access, dedicated support.',
    priceStars: 250,
    features: [
      'Everything in Premium',
      'Team collaboration (10 users)',
      'API access',
      'Dedicated support manager',
    ],
  },
];

export const plansByCommand = new Map<string, PaymentPlan>();
export const plansById = new Map<PlanId, PaymentPlan>();

for (const plan of ALL_PLANS) {
  plansByCommand.set(plan.command, plan);
  plansById.set(plan.id, plan);
}

const globalState = globalThis as typeof globalThis & {
  taskBoardBot?: Telegraf<BotContext>;
};

export function getBotInstance(onFirstCreate?: (bot: Telegraf<BotContext>) => void) {
  if (!globalState.taskBoardBot) {
    const bot = new Telegraf<BotContext>(`${BOT_TOKEN}/test`);
    if (onFirstCreate) {
      onFirstCreate(bot);
    }
    globalState.taskBoardBot = bot;
  }

  return globalState.taskBoardBot;
}

export function buildPaymentPayload(plan: PaymentPlan, userId: number): PaymentPayload {
  return {
    planId: plan.id,
    userId,
    timestamp: Date.now(),
    isDemo: Boolean(plan.isDemo),
  };
}

export function buildInvoiceRequest(plan: PaymentPlan, userId: number) {
  const payload = buildPaymentPayload(plan, userId);

  const invoice = {
    title: plan.title,
    description: plan.description,
    payload: JSON.stringify(payload),
    currency: 'XTR',
    prices: [{ label: plan.title, amount: plan.priceStars }],
    ...(plan.startParameter ? { start_parameter: plan.startParameter } : {}),
    ...(PROVIDER_TOKEN ? { provider_token: PROVIDER_TOKEN } : {}),
  };

  return invoice;
}
