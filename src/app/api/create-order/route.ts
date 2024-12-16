import { NextResponse } from 'next/server';
import { woocommerce } from '@/lib/woocommerce';

export async function POST(request: Request) {
  try {
    const orderData = await request.json();

    // Create order in WooCommerce
    const response = await woocommerce.post('orders', orderData);
    const order = response.data;

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
