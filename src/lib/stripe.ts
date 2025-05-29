'use server'
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { loadStripe, Stripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

let stripePromise: Promise<Stripe | null>;

// Client-side Stripe promise
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

export async function creditCheckoutSession(credits: number){
  const {userId} = await auth()
  if(!userId){
    throw new Error('Unauthorized')
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${credits} Credits`,
          },
          unit_amount: Math.round(credits/50) * 100, 
        },
        quantity: 1,
      },
    ],
    customer_creation: 'always',
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/create`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/billing`,
    client_reference_id: userId.toString(),
    metadata: {
      credits
    },
  });

  return redirect(session.url!);
}