import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY_TEST) {
  throw new Error('Missing STRIPE_SECRET_KEY_TEST');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }

    // Validate that we have the order ID in metadata
    if (!paymentIntent.metadata?.orderId) {
      throw new Error('No order ID found in payment intent metadata');
    }

    return NextResponse.json({
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
    });
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    
    // Handle Stripe errors specifically
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to retrieve payment status'
      },
      { status: 500 }
    );
  }
}
