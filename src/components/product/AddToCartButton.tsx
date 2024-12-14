'use client';

import { useCart } from '@/context/CartContext';
import type { WooProduct } from '@/lib/types';

interface AddToCartButtonProps {
  product: WooProduct;
  className?: string;
  isProductPage?: boolean;
}

export function AddToCartButton({ product, className = '', isProductPage = false }: AddToCartButtonProps) {
  const { addToCart } = useCart();

  const handleClick = async () => {
    try {
      await addToCart({
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        image: product.images[0]?.src,
        product: product // Pass the full product for options detection
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={product.stock_status !== 'instock'}
      className={`${className} ${
        product.stock_status === 'instock'
          ? 'bg-purple-600 hover:bg-purple-700'
          : 'bg-gray-400 cursor-not-allowed'
      }`}
    >
      {product.stock_status === 'instock' ? 'Add to Cart' : 'Out of Stock'}
    </button>
  );
}
