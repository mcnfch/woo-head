'use client';

import { useCart } from '@/context/CartContext';
import type { CartItem } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

export interface SlideOutCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SlideOutCart({ isOpen, onClose }: SlideOutCartProps) {
  const { cart, loading, removeItem, updateQuantity } = useCart();

  const calculateTotal = (items: CartItem[]): number => {
    return items.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
  };

  if (!isOpen) return null;

  const cartItems = cart?.items || [];

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl">
              <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Shopping cart</h2>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close panel</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {loading ? (
                  <div className="mt-8">Loading...</div>
                ) : cartItems.length === 0 ? (
                  <div className="mt-8">Your cart is empty</div>
                ) : (
                  <div className="mt-8">
                    <div className="flow-root">
                      <ul className="-my-6 divide-y divide-gray-200">
                        {cartItems.map((item) => (
                          <li key={`${item.product_id}-${item.variation_id || ''}`} className="py-6 flex">
                            {item.image && (
                              <div className="flex-shrink-0 w-24 h-24 relative">
                                <Image
                                  src={item.image || '/placeholder.jpg'}
                                  alt={item.name}
                                  width={64}
                                  height={64}
                                  className="object-cover rounded"
                                />
                              </div>
                            )}
                            <div className="ml-4 flex-1 flex flex-col">
                              <div>
                                <div className="flex justify-between text-base font-medium text-gray-900">
                                  <h3>{item.name}</h3>
                                  <p className="ml-4">{formatPrice((item.price || 0) * item.quantity)}</p>
                                </div>
                                {item.attributes && item.attributes.length > 0 && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    {item.attributes.map((attr: { option: string }) => attr.option).join(' / ')}
                                  </p>
                                )}
                              </div>
                              <div className="flex-1 flex items-end justify-between text-sm">
                                <div className="flex items-center">
                                  <button
                                    onClick={() => updateQuantity(item.product_id, Math.max(0, item.quantity - 1))}
                                    className="px-2 py-1 border rounded-l"
                                  >
                                    -
                                  </button>
                                  <span className="px-4 py-1 border-t border-b">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                    className="px-2 py-1 border rounded-r"
                                  >
                                    +
                                  </button>
                                </div>
                                <div className="flex">
                                  <button
                                    type="button"
                                    onClick={() => removeItem(item.product_id)}
                                    className="font-medium text-purple-600 hover:text-purple-500"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <p>Subtotal</p>
                    <p>{formatPrice(calculateTotal(cartItems))}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
                  <div className="mt-6">
                    <a
                      href="/checkout"
                      className="flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700"
                    >
                      Checkout
                    </a>
                  </div>
                  <div className="mt-6 flex justify-center text-sm text-center text-gray-500">
                    <p>
                      or{' '}
                      <button
                        type="button"
                        className="text-purple-600 font-medium hover:text-purple-500"
                        onClick={onClose}
                      >
                        Continue Shopping<span aria-hidden="true"> &rarr;</span>
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Removed local CartItem interface to avoid conflict
