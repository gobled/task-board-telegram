import { type PlanId, buildInvoiceRequest, getBotInstance, plansById } from '../shared';

export const runtime = 'nodejs';

interface InvoiceRequestBody {
  planId: PlanId;
  userId: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<InvoiceRequestBody>;
    if (!body?.planId || typeof body.planId !== 'string') {
      return new Response(JSON.stringify({ error: 'planId is required' }), { status: 400 });
    }

    const plan = plansById.get(body.planId as PlanId);
    if (!plan) {
      return new Response(JSON.stringify({ error: 'Unknown plan' }), { status: 404 });
    }

    if (typeof body.userId !== 'number') {
      return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400 });
    }

    const bot = getBotInstance();
    const invoice = buildInvoiceRequest(plan, body.userId);
    const invoiceUrl = await bot.telegram.createInvoiceLink(invoice);

    return new Response(JSON.stringify({ invoiceUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to create invoice link', error);
    return new Response(JSON.stringify({ error: 'Unable to create invoice link' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
