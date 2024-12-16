import type { CartResponse, AddToCartInput, CartState, WooVariantAttribute } from '@/lib/types';

export interface CartService {
  addToCart: (input: AddToCartInput) => Promise<CartResponse>;
  removeItem: (productId: number) => Promise<CartResponse>;
  updateQuantity: (productId: number, quantity: number) => Promise<CartResponse>;
  updateItemOptions: (productId: number, options: {
    attributes?: WooVariantAttribute[];
    variation_id?: number;
    price?: string;
    sku?: string;
  }) => Promise<CartResponse>;
  clearCart: () => Promise<CartResponse>;
}

class LocalCartService implements CartService {
  private cart: CartState = {
    items: [],
    subtotal: 0,
    total: 0
  };

  async addToCart(input: AddToCartInput): Promise<CartResponse> {
    const existingItemIndex = this.cart.items.findIndex(
      item => item.product_id === input.product_id && 
             item.variation_id === input.variation_id
    );

    if (existingItemIndex > -1) {
      const item = this.cart.items[existingItemIndex];
      if (item) {
        item.quantity += input.quantity;
      }
    } else {
      this.cart.items.push({
        product_id: input.product_id,
        variation_id: input.variation_id,
        quantity: input.quantity,
        name: input.name || 'Product',
        price: input.price || 0,
        image: input.image,
        attributes: input.attributes || [],
        optionsRequired: false,
        optionsSelected: Boolean(input.attributes?.length)
      });
    }

    this.updateTotals();
    
    return {
      success: true,
      message: 'Item added to cart',
      product_id: input.product_id,
      quantity: input.quantity,
      cart: this.cart
    };
  }

  async removeItem(productId: number): Promise<CartResponse> {
    this.cart.items = this.cart.items.filter(item => item.product_id !== productId);
    this.updateTotals();
    
    return {
      success: true,
      message: 'Item removed from cart',
      product_id: productId,
      quantity: 0,
      cart: this.cart
    };
  }

  async updateQuantity(productId: number, quantity: number): Promise<CartResponse> {
    const item = this.cart.items.find(item => item.product_id === productId);
    if (item) {
      item.quantity = Math.max(1, quantity);
      this.updateTotals();
    }
    
    return {
      success: true,
      message: 'Quantity updated',
      product_id: productId,
      quantity,
      cart: this.cart
    };
  }

  async updateItemOptions(productId: number, options: {
    attributes?: WooVariantAttribute[];
    variation_id?: number;
    price?: string;
    sku?: string;
  }): Promise<CartResponse> {
    const item = this.cart.items.find(item => item.product_id === productId);
    if (item) {
      if (options.attributes) {
        item.attributes = options.attributes;
        item.optionsSelected = options.attributes.length > 0;
      }
      if (options.variation_id) {
        item.variation_id = options.variation_id;
      }
      if (options.price) {
        item.price = parseFloat(options.price) || 0; // Ensure price is always a number
      }
      this.updateTotals();
    }
    
    return {
      success: true,
      message: 'Options updated',
      product_id: productId,
      quantity: item?.quantity || 0,
      cart: this.cart
    };
  }

  async clearCart(): Promise<CartResponse> {
    this.cart = {
      items: [],
      subtotal: 0,
      total: 0
    };
    
    return {
      success: true,
      message: 'Cart cleared',
      product_id: 0,
      quantity: 0,
      cart: this.cart
    };
  }

  private updateTotals() {
    const subtotal = this.cart.items.reduce((total, item) => {
      return total + ((item.price || 0) * (item.quantity || 0)); // Handle undefined price and quantity
    }, 0);
    
    this.cart.subtotal = subtotal;
    this.cart.total = subtotal; // Add tax/shipping calculation here if needed
  }
}

export const cartService = new LocalCartService();
