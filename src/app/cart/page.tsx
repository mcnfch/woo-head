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
        const productData = productResponse.data as WooProduct;
        setProductDetails(prev => ({
          ...prev,
          [productId]: productData
        }));

        // If it's a variable product, fetch variations
        if (productData.type === 'variable') {
          setLoadingVariations(prev => ({ ...prev, [productId]: true }));
          const variationsResponse = await woocommerce.get(`products/${productId}/variations`);
          const variationsData = variationsResponse.data as WooVariation[];
          setProductVariations(prev => ({
            ...prev,
            [productId]: variationsData
          }));
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

  const handleQuantityChange = (productId: number, quantity: number) => {
    updateQuantity(productId, quantity);
  };

  const handleRemoveItem = (productId: number) => {
    removeItem(productId);
  };

  const handleCheckout = () => {
    // Implement checkout logic here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center">{error}</div>
    );
  }

  if (!cart?.items.length) {
    return (
      <div className="text-center">
        <div className="mb-8">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-400" />
          <h2 className="mt-4 text-2xl font-semibold text-gray-900">Your cart is empty</h2>
          <p className="mt-2 text-gray-500">Looks like you haven't added anything to your cart yet.</p>
        </div>
        <Link 
          href="/" 
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Cart Items Panel - Full width on mobile, 6 cols on desktop */}
        <div className="lg:col-span-6 mb-8 lg:mb-0">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Shopping Cart</h2>
              <div className="divide-y divide-gray-200">
                {cart.items.map((item) => {
                  const product = productDetails[item.product_id];
                  const isUpdating = updatingItemId === item.product_id;
                  const isLoadingProduct = loadingProducts[item.product_id];
                  const isLoadingVariations = loadingVariations[item.product_id];

                  return (
                    <div key={`${item.product_id}-${item.variation_id}`} className="py-6 first:pt-0 last:pb-0">
                      {/* Main product row */}
                      <div className="flex items-center gap-4">
                        {/* Product Image */}
                        <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden">
                          {product?.images[0]?.src && (
                            <Image
                              src={product.images[0].src}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h3 className="text-base font-medium text-gray-900 truncate">
                                {isLoadingProduct ? 'Loading...' : product?.name}
                              </h3>
                              <p className="mt-1 text-sm text-gray-500">SKU: {item.sku || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-medium text-gray-900">
                                ${Number(item.price).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* Quantity and Remove */}
                          <div className="mt-2 flex items-center gap-4">
                            <div className="flex items-center rounded-lg border border-gray-300">
                              <button
                                onClick={() => handleQuantityChange(item.product_id, Math.max(1, (item.quantity || 1) - 1))}
                                className="p-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                                disabled={isUpdating}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(item.product_id, (item.quantity || 1) + 1)}
                                className="p-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                                disabled={isUpdating}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.product_id)}
                              className="text-xs text-red-600 hover:text-red-800 transition-colors"
                              disabled={isUpdating}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Options Section - Below product details */}
                      {product?.attributes && product.attributes.length > 0 && (
                        <div className="mt-3 ml-24 space-y-2">
                          {product.attributes.map((attr) => (
                            <div key={attr.name} className="flex items-center gap-3">
                              <label className="text-sm font-medium text-gray-700 min-w-[80px]">
                                {attr.name}:
                              </label>
                              <select
                                className="flex-1 max-w-[200px] text-sm rounded-md border-gray-300 py-1.5 pl-3 pr-8 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                value={item.attributes?.find(a => a.name === attr.name)?.option || ''}
                                onChange={(e) => handleOptionChange(item.product_id, attr.name, e.target.value)}
                                disabled={isLoadingVariations}
                              >
                                <option value="">Select {attr.name}</option>
                                {attr.options?.map((option) => (
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
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Panel - Full width on mobile, 6 cols on desktop */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 font-medium">${cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-semibold text-gray-900">${cart.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link
                href="/checkout"
                className={`w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white transition-colors ${
                  canProceedToCheckout
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                aria-disabled={!canProceedToCheckout}
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/"
                className="mt-4 w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}