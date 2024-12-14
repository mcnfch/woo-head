'use client';

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Loader2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { woocommerce } from '@/lib/woocommerce';
import type { WooVariantAttribute, WooProduct, WooVariation } from '@/lib/types';

export default function CartPage() {
  const { cart, loading, error, updateQuantity, removeItem, updateItemOptions, canProceedToCheckout } = useCart();
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [productDetails, setProductDetails] = useState<Record<number, WooProduct>>({});
  const [productVariations, setProductVariations] = useState<Record<number, WooVariation[]>>({});
  const [loadingProducts, setLoadingProducts] = useState<Record<number, boolean>>({});
  const [loadingVariations, setLoadingVariations] = useState<Record<number, boolean>>({});

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

  const handleCheckout = () => {
    // Implement checkout logic here
  };

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
        <Link href="/shop" className="mt-6 inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary/90">
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
        <Link href="/shop" className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary/90">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-8">Shopping Cart</h1>
      
      <div className="mt-8">
        <div className="flow-root">
          <ul role="list" className="-my-6 divide-y divide-gray-200">
            {cart.items.map((item) => (
              <li key={item.product_id} className="py-6">
                <div className="flex items-start space-x-4">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    <Image
                      src={item.image || '/placeholder.jpg'}
                      alt={item.name}
                      fill
                      className="object-cover object-center"
                    />
                  </div>

                  <div className="ml-4 flex-1 flex flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <h3>{item.name}</h3>
                        <p className="ml-4">
                          ${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
                        </p>
                      </div>
                      
                      {/* Product Options Dropdown */}
                      {productDetails[item.product_id]?.attributes?.map((attribute) => {
                        const currentValue = item.attributes?.find(attr => attr.name === attribute.name)?.option || '';
                        const isDefaultSelected = !currentValue;
                        
                        return (
                          <div key={`${item.product_id}-${attribute.id}`} className="mt-4">
                            <label 
                              htmlFor={`${item.product_id}-${attribute.name}`}
                              className="block text-sm font-medium text-gray-700"
                            >
                              {attribute.name}
                            </label>
                            <select
                              id={`${item.product_id}-${attribute.name}`}
                              value={currentValue}
                              onChange={(e) => handleOptionChange(item.product_id, attribute.name, e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                            >
                              <option value="">Select {attribute.name}</option>
                              {attribute.options?.map((option) => (
                                <option key={`${item.product_id}-${attribute.id}-${option}`} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            {isDefaultSelected && (
                              <p className="mt-1 text-sm text-red-600">
                                Please select a {attribute.name.toLowerCase()}
                              </p>
                            )}
                          </div>
                        );
                      })}
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => updateQuantity(item.product_id, Math.max(1, (item.quantity || 1) - 1))}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            −
                          </button>
                          <span className="text-gray-700">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, (item.quantity || 1) + 1)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-medium text-gray-900">
                            ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${item.price?.toFixed(2)} each
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <div className="flex justify-between text-base font-medium text-gray-900">
            <p>Subtotal</p>
            <p>${cart.subtotal.toFixed(2)}</p>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
            
          <div className="mt-6">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={!canProceedToCheckout}
              aria-disabled={!canProceedToCheckout}
              className={`w-full rounded-md py-3 px-4 text-base font-medium text-white
                ${canProceedToCheckout 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-gray-300 cursor-not-allowed'}`}
            >
              Proceed to Checkout
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              or{' '}
              <Link href="/shop" className="font-medium text-purple-600 hover:text-purple-500">
                Continue Shopping →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
