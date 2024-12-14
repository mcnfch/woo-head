'use client';

import { useState, Suspense, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useCart } from '@/context/CartContext';
import type { WooCategory } from '@/lib/types';
import { Navigation } from './Navigation';

const MobileMenu = dynamic(() => import('./MobileMenu').then(mod => mod.MobileMenu), {
  loading: () => <div className="w-10 h-10 animate-pulse bg-gray-200 rounded-full" />
});

const CartIcon = dynamic(() => import('./CartIcon'), {
  loading: () => <div className="w-10 h-10 animate-pulse bg-gray-200 rounded-full" />
});

interface HeaderProps {
  categories: WooCategory[];
}

export function Header({ categories }: HeaderProps) {
  const { cart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cartCount = cart?.items?.length || 0;

  const handleCartClick = useCallback(() => {
    setIsCartOpen(!isCartOpen);
  }, [isCartOpen]);

  return (
    <header className="w-full">
      <div className="relative">
        {/* Banner Image */}
        <div className="relative w-full h-[160px]">
          <Image
            src="/images/frgheader.png"
            alt="Festival Rave Gear Banner"
            fill
            priority
            quality={90}
            sizes="100vw"
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        </div>

        {/* Centered Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2" style={{ top: '10px' }}>
          <Link href="/" className="block">
            <Image
              src="/images/FRGLogo.png"
              alt="Festival Rave Gear Logo"
              width={140}
              height={140}
              priority
              quality={90}
            />
          </Link>
        </div>

        {/* Cart Icon */}
        <div className="absolute right-8" style={{ top: '10px' }}>
          <CartIcon 
            count={cartCount} 
            isCartOpen={isCartOpen}
            onCartClick={handleCartClick}
          />
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="absolute left-4 top-4 md:hidden"
          aria-label="Toggle mobile menu"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <div className="hidden md:block">
        <Navigation categories={categories} pages={[]} />
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <MobileMenu categories={categories} onClose={() => setIsMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  );
}