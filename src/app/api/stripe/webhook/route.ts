import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/server/db';
import { headers } from 'next/headers';

// These are the new way to configure API routes in Next.js 14
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getRawBody(req: NextRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  
  for await (const chunk of req.body as any) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const { userId, credits } = session.metadata;

      // Update user credits
      await db.user.update({
        where: { id: userId },
        data: {
          credit: {
            increment: parseInt(credits),
          },
        },
      });

      // Record the transaction - commented out until your schema includes this model
      // await db.stripeTransaction.create({
      //   data: {
      //     userId,
      //     credits: parseInt(credits),
      //   },
      // });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 400 }
    );
  }
} 