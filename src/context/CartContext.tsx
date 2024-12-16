import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { CartState, CartItem, AddToCartInput, CartResponse, WooVariantAttribute, WooProduct } from '@/lib/types';
import { cartService } from '@/lib/woocommerce/cart';

interface UpdateItemOptionsInput {
  attributes?: WooVariantAttribute[];
  variation_id?: number;
  price?: string;
  sku?: string;
}

interface CartContextType {
  cart: CartState | null;
  loading: boolean;
  error: string | null;
  addToCart: (input: AddToCartInput) => Promise<CartResponse>;
  removeItem: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  updateItemOptions: (productId: number, input: UpdateItemOptionsInput) => Promise<void>;
  clearCart: () => Promise<void>;
  canProceedToCheckout: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState | null>({
    items: [],
    subtotal: 0,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canProceedToCheckout, setCanProceedToCheckout] = useState(true);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error('Error loading cart from localStorage:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (cart) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart]);

  useEffect(() => {
    if (!cart?.items.length) {
      setCanProceedToCheckout(false);
      return;
    }

    // Check if any product in the cart has unselected required attributes
    const hasUnselectedAttributes = cart.items.some(item => {
      if (!item.product?.attributes?.length) return false;

      const selectedAttributes = item.attributes || [];

      // Check if this product has any attributes that require selection
      return item.product.attributes.some(attr => {
        const currentValue = selectedAttributes.find(selected => selected.name === attr.name)?.option || '';
        return !currentValue;
      });
    });

    setCanProceedToCheckout(!hasUnselectedAttributes);
  }, [cart?.items]);

  const addToCart = useCallback(async (input: AddToCartInput): Promise<CartResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await cartService.addToCart(input);
      setCart(response.cart);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error adding item to cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (productId: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await cartService.removeItem(productId);
      setCart(response.cart);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error removing item from cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (productId: number, quantity: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await cartService.updateQuantity(productId, quantity);
      setCart(response.cart);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating quantity';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItemOptions = useCallback(async (
    productId: number,
    options: UpdateItemOptionsInput
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await cartService.updateItemOptions(productId, options);
      setCart(response.cart);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating item options';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await cartService.clearCart();
      setCart(response.cart);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error clearing cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    cart,
    loading,
    error,
    addToCart,
    removeItem,
    updateQuantity,
    updateItemOptions,
    clearCart,
    canProceedToCheckout
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}