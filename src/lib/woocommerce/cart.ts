import { api } from '@/lib/api';
import type { CartResponse, AddToCartInput } from '@/lib/types';

export class CartService {
  private static instance: CartService;
  private initialized: boolean = false;

  private constructor() {
    this.initialized = true;
  }

  static getInstance(): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService();
    }
    return CartService.instance;
  }

  async addToCart(item: AddToCartInput): Promise<CartResponse> {
    if (!this.initialized) {
      throw new Error('Cart service not initialized');
    }

    if (!item.product_id) {
      throw new Error('Product ID is required');
    }

    try {
      await api.cart.add(item);
      return {
        success: true,
        message: 'Product added to cart',
        product_id: item.product_id,
        quantity: item.quantity,
        variation_id: item.variation_id
      };
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  async update(productId: number, quantity: number): Promise<CartResponse> {
    if (!this.initialized) {
      throw new Error('Cart service not initialized');
    }

    try {
      await api.cart.update({ product_id: productId, quantity });
      return {
        success: true,
        message: 'Cart updated',
        product_id: productId,
        quantity: quantity
      };
    } catch (error) {
      console.error('Error updating cart:', error);
      throw error;
    }
  }

  async remove(productId: number): Promise<CartResponse> {
    if (!this.initialized) {
      throw new Error('Cart service not initialized');
    }

    try {
      await api.cart.remove({ product_id: productId });
      return {
        success: true,
        message: 'Product removed from cart',
        product_id: productId,
        quantity: 0
      };
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  async applyCoupon(code: string): Promise<CartResponse> {
    if (!this.initialized) {
      throw new Error('Cart service not initialized');
    }

    try {
      await api.cart.applyCoupon('default', code);
      return {
        success: true,
        message: 'Coupon applied',
        product_id: 0,
        quantity: 0
      };
    } catch (error) {
      console.error('Error applying coupon:', error);
      throw error;
    }
  }
}

export const cartService = CartService.getInstance();
