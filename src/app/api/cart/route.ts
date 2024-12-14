import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    let response;
    
    if (data.endpoint === 'cart.add') {
      response = await api.cart.add(data.payload);
    } else if (data.endpoint === 'cart.update') {
      response = await api.cart.update(data.payload);
    } else if (data.endpoint === 'cart.remove') {
      response = await api.cart.remove(data.payload);
    } else {
      throw new Error('Invalid cart operation');
    }
    
    return NextResponse.json(response);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process cart request' },
      { status: 500 }
    );
  }
} 