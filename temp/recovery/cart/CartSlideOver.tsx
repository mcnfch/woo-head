'use client';

import { Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

interface CartSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSlideOver({ isOpen, onClose }: CartSlideOverProps) {
  const { cart } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0" onClick={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel 
                    ref={panelRef} 
                    className="pointer-events-auto w-screen max-w-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                        <div className="flex items-start justify-between">
                          <Dialog.Title className="text-lg font-medium text-gray-900">Shopping Cart</Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                              onClick={onClose}
                            >
                              <span className="absolute -inset-0.5" />
                              <span className="sr-only">Close panel</span>
                              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-8">
                          <div className="flow-root">
                            {cart && cart.items.length > 0 ? (
                              <ul role="list" className="-my-6 divide-y divide-gray-200">
                                {cart.items.map((item) => (
                                  <li key={item.product_id} className="flex py-6">
                                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                      <Image
                                        src={item.image || '/placeholder.jpg'}
                                        alt={item.name}
                                        width={96}
                                        height={96}
                                        className="h-full w-full object-cover object-center"
                                      />
                                    </div>

                                    <div className="ml-4 flex flex-1 flex-col">
                                      <div>
                                        <div className="flex justify-between text-base font-medium text-gray-900">
                                          <h3>{item.name}</h3>
                                          <p className="ml-4">
                                            ${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
                                          </p>
                                        </div>
                                        {item.attributes && item.attributes.length > 0 && (
                                          <p className="mt-1 text-sm text-gray-500">
                                            {item.attributes.map(attr => `${attr.name}: ${attr.option}`).join(', ')}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex flex-1 items-end justify-between text-sm">
                                        <p className="text-gray-500">Qty {item.quantity}</p>
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-center py-12">
                                <p className="text-gray-500">Your cart is empty</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {cart && cart.items.length > 0 && (
                        <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <p>Subtotal</p>
                            <p>${typeof cart.subtotal === 'number' ? cart.subtotal.toFixed(2) : '0.00'}</p>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
                          <div className="mt-6">
                            <Link
                              href="/checkout"
                              className="flex items-center justify-center rounded-md border border-transparent bg-purple-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-purple-700"
                              onClick={onClose}
                            >
                              Checkout Now
                            </Link>
                          </div>
                          <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                            <button
                              type="button"
                              className="font-medium text-purple-600 hover:text-purple-500"
                              onClick={onClose}
                            >
                              Continue Shopping
                              <span aria-hidden="true"> &rarr;</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
