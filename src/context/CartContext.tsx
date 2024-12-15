'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { CartItem, AddToCartInput, WooVariantAttribute, WooProduct } from '@/lib/types';
import { woocommerce } from '@/lib/woocommerce';

interface CartState {
  items: CartItem[];
  subtotal: number;
  total: number;
}

interface UpdateItemOptionsInput {
  attributes: WooVariantAttribute[];
  variation_id?: number;
  price?: string;
  sku?: string;
}

interface CartContextType {
  cart?: CartState | null;
  loading: boolean;
  error: string | null;
  addToCart: (input: AddToCartInput) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => void;
  updateItemOptions: (productId: number, input: UpdateItemOptionsInput) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  canProceedToCheckout: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canProceedToCheckout, setCanProceedToCheckout] = useState(true);
  const [productDetails, setProductDetails] = useState<Record<number, WooProduct>>({});

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
    if (!cart?.items.length) return;

    cart.items.forEach(async (item) => {
      if (!productDetails[item.product_id]) {
        try {
          const response = await woocommerce.get(`products/${item.product_id}`);
          const productData = response.data as WooProduct;
          setProductDetails(prev => ({
            ...prev,
            [item.product_id]: productData
          }));
        } catch (error) {
          console.error('Error fetching product details:', error);
        }
      }
    });
  }, [cart?.items]);

  useEffect(() => {
    if (!cart?.items.length) {
      setCanProceedToCheckout(false);
      return;
    }

    // Check if any product in the cart has unselected required attributes
    const hasUnselectedAttributes = cart.items.some(item => {
      const product = productDetails[item.product_id];
      if (!product?.attributes?.length) return false;

      const selectedAttributes = item.attributes || [];

      // Check if this product has any attributes that require selection
      return product.attributes.some(attr => {
        const currentValue = selectedAttributes.find(selected => selected.name === attr.name)?.option || '';
        return !currentValue;
      });
    });

    setCanProceedToCheckout(!hasUnselectedAttributes);
  }, [cart?.items, productDetails]);

  const addToCart = useCallback(async (input: AddToCartInput) => {
    try {
      setLoading(true);
      setError(null);

      const cartItem: CartItem = {
        product_id: input.product_id,
        quantity: input.quantity || 1,
        name: input.name,
        price: input.price,
        image: input.image,
        variation_id: input.variation_id,
        attributes: input.attributes || [],
        optionsRequired: Boolean((input.product?.attributes || []).length > 0),
        optionsSelected: Boolean((input.attributes || []).length > 0),
        sku: input.sku
      };

      setCart(prevCart => {
        // Initialize cart if it doesn't exist
        const currentCart = prevCart || {
          items: [],
          subtotal: 0,
          total: 0
        };

        // Check if item with same attributes exists
        const existingItemIndex = currentCart.items.findIndex(item =>
          item.product_id === cartItem.product_id &&
          item.variation_id === cartItem.variation_id &&
          JSON.stringify(item.attributes) === JSON.stringify(cartItem.attributes)
        );

        // Create a new array of items
        const updatedItems = [...currentCart.items];

        // Update existing item or add new one
        if (existingItemIndex !== -1) {
          // Add the new quantity to the existing quantity
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + cartItem.quantity
          };
        } else {
          // Add as new item
          updatedItems.push(cartItem);
        }

        // Calculate new totals
        const newSubtotal = updatedItems.reduce((total, item) => {
          return total + ((item.price || 0) * item.quantity);
        }, 0);

        // Return updated cart
        return {
          items: updatedItems,
          subtotal: newSubtotal,
          total: newSubtotal
        };
      });
    } catch (error) {
      setError('Failed to add item to cart');
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setCart(prevCart => {
      if (!prevCart) return null;

      const updatedItems = prevCart.items.map(item => {
        if (item.product_id === productId) {
          return {
            ...item,
            quantity: Math.max(1, quantity)  // Ensure quantity is at least 1
          };
        }
        return item;
      });

      // Recalculate cart totals
      const newSubtotal = updatedItems.reduce((total, item) => {
        return total + (item.price || 0) * item.quantity;
      }, 0);

      return {
        ...prevCart,
        items: updatedItems,
        subtotal: newSubtotal,
        total: newSubtotal
      };
    });
  }, []);

  const updateItemOptions = useCallback((productId: number, input: UpdateItemOptionsInput) => {
    setCart(prevCart => {
      if (!prevCart) return null;

      const updatedItems = prevCart.items.map(item => {
        if (item.product_id === productId) {
          const updatedItem: CartItem = {
            ...item,
            attributes: input.attributes,
            variation_id: input.variation_id,
            price: input.price ? parseFloat(input.price) : (item.price || 0),
            sku: input.sku,
            optionsSelected: input.attributes.length > 0 && !!input.variation_id
          };
          return updatedItem;
        }
        return item;
      });

      // Recalculate cart totals
      const newSubtotal = updatedItems.reduce((total, item) => {
        if (item && item.price !== undefined) {
          return total + item.price * item.quantity;
        } else {
          return total;
        }
      }, 0);

      return {
        ...prevCart,
        items: updatedItems,
        subtotal: newSubtotal,
        total: newSubtotal
      };
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setCart(prevCart => {
      if (!prevCart) return null;

      const itemIndex = prevCart.items.findIndex(item => item.product_id === productId);
      if (itemIndex === -1) return prevCart;

      // Create new array without the removed item
      const updatedItems = [
        ...prevCart.items.slice(0, itemIndex),
        ...prevCart.items.slice(itemIndex + 1)
      ];

      // Calculate new total
      const newSubtotal = updatedItems.reduce((total, item) => {
        const price = item.price || 0;
        const quantity = item.quantity || 1;
        return total + (price * quantity);
      }, 0);

      // Return updated cart
      return {
        ...prevCart,
        items: updatedItems,
        subtotal: newSubtotal,
        total: newSubtotal
      };
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({
      items: [],
      subtotal: 0,
      total: 0
    });
    localStorage.removeItem('cart');
  }, []);

  const value = {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    updateItemOptions,
    removeItem,
    clearCart,
    canProceedToCheckout
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