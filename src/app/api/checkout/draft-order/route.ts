import { NextResponse } from 'next/server';
import { createDraftOrder } from '@/lib/woocommerce';
import type { CreateDraftOrderRequest } from '@/lib/types/order';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json();
    console.log('[API] Received order request:', JSON.stringify(body, null, 2));

    // Transform the request body to match WooCommerce API structure
    const orderData: CreateDraftOrderRequest = {
      status: 'processing',  // Use processing for dropshipping workflow
      billing: {
        first_name: body.billing.first_name,
        last_name: body.billing.last_name,
        address_1: body.billing.address_1,
        address_2: body.billing.address_2,
        city: body.billing.city,
        state: body.billing.state,
        postcode: body.billing.postcode,
        country: body.billing.country,
        email: body.billing.email,
        phone: body.billing.phone,
      },
      shipping: {
        first_name: body.shipping.first_name,
        last_name: body.shipping.last_name,
        address_1: body.shipping.address_1,
        address_2: body.shipping.address_2,
        city: body.shipping.city,
        state: body.shipping.state,
        postcode: body.shipping.postcode,
        country: body.shipping.country,
      },
      line_items: body.line_items,
      payment_method: body.payment_method,
      payment_method_title: body.payment_method_title,
    };

    // Validate the order data
    if (!orderData.billing || !orderData.line_items || orderData.line_items.length === 0) {
      console.error('[API] Invalid order data:', orderData);
      return NextResponse.json(
        { error: 'Invalid order data - missing required fields' },
        { status: 400 }
      );
    }

    // Create the draft order
    try {
      const order = await createDraftOrder(orderData);
      return NextResponse.json({ order }, { status: 201 });
    } catch (error: any) {
      console.error('[API] WooCommerce error:', error?.response?.data || error);
      return NextResponse.json(
        { 
          error: 'Failed to create draft order',
          details: error?.response?.data || error.message
        },
        { status: error?.response?.status || 500 }
      );
    }
  } catch (error) {
    console.error('[API] Error creating draft order:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
