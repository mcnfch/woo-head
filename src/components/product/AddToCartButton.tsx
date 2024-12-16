'use client';

import { useCart } from '@/context/CartContext';
import type { WooProduct } from '@/lib/types';
import { useState } from 'react';

interface AddToCartButtonProps {
  productId: number;
  variationId?: number;
  disabled?: boolean;
  className?: string;
  onAddToCart?: () => void;
}

export function AddToCartButton({ 
  productId, 
  variationId,
  disabled = false,
  className = '', 
  onAddToCart
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;
    
    setLoading(true);
    try {
      await addToCart({
        product_id: productId,
        variation_id: variationId,
        quantity: 1
      });
      onAddToCart?.();
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}
