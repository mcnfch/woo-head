'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';

interface Order {
  id: number;
  total: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
  };
  line_items: Array<{
    name: string;
    quantity: number;
    total: string;
  }>;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Clear cart when success page loads
    const lastOrderId = localStorage.getItem('lastOrderId');
    if (lastOrderId === orderId) {
      localStorage.removeItem('lastOrderId');
      localStorage.removeItem('cart');
    }

    const fetchOrder = async () => {
      if (!orderId) {
        setError('No order ID found');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching order:', orderId);
        const response = await fetch(`/api/v1?endpoint=orders.get&orderId=${orderId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch order');
        }
        const orderData = await response.json();
        console.log('Order data:', orderData);
        setOrder(orderData);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link
            href="/shop"
            className="inline-block px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
          >
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Thank you for your order!
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Order #{order.id} has been received and is being processed.
          </p>
        </div>

        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
              <div className="mt-2 text-sm text-gray-600">
                <p>Total: ${order.total}</p>
                <p>Email: {order.billing.email}</p>
                <p>Name: {order.billing.first_name} {order.billing.last_name}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">Items</h3>
              <ul className="mt-2 divide-y divide-gray-200">
                {order.line_items.map((item, index) => (
                  <li key={index} className="py-3">
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <p className="text-gray-900">${item.total}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/shop"
            className="inline-block w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Continue Shopping
          </Link>
          <Link
            href="/account/orders"
            className="inline-block w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            View All Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
