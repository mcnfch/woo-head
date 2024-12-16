'use client';

import { useCart } from '@/context/CartContext';
import type { WooProduct, WooVariantAttribute } from '@/lib/types';
import { useState } from 'react';
import SlideOutCart from '../cart/SlideOutCart';

interface AddToCartButtonProps {
  productId: number;
  variationId?: number;
  product: WooProduct;
  selectedAttributes?: WooVariantAttribute[];
  quantity: number;
  disabled?: boolean;
  className?: string;
  onAddToCart?: () => void;
}

export function AddToCartButton({ 
  productId, 
  variationId,
  product,
  selectedAttributes = [],
  quantity = 1,
  disabled = false,
  className = '', 
  onAddToCart
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;
    
    setLoading(true);
    try {
      // Ensure attributes have selectedIndex
      const processedAttributes = selectedAttributes?.map((attr, index) => ({
        ...attr,
        selectedIndex: index + 1 // Start from 1 to avoid the placeholder index of 0
      }));

      await addToCart({
        product_id: productId,
        variation_id: variationId,
        quantity,
        name: product.name,
        price: parseFloat(product.price || '0'),
        image: product.images?.[0]?.src || '',
        product,
        attributes: processedAttributes
      });

      setIsCartOpen(true);
      onAddToCart?.();
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={`${className} ${
          !disabled
            ? loading
              ? 'bg-purple-500 cursor-wait'
              : 'bg-purple-600 hover:bg-purple-700'
            : 'bg-gray-400 cursor-not-allowed'
        } w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
      >
        {loading ? 'Adding...' : 'Add to Cart'}
      </button>

      <SlideOutCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
