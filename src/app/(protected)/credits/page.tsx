'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

const pricingPlans = [
  {
    name: 'Basic',
    description: 'Perfect for getting started with AI',
    price: '$5',
    credits: 100,
    features: ['100 AI credits', 'Basic question support', 'Standard response time'],
    priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
  },
  {
    name: 'Pro',
    description: 'For power users who need more AI',
    price: '$20',
    credits: 500,
    features: ['500 AI credits', 'Priority support', 'Faster response time'],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  },
  {
    name: 'Enterprise',
    description: 'For teams with heavy AI usage',
    price: '$50',
    credits: 1500,
    features: ['1500 AI credits', 'Premium support', 'Instant response time'],
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
  },
]

export default function CreditsPage() {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handlePurchase = async (priceId: string | undefined, credits: number) => {
    if (!priceId) {
      toast.error('Price ID not configured. Please contact support.')
      return
    }

    setIsLoading(priceId)
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          creditAmount: credits,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast.error('Failed to create checkout session')
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col items-center text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Buy AI Credits</h1>
        <p className="text-muted-foreground mt-2">
          Purchase credits to ask questions about your repositories and process meetings
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-3">
        {pricingPlans.map((plan) => (
          <Card key={plan.name} className="flex flex-col">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-4">
                <p className="text-4xl font-bold">{plan.price}</p>
                <p className="text-sm text-muted-foreground">{plan.credits} credits</p>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="mr-2 h-4 w-4 text-primary"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handlePurchase(plan.priceId, plan.credits)}
                disabled={isLoading === plan.priceId}
              >
                {isLoading === plan.priceId ? 'Loading...' : 'Purchase Credits'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
} 