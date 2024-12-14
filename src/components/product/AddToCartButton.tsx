'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import type { AddToCartInput } from '@/lib/types';

export interface AddToCartButtonProps {
  productId: number;
  variationId?: number;
  quantity?: number;
  disabled?: boolean;
  className?: string;
}

interface CartResponse {
  success: boolean;
  message?: string;
}

export function AddToCartButton({
  productId,
  variationId,
  quantity = 1,
  disabled = false,
  className = '',
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      const input: AddToCartInput = {
        product_id: productId,
        quantity,
      };

      if (variationId) {
        input.variation_id = variationId;
      }

      const result = await Promise.resolve(addToCart(input)) as unknown as CartResponse;
      if (result.success) {
        // Cart updated successfully
      } else {
        console.error('Failed to add to cart:', result.message);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || isLoading}
      className={`px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}
