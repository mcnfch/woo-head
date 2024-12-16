import { NextRequest, NextResponse } from 'next/server';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

if (!process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY || !process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET) {
  throw new Error('Missing WooCommerce API credentials');
}

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL,
  consumerKey: process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY,
  consumerSecret: process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET,
  version: 'wc/v3'
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.billing || !body.shipping || !body.line_items) {
      return NextResponse.json(
        { error: 'Missing required order data' },
        { status: 400 }
      );
    }

    // Validate billing details
    const requiredBillingFields = ['first_name', 'last_name', 'email', 'phone', 'address_1', 'city', 'state', 'postcode', 'country'];
    const missingBillingFields = requiredBillingFields.filter(field => !body.billing[field]);
    if (missingBillingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required billing fields: ${missingBillingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate shipping details
    const requiredShippingFields = ['first_name', 'last_name', 'address_1', 'city', 'state', 'postcode', 'country'];
    const missingShippingFields = requiredShippingFields.filter(field => !body.shipping[field]);
    if (missingShippingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required shipping fields: ${missingShippingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate line items
    if (!Array.isArray(body.line_items) || body.line_items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    for (const item of body.line_items) {
      if (!item.product_id || !item.quantity) {
        return NextResponse.json(
          { error: 'Each line item must have a product ID and quantity' },
          { status: 400 }
        );
      }
    }

    // Create the order with processing status since payment will be confirmed
    const orderData = {
      ...body,
      status: 'processing', // Set status to processing since payment will be confirmed
    };

    const { data: order } = await api.post('orders', orderData);

    if (!order || !order.id) {
      throw new Error('Failed to create order in WooCommerce');
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An error occurred while creating the order'
      },
      { status: 500 }
    );
  }
}
