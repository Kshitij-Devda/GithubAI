import { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { getStripe } from '@/lib/stripe';

const CREDIT_OPTIONS = [
  { amount: 100, price: 10 },
  { amount: 500, price: 45 },
  { amount: 1500, price: 120 },
];

export function CreditPurchase() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async (credits: number) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credits }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 p-4">
      <h2 className="text-2xl font-bold text-center">Purchase Credits</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {CREDIT_OPTIONS.map(({ amount, price }) => (
          <div
            key={amount}
            className="flex flex-col items-center p-6 space-y-4 border rounded-lg shadow-sm hover:border-primary transition-colors"
          >
            <h3 className="text-xl font-semibold">{amount} Credits</h3>
            <p className="text-3xl font-bold">${price}</p>
            <p className="text-sm text-muted-foreground">
              ${(price / amount).toFixed(2)} per credit
            </p>
            <Button
              onClick={() => handlePurchase(amount)}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Processing...' : 'Purchase'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 