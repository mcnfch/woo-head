'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import SlideOutCart from '../cart/SlideOutCart';

interface CartIconProps {
  count?: number;
  isCartOpen: boolean;
  onCartClick: () => void;
}

export default function CartIcon({ count = 0, isCartOpen, onCartClick }: CartIconProps) {
  return (
    <>
      <button onClick={onCartClick} className="relative inline-flex items-center p-2">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-purple-600 rounded-full">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      
      <SlideOutCart isOpen={isCartOpen} onClose={onCartClick} />
    </>
  );
}
