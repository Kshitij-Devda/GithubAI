import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/server/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error: any) {
      console.error('Error verifying webhook signature:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === 'checkout.session.completed') {
      // Handle successful checkout
      console.log('Checkout completed for session:', session.id);
      
      // Update user credits or subscription status
      if (session.metadata?.userId) {
        try {
          await db.user.update({
            where: {
              id: session.metadata.userId
            },
            data: {
              credit: {
                increment: parseInt(session.metadata.credits || '10')
              }
            }
          });
          console.log(`Added ${session.metadata.credits || '10'} credits to user ${session.metadata.userId}`);
        } catch (error) {
          console.error('Error updating user credits:', error);
          return NextResponse.json({ error: 'Failed to update user credits' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Unexpected error in webhook handler:', error);
    return NextResponse.json(
      { error: 'Unexpected error processing webhook' },
      { status: 500 }
    );
  }
}
