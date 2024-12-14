'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { cartService } from '@/lib/woocommerce/cart';
import type { CartItem, AddToCartInput } from '@/lib/types';

interface CartState {
  items: CartItem[];
  subtotal: number;
  total: number;
}

interface CartContextType {
  cart: CartState | null;
  loading: boolean;
  error: string | null;
  addToCart: (input: AddToCartInput) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToCart = useCallback(async (input: AddToCartInput) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.addToCart(input);
      if (response.success) {
        const cartItem: CartItem = {
          product_id: input.product_id,
          quantity: input.quantity,
          name: input.name || '',
          price: input.price,
          image: input.image,
          variation_id: input.variation_id,
          attributes: input.attributes?.map(attr => ({
            id: attr.id,
            name: attr.name,
            option: attr.option
          })) || []
        };
        setCart(prevCart => ({
          ...prevCart!,
          items: [...(prevCart?.items || []), cartItem]
        }));
      }
    } catch (err) {
      setError('Failed to add item to cart');
      console.error('Error adding to cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (productId: number, quantity: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.update(productId, quantity);
      if (response.success) {
        setCart(prevCart => ({
          ...prevCart!,
          items: prevCart!.items.map(item => 
            item.product_id === productId ? { ...item, quantity } : item
          )
        }));
      }
    } catch (err) {
      setError('Failed to update quantity');
      console.error('Error updating quantity:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (productId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.remove(productId);
      if (response.success) {
        setCart(prevCart => ({
          ...prevCart!,
          items: prevCart!.items.filter(item => item.product_id !== productId)
        }));
      }
    } catch (err) {
      setError('Failed to remove item');
      console.error('Error removing item:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCart({ items: [], subtotal: 0, total: 0 });
    } catch (err) {
      setError('Failed to clear cart');
      console.error('Error clearing cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}