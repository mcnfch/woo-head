'use client';

import { useCart } from '@/context/CartContext';
import { ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CartSlideOver } from './CartSlideOver';

export default function CartIcon() {
  const { cart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const itemCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  useEffect(() => {
    const handleOpenCart = () => {
      setIsCartOpen(true);
    };

    window.addEventListener('openCartSlider', handleOpenCart);
    return () => {
      window.removeEventListener('openCartSlider', handleOpenCart);
    };
  }, []);

  return (
    <>
      <button onClick={() => setIsCartOpen(true)} className="relative inline-flex items-center p-2">
        <ShoppingBag className="w-6 h-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary rounded-full">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>
      
      <CartSlideOver isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
