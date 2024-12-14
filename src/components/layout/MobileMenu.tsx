'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { WooCategory } from '@/lib/types';

export interface MobileMenuProps {
  categories: WooCategory[];
  onClose: () => void;
}

export function MobileMenu({ categories, onClose }: MobileMenuProps) {
  // Build a map of parent categories to their children
  const categoryMap = new Map<number, WooCategory[]>();
  const rootCategories: WooCategory[] = [];
  
  // First, organize all categories by their relationships
  categories.forEach(category => {
    if (category.parent === 0) {
      rootCategories.push(category);
    } else {
      const children = categoryMap.get(category.parent) || [];
      children.push(category);
      categoryMap.set(category.parent, children);
    }
  });

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <Dialog.Title
                    as="h3"
                    className="text-base font-semibold leading-6 text-gray-900"
                  >
                    Menu
                  </Dialog.Title>
                  <div className="mt-2">
                    <nav className="flex flex-col space-y-4">
                      <Link
                        href="/"
                        className="text-gray-600 hover:text-gray-900"
                        onClick={onClose}
                      >
                        Home
                      </Link>
                      <Link
                        href="/shop"
                        className="text-gray-600 hover:text-gray-900"
                        onClick={onClose}
                      >
                        Shop
                      </Link>
                      {rootCategories.map((category) => {
                        const children = categoryMap.get(category.id) || [];
                        return (
                          <div key={category.id} className="space-y-2">
                            <Link
                              href={`/${category.slug}`}
                              className="block text-lg font-medium text-gray-900 hover:text-purple-600"
                              onClick={onClose}
                            >
                              {category.name}
                            </Link>
                            {children.length > 0 && (
                              <div className="pl-4 space-y-2">
                                {children.map((child) => (
                                  <Link
                                    key={child.id}
                                    href={`/${child.slug}`}
                                    className="block text-gray-600 hover:text-purple-600"
                                    onClick={onClose}
                                  >
                                    {child.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <Link
                        href="/cart"
                        className="text-gray-600 hover:text-gray-900"
                        onClick={onClose}
                      >
                        Cart
                      </Link>
                    </nav>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}