'use client';

import { useCart } from '@/context/CartContext';
import type { CartItem, WooProduct, WooVariation, WooVariantAttribute } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { woocommerce } from '@/lib/woocommerce';
import { useRouter } from 'next/navigation';

// Utility function to decode HTML entities
const decodeHTMLEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

export interface SlideOutCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SlideOutCart({ isOpen, onClose }: SlideOutCartProps) {
  const { cart, loading, removeItem, updateQuantity, updateItemOptions, canProceedToCheckout } = useCart();
  const [productDetails, setProductDetails] = useState<Record<number, WooProduct>>({});
  const [productVariations, setProductVariations] = useState<Record<number, WooVariation[]>>({});
  const [loadingProducts, setLoadingProducts] = useState<Record<number, boolean>>({});
  const [loadingVariations, setLoadingVariations] = useState<Record<number, boolean>>({});
  const router = useRouter();

  // Fetch product details and variations for all cart items
  useEffect(() => {
    if (!cart?.items.length) return;

    const fetchProductData = async (productId: number) => {
      if (loadingProducts[productId] || productDetails[productId]) return;

      setLoadingProducts(prev => ({ ...prev, [productId]: true }));
      try {
        // Fetch product details
        const productResponse = await woocommerce.get(`products/${productId}`);
        setProductDetails(prev => ({ ...prev, [productId]: productResponse.data }));

        // If it's a variable product, fetch variations
        if (productResponse.data.type === 'variable') {
          setLoadingVariations(prev => ({ ...prev, [productId]: true }));
          const variationsResponse = await woocommerce.get(`products/${productId}/variations`);
          setProductVariations(prev => ({ ...prev, [productId]: variationsResponse.data }));
          setLoadingVariations(prev => ({ ...prev, [productId]: false }));
        }
      } catch (error) {
        console.error('Error fetching product data:', error);
      } finally {
        setLoadingProducts(prev => ({ ...prev, [productId]: false }));
      }
    };

    cart.items.forEach(item => {
      if (!productDetails[item.product_id]) {
        fetchProductData(item.product_id);
      }
    });
  }, [cart?.items]);

  const findMatchingVariation = (productId: number, selectedAttributes: WooVariantAttribute[]) => {
    const variations = productVariations[productId] || [];
    return variations.find(variation => {
      return variation.attributes.every(varAttr => {
        const selectedAttr = selectedAttributes.find(attr => attr.name === varAttr.name);
        return selectedAttr && selectedAttr.option === varAttr.option;
      });
    });
  };

  const handleOptionChange = async (productId: number, attributeName: string, value: string) => {
    const item = cart?.items.find(i => i.product_id === productId);
    if (!item) return;

    const product = productDetails[productId];
    if (!product) return;

    const attribute = product.attributes.find(attr => attr.name === attributeName);
    if (!attribute) return;

    const currentAttributes = item.attributes || [];
    const newAttributes: WooVariantAttribute[] = [
      ...currentAttributes.filter(attr => attr.name !== attributeName),
      { id: attribute.id, name: attributeName, option: value }
    ];

    // Find matching variation for the new combination
    const matchingVariation = findMatchingVariation(productId, newAttributes);
    
    // Only update if a real option is selected (not empty/default)
    if (value && value !== '') {
      updateItemOptions(productId, {
        attributes: newAttributes,
        variation_id: matchingVariation?.id,
        price: matchingVariation?.price,
        sku: matchingVariation?.sku
      });
    } else {
      // If default "Select" option is chosen, clear the selection
      updateItemOptions(productId, {
        attributes: currentAttributes.filter(attr => attr.name !== attributeName),
        variation_id: undefined,
        price: item.price?.toString(),
        sku: item.sku
      });
    }
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
              <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6 bg-white">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Shopping cart</h2>
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
                  <div className="mt-8 bg-white p-4 rounded-lg">Loading...</div>
                ) : cartItems.length === 0 ? (
                  <div className="mt-8 bg-white p-4 rounded-lg">Your cart is empty</div>
                ) : (
                  <div className="mt-8">
                    <div className="flow-root">
                      <ul className="-my-6 divide-y divide-gray-200">
                        {cartItems.map((item) => (
                          <li key={`${item.product_id}-${item.variation_id || ''}`} className="py-6 flex bg-white">
                            <div className="flex-shrink-0 w-24 h-24 relative">
                              <Image
                                src={item.image || '/placeholder.jpg'}
                                alt={item.name}
                                fill
                                className="object-cover rounded"
                              />
                            </div>

                            <div className="ml-4 flex-1 flex flex-col">
                              <div>
                                <div className="flex justify-between text-base font-medium text-gray-900">
                                  <h3>{decodeHTMLEntities(item.name)}</h3>
                                  <p className="ml-4">{formatPrice((item.price || 0) * item.quantity)}</p>
                                </div>
                                {item.attributes && item.attributes.length > 0 && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    {item.attributes.map(attr => attr.option).join(' / ')}
                                  </p>
                                )}
                              </div>

                              {/* Product Options */}
                              {productDetails[item.product_id]?.attributes?.map((attribute) => {
                                const currentValue = item.attributes?.find(attr => attr.name === attribute.name)?.option || '';
                                const isDefaultSelected = !currentValue;
                                
                                return (
                                  <div key={`${item.product_id}-${attribute.id}`} className="mt-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                      {attribute.name}
                                    </label>
                                    <select
                                      id={`${item.product_id}-${attribute.name}`}
                                      value={currentValue}
                                      onChange={(e) => handleOptionChange(item.product_id, attribute.name, e.target.value)}
                                      className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base 
                                               bg-white
                                               border border-gray-300 
                                               focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 
                                               hover:border-purple-400 transition-all duration-200
                                               shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.1)]
                                               rounded-md"
                                    >
                                      <option value="" className="text-gray-500">Select {attribute.name}</option>
                                      {attribute.options?.map((option, optIndex) => (
                                        <option 
                                          key={`${item.product_id}-${attribute.name}-${optIndex}`} 
                                          value={option}
                                          className="text-gray-900"
                                        >
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })}

                              <div className="flex-1 flex items-end justify-between text-sm mt-4">
                                <div className="flex items-center">
                                  <button
                                    onClick={() => updateQuantity(item.product_id, Math.max(0, item.quantity - 1))}
                                    className="px-2 py-1 border rounded-l hover:bg-gray-50"
                                  >
                                    -
                                  </button>
                                  <span className="px-4 py-1 border-t border-b">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                    className="px-2 py-1 border rounded-r hover:bg-gray-50"
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
                    <p>{formatPrice(cart?.subtotal || 0)}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
                  <div className="mt-6 space-y-3">
                    <Link
                      href="/cart"
                      className="flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700"
                      onClick={onClose}
                    >
                      View Cart
                    </Link>
                    <Link
                      href={canProceedToCheckout ? "/checkout" : "#"}
                      className={`flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                        canProceedToCheckout
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                      onClick={(e) => {
                        if (!canProceedToCheckout) {
                          e.preventDefault();
                        } else {
                          onClose();
                        }
                      }}
                    >
                      {canProceedToCheckout ? 'Checkout' : 'Select All Options to Checkout'}
                    </Link>
                    <button
                      onClick={onClose}
                      className="w-full text-center text-purple-600 hover:text-purple-500 text-sm font-medium"
                    >
                      Continue Shopping
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
