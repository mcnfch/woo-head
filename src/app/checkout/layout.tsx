'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions, Appearance } from '@stripe/stripe-js';
import stripePromise from '@/lib/stripe';
import { useCart } from '@/context/CartContext';

const appearance: Appearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#6366f1',
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { cart } = useCart();
  
  // Ensure we have a valid amount
  const amount = cart?.subtotal ? Math.round(cart.subtotal * 100) : 100; // Default to $1.00 if no amount

  const options: StripeElementsOptions = {
    mode: 'payment',
    amount,
    currency: 'usd',
    appearance,
    payment_method_types: ['card']
  };

  if (!cart) {
    return null; // Don't render until cart is loaded
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
