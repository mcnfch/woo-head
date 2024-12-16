import { NextRequest, NextResponse } from 'next/server';
import { cartService } from '@/lib/woocommerce/cart';
import { woocommerce } from '@/lib/woocommerce';
import { getCategories } from '@/lib/woocommerce';

// Define all possible API endpoints
type Endpoint = 
  | 'cart.add'
  | 'cart.update'
  | 'cart.remove'
  | 'cart.applyCoupon'
  | 'products.list'
  | 'products.get'
  | 'products.variations'
  | 'products.variation'
  | 'categories.list'
  | 'navigation.get'
  | 'orders.create'
  | 'orders.update'
  | 'orders.get'
  | 'orders.list';

interface ApiRequest {
  endpoint: Endpoint;
  payload?: Record<string, unknown>;
  params?: Record<string, string>;
}

async function handleCartRequests(endpoint: string, payload: Record<string, unknown>) {
  const service = cartService;
  switch (endpoint) {
    case 'cart.add': {
      const product_id = payload.product_id as number;
      const quantity = payload.quantity as number;
      if (!product_id || typeof quantity === 'undefined') {
        throw new Error('Invalid cart add payload');
      }
      return await service.addToCart({ product_id, quantity });
    }
    case 'cart.update': {
      const product_id = payload.product_id as number;
      const quantity = payload.quantity as number;
      if (!product_id || typeof quantity === 'undefined') {
        throw new Error('Invalid cart update payload');
      }
      return await service.updateQuantity(product_id, quantity);
    }
    case 'cart.remove': {
      const product_id = payload.product_id as number;
      if (!product_id) {
        throw new Error('Invalid cart remove payload');
      }
      return await service.removeItem(product_id);
    }
    case 'cart.applyCoupon': {
      const code = payload.code as string;
      if (!code) {
        throw new Error('Invalid coupon code');
      }
      throw new Error('Coupon functionality not implemented');
    }
    default:
      throw new Error('Invalid cart endpoint');
  }
}

async function handleProductRequests(endpoint: string, params: Record<string, string>, _payload: Record<string, unknown>) {
  switch (endpoint) {
    case 'products.list':
      // Convert category parameter to a number if it exists
      if (params.category) {
        params.category = params.category.toString();
      }
      return await woocommerce.get('products', params).then(response => response.data);
    case 'products.get':
      const { id } = params;
      return await woocommerce.get(`products/${id}`).then(response => response.data);
    case 'products.variations':
      const { productId } = params;
      return await woocommerce.get(`products/${productId}/variations`).then(response => response.data);
    case 'products.variation':
      const { productId: pid, variationId } = params;
      return await woocommerce.get(`products/${pid}/variations/${variationId}`).then(response => response.data);
    default:
      throw new Error('Invalid product endpoint');
  }
}

async function handleCategoryRequests(endpoint: string) {
  switch (endpoint) {
    case 'categories.list':
      return await getCategories();
    default:
      throw new Error('Invalid category endpoint');
  }
}

async function handleNavigationRequests(endpoint: string) {
  switch (endpoint) {
    case 'navigation.get':
      return await getCategories();
    default:
      throw new Error('Invalid navigation endpoint');
  }
}

async function handleOrderRequests(endpoint: string, payload: Record<string, unknown>, params: Record<string, string>) {
  try {
    switch (endpoint) {
      case 'orders.create': {
        const response = await woocommerce.post('orders', payload);
        return response.data;
      }
      case 'orders.update': {
        const orderId = params.orderId;
        if (!orderId) {
          throw new Error('Order ID is required');
        }
        const response = await woocommerce.put(`orders/${orderId}`, payload);
        return response.data;
      }
      case 'orders.get': {
        const orderId = params.orderId;
        if (!orderId) {
          throw new Error('Order ID is required');
        }
        const response = await woocommerce.get(`orders/${orderId}`);
        return response.data;
      }
      case 'orders.list': {
        const response = await woocommerce.get('orders', {
          per_page: 100,
          orderby: 'date',
          order: 'desc'
        });
        return response.data;
      }
      default:
        throw new Error(`Unknown order endpoint: ${endpoint}`);
    }
  } catch (error) {
    console.error('WooCommerce API Error:', error);
    throw error;
  }
}

async function handlePaymentRequests(endpoint: string, _payload: Record<string, unknown>) {
  switch (endpoint) {
    default:
      throw new Error('Invalid payment endpoint');
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const { endpoint, payload = {}, params: requestParams = {} } = await request.json() as ApiRequest;

    // Validate WooCommerce configuration
    if (
      !process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY ||
      !process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET ||
      !process.env.NEXT_PUBLIC_WOOCOMMERCE_URL
    ) {
      return NextResponse.json(
        { error: 'WooCommerce configuration missing' },
        { status: 500 }
      );
    }

    let result;
    const [domain] = endpoint.split('.');

    switch (domain) {
      case 'cart':
        result = await handleCartRequests(endpoint, payload);
        break;
      case 'products':
        result = await handleProductRequests(endpoint, requestParams, payload);
        break;
      case 'categories':
        result = await handleCategoryRequests(endpoint);
        break;
      case 'orders':
        result = await handleOrderRequests(endpoint, payload, requestParams);
        break;
      case 'payment':
        result = await handlePaymentRequests(endpoint, payload);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid endpoint' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint')?.toLowerCase();
    const orderId = searchParams.get('orderId');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    let result;
    const [resource, action] = endpoint.split('.');

    switch (resource) {
      case 'products':
        const searchParamsObj = Object.fromEntries(searchParams.entries());
        result = await handleProductRequests(endpoint, searchParamsObj, {});
        break;
      case 'categories':
        result = await handleCategoryRequests(endpoint);
        break;
      case 'navigation':
        result = await handleNavigationRequests(endpoint);
        break;
      case 'orders':
        result = await handleOrderRequests(endpoint, {}, { orderId: orderId || '' });
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid endpoint' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
