import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

if (!process.env.STRIPE_SECRET_KEY_TEST) {
  throw new Error('Missing STRIPE_SECRET_KEY_TEST');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
  appInfo: {
    name: 'WooCommerce Next.js Store',
    version: '1.0.0'
  }
});

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();
    const { amount, currency = 'usd', orderId } = body;

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Create payment intent with explicit API version
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        orderId: orderId.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      }
    }, {
      apiVersion: '2023-10-16'
    });

    if (!paymentIntent || !paymentIntent.client_secret) {
      throw new Error('Failed to create payment intent');
    }

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An error occurred while creating payment intent'
      },
      { status: 500 }
    );
  }
}

export function generateStaticParams() {
  return [];
}
