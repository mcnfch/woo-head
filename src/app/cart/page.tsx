'use client';

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2, Minus, Plus, ShoppingCart } from 'lucide-react';

export default function CartPage() {
  const { cart, loading, error, updateQuantity, removeItem } = useCart();
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-gray-400" />
          <p className="mt-4 text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
        <ShoppingCart className="w-16 h-16 mb-4 text-gray-400" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Cart</h2>
        <p className="text-gray-600 max-w-md mx-auto">{error}</p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
        <ShoppingCart className="w-16 h-16 mb-4 text-gray-400" />
        <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          You haven&apos;t added any items to your cart yet.
          Browse our products and find something you like!
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  const handleUpdateQuantity = async (productId: number, newQuantity: number) => {
    try {
      setUpdatingItemId(productId);
      await updateQuantity(productId, newQuantity);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (productId: number) => {
    try {
      setUpdatingItemId(productId);
      await removeItem(productId);
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-8">
          <div className="space-y-6">
            {cart.items.map((item) => (
              <div
                key={`${item.product_id}-${item.variation_id || ''}`}
                className="flex items-start space-x-4 bg-white p-6 shadow-sm rounded-lg relative"
              >
                {item.image && (
                  <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    <Image
                      src={item.image}
                      alt={item.name || 'Product image'}
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900">
                    {item.name || `Product #${item.product_id}`}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    ${((item.price || 0) * item.quantity).toFixed(2)}
                  </p>

                  <div className="mt-4 flex items-center space-x-4">
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                        disabled={updatingItemId === item.product_id}
                        className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 text-center min-w-[40px]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                        disabled={updatingItemId === item.product_id}
                        className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.product_id)}
                      disabled={updatingItemId === item.product_id}
                      className="text-sm text-red-600 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>

                    {updatingItemId === item.product_id && (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!cart?.items.length && (
              <p className="text-gray-500">
                You haven&apos;t added any items in your cart yet.
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 mt-8 lg:mt-0">
          <div className="bg-white shadow-lg rounded-lg p-6 lg:sticky lg:top-4">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>

            <dl className="space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Subtotal</dt>
                <dd className="text-sm font-medium text-gray-900">
                  ${cart.subtotal.toFixed(2)}
                </dd>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <dt className="text-base font-bold text-gray-900">Order total</dt>
                  <dd className="text-base font-bold text-gray-900">
                    ${cart.total.toFixed(2)}
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-8">
              <Link
                href="/checkout"
                className="w-full flex items-center justify-center px-6 py-4 border border-transparent rounded-lg shadow-md text-lg font-bold text-white bg-green-600 hover:bg-green-700 transform transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Proceed to Checkout →
              </Link>
              <p className="mt-4 text-center text-sm text-gray-500">
                We&apos;ll calculate shipping at checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
