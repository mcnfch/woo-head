'use client';

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Loader2, Minus, Plus, ShoppingCart } from 'lucide-react';
import type { WooVariantAttribute, WooProduct, WooVariation, CartItem } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cart, loading, error, updateQuantity, removeItem, updateItemOptions, canProceedToCheckout } = useCart();
  const router = useRouter();
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  const handleQuantityChange = async (productId: number, newQuantity: number) => {
    setUpdatingItemId(productId);
    try {
      await updateQuantity(productId, newQuantity);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemove = async (productId: number) => {
    setUpdatingItemId(productId);
    try {
      await removeItem(productId);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleOptionChange = async (productId: number, attributeName: string, value: string) => {
    const item = cart?.items.find(i => i.product_id === productId);
    if (!item || !item.product) return;

    const attribute = item.product.attributes?.find(attr => attr.name === attributeName);
    if (!attribute) return;

    // Update the selected attributes while preserving other selections
    const currentAttributes = item.attributes || [];
    const newAttributes: WooVariantAttribute[] = [
      ...currentAttributes.filter(attr => attr.name !== attributeName),
      { id: attribute.id, name: attributeName, option: value }
    ];

    // Get all required attributes for this product
    const requiredAttributes = item.product.attributes?.filter(attr => attr.variation) || [];
    
    // Check if all required attributes are selected
    const hasAllRequiredAttributes = requiredAttributes.every(attr => 
      newAttributes.some(selected => selected.name === attr.name && selected.option)
    );

    // Only look for variations if all required attributes are selected
    const variations = item.product.variations || [];
    let matchingVariation: WooVariation | undefined;
    
    if (variations.length > 0 && hasAllRequiredAttributes) {
      matchingVariation = variations.find(variation => {
        // A variation matches only if ALL its attributes match our selected attributes
        return variation.attributes?.every(varAttr => {
          const selectedAttr = newAttributes.find(attr => attr.name === varAttr.name);
          return selectedAttr && selectedAttr.option === varAttr.option;
        });
      });
    }

    // Update the item with new attributes and variation (if found)
    if (value && value !== '') {
      updateItemOptions(productId, {
        attributes: newAttributes,
        variation_id: matchingVariation?.id,
        price: matchingVariation?.price || item.price?.toString(),
        sku: matchingVariation?.sku || item.sku
      });
    } else {
      // If an option is deselected, remove it from attributes
      updateItemOptions(productId, {
        attributes: currentAttributes.filter(attr => attr.name !== attributeName),
        variation_id: undefined,
        price: item.product.price?.toString(),
        sku: item.product.sku
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!cart?.items.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
        <Link
          href="/"
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Shopping Cart</h1>

        <form className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
          <section aria-labelledby="cart-heading" className="lg:col-span-7">
            <h2 id="cart-heading" className="sr-only">
              Items in your shopping cart
            </h2>

            <ul role="list" className="divide-y divide-gray-200 border-b border-t border-gray-200">
              {cart.items.map((item) => (
                <li key={item.product_id} className="flex py-6 sm:py-10">
                  <div className="flex-shrink-0">
                    {item.product?.images && item.product.images.length > 0 && (
                      <Image
                        src={item.product.images[0]?.src ?? ''}
                        alt={item.product.images[0]?.alt ?? item.name}
                        width={96}
                        height={96}
                        className="h-24 w-24 rounded-md object-cover object-center sm:h-48 sm:w-48"
                      />
                    )}
                  </div>

                  <div className="ml-4 flex flex-1 flex-col sm:ml-6">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-sm">
                          <Link href={`/product/${item.product?.slug}`} className="font-medium text-gray-700 hover:text-gray-800">
                            {item.name}
                          </Link>
                        </h3>
                        <p className="ml-4 text-sm font-medium text-gray-900">${item.price}</p>
                      </div>
                      {item.product?.attributes && item.product.attributes.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {item.product.attributes.map((attribute) => (
                            <div key={attribute.name} className="flex items-center">
                              <label htmlFor={`${item.product_id}-${attribute.name}`} className="block text-sm font-medium text-gray-700 mr-2">
                                {attribute.name}:
                              </label>
                              <select
                                id={`${item.product_id}-${attribute.name}`}
                                name={attribute.name}
                                value={item.attributes?.find(attr => attr.name === attribute.name)?.option || ''}
                                onChange={(e) => handleOptionChange(item.product_id, attribute.name, e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                              >
                                <option value="">Select {attribute.name}</option>
                                {attribute.options.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.product_id, Math.max(1, (item.quantity || 1) - 1))}
                          className="rounded-md bg-white p-1 text-gray-400 hover:text-gray-500"
                        >
                          <Minus className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <span className="text-gray-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.product_id, (item.quantity || 1) + 1)}
                          className="rounded-md bg-white p-1 text-gray-400 hover:text-gray-500"
                        >
                          <Plus className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="ml-4">
                        <button
                          type="button"
                          onClick={() => handleRemove(item.product_id)}
                          className="text-sm font-medium text-purple-600 hover:text-purple-500"
                        >
                          {updatingItemId === item.product_id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <span>Remove</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Order summary */}
          <section
            aria-labelledby="summary-heading"
            className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
          >
            <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
              Order summary
            </h2>

            <dl className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Subtotal</dt>
                <dd className="text-sm font-medium text-gray-900">${cart.totals?.subtotal}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="text-base font-medium text-gray-900">Order total</dt>
                <dd className="text-base font-medium text-gray-900">${cart.totals?.total}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => router.push('/checkout')}
                disabled={!canProceedToCheckout}
                className={`w-full rounded-md border border-transparent px-4 py-3 text-base font-medium text-white shadow-sm ${
                  canProceedToCheckout
                    ? 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-50'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Proceed to Checkout
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
