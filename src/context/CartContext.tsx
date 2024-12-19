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
  cart: CartState | null;
  loading: boolean;
  error: string | null;
  addToCart: (input: AddToCartInput) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => void;
  updateItemOptions: (productId: number, input: UpdateItemOptionsInput) => void;
  removeItem: (productId: number, variationId?: number, attributes?: WooVariantAttribute[]) => void;
  clearCart: () => void;
  canProceedToCheckout: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState | null>({
    items: [],
    subtotal: 0,
    total: 0
  });
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
          setProductDetails(prev => ({
            ...prev,
            [item.product_id]: response.data
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
        quantity: input.quantity,
        name: input.name || '',
        price: input.price,
        image: input.image,
        variation_id: input.variation_id,
        attributes: input.attributes || [],
        optionsRequired: Boolean(input.product?.attributes?.length > 0),
        optionsSelected: Boolean(input.attributes?.length > 0)
      };

      setCart(prevCart => {
        if (!prevCart) {
          return {
            items: [cartItem],
            subtotal: input.price * input.quantity,
            total: input.price * input.quantity
          };
        }

        // Check if an identical item (including all attributes) already exists
        const existingItemIndex = prevCart.items.findIndex(item => {
          // First check product and variation IDs
          const basicMatch = item.product_id === input.product_id &&
                           item.variation_id === input.variation_id;
          
          if (!basicMatch) return false;

          // Then check if all attributes match
          const itemAttrs = item.attributes || [];
          const inputAttrs = input.attributes || [];
          
          // If attribute counts don't match, they're different
          if (itemAttrs.length !== inputAttrs.length) return false;

          // Check if all attributes match exactly
          return inputAttrs.every(inputAttr => 
            itemAttrs.some(itemAttr => 
              itemAttr.name === inputAttr.name && 
              itemAttr.option === inputAttr.option
            )
          );
        });

        if (existingItemIndex > -1) {
          const updatedItems = [...prevCart.items];
          updatedItems[existingItemIndex].quantity += input.quantity;

          const newSubtotal = prevCart.subtotal + (input.price * input.quantity);
          return {
            ...prevCart,
            items: updatedItems,
            subtotal: newSubtotal,
            total: newSubtotal
          };
        }

        const newSubtotal = prevCart.subtotal + (input.price * input.quantity);
        return {
          ...prevCart,
          items: [...prevCart.items, cartItem],
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
          const updatedItem = {
            ...item,
            attributes: input.attributes,
            // Only mark as selected if we have attributes and a variation ID
            optionsSelected: input.attributes.length > 0 && !!input.variation_id
          };

          if (input.variation_id) {
            updatedItem.variation_id = input.variation_id;
          }
          if (input.price) {
            updatedItem.price = parseFloat(input.price);
          }
          if (input.sku) {
            updatedItem.sku = input.sku;
          }

          return updatedItem;
        }
        return item;
      });

      // Recalculate cart totals
      const newSubtotal = updatedItems.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);

      return {
        ...prevCart,
        items: updatedItems,
        subtotal: newSubtotal,
        total: newSubtotal
      };
    });
  }, []);

  const removeItem = useCallback((productId: number, variationId?: number, attributes?: WooVariantAttribute[]) => {
    setCart(prevCart => {
      if (!prevCart) return null;

      const updatedItems = prevCart.items.filter(item => {
        // If variation ID is provided, use it for matching
        if (variationId) {
          return item.product_id !== productId || item.variation_id !== variationId;
        }
        
        // If attributes are provided, match based on attributes
        if (attributes?.length) {
          const itemAttrs = item.attributes || [];
          
          // If attribute counts don't match, keep the item
          if (itemAttrs.length !== attributes.length) {
            return true;
          }

          // Check if all attributes match exactly
          const attributesMatch = attributes.every(attr => 
            itemAttrs.some(itemAttr => 
              itemAttr.name === attr.name && 
              itemAttr.option === attr.option
            )
          );

          return item.product_id !== productId || !attributesMatch;
        }

        // If no variation ID or attributes provided, only match by product ID
        return item.product_id !== productId;
      });

      const newSubtotal = updatedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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