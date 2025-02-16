'use client';

import { useCart } from '@/context/CartContext';
import type { CartItem } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export interface SlideOutCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SlideOutCart({ isOpen, onClose }: SlideOutCartProps) {
  const { cart, loading, removeItem, updateQuantity, canProceedToCheckout } = useCart();

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
                      <ul role="list" className="-my-6 divide-y divide-gray-200">
                        {cartItems.map((item) => (
                          <li key={item.product_id} className="py-6 flex">
                            <div className="relative flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover object-center w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-400">No image</span>
                                </div>
                              )}
                            </div>

                            <div className="ml-4 flex-1 flex flex-col">
                              <div>
                                <div className="flex justify-between text-base font-medium text-gray-900">
                                  <h3>
                                    <Link href={`/product/${item.product?.slug || '#'}`}>
                                      {item.name}
                                    </Link>
                                  </h3>
                                  <p className="ml-4">{formatPrice(item.price || 0)}</p>
                                </div>
                                {item.attributes && item.attributes.length > 0 && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    {item.attributes.map((attr) => `${attr.name}: ${attr.option}`).join(', ')}
                                  </p>
                                )}
                              </div>
                              <div className="flex-1 flex items-end justify-between text-sm">
                                <div className="flex items-center">
                                  <button
                                    onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                                    className="text-gray-500 focus:outline-none focus:text-gray-600"
                                  >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                    </svg>
                                  </button>
                                  <span className="mx-2 text-gray-700">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                    className="text-gray-500 focus:outline-none focus:text-gray-600"
                                  >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
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
                  <div className="mt-6 space-y-4">
                    <Link
                      href="/cart"
                      className="flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700"
                      onClick={onClose}
                    >
                      View Cart
                    </Link>
                    <Link
                      href={canProceedToCheckout ? '/checkout' : '#'}
                      className={`flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                        canProceedToCheckout 
                          ? 'bg-purple-600 hover:bg-purple-700' 
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                      onClick={(e) => {
                        if (!canProceedToCheckout) {
                          e.preventDefault();
                        } else {
                          onClose();
                        }
                      }}
                      aria-disabled={!canProceedToCheckout}
                      tabIndex={canProceedToCheckout ? 0 : -1}
                    >
                      {canProceedToCheckout ? 'Checkout Now' : 'Select Required Options'}
                    </Link>
                  </div>
                  <div className="mt-6 flex justify-center text-sm text-center text-gray-500">
                    <button
                      type="button"
                      className="text-purple-600 font-medium hover:text-purple-500"
                      onClick={onClose}
                    >
                      Continue Shopping<span aria-hidden="true"> &rarr;</span>
                    </button>
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
