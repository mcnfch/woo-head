'use client';

import { useState, Suspense, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import type { WooCategory } from '@/lib/types';
import Navigation from './Navigation';

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
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const cartCount = cart?.items?.length || 0;

  const handleCartClick = useCallback(() => {
    setIsCartOpen(!isCartOpen);
  }, [isCartOpen]);

  const handleProfileClick = useCallback(() => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  }, [isProfileMenuOpen]);

  return (
    <header className="w-full">
      <div className="relative">
        {/* Banner Image */}
        <div className="relative w-full h-[160px]">
          <Image
            src="/images/frgheader2.0.webp"
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

          {/* Welcome Text and Logo Container */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            {/* Welcome Text */}
            <div className="text-white font-orbitron flex flex-col items-center" style={{ letterSpacing: '4px' }}>
              <div className="text-[18px] sm:text-[24px] font-bold leading-none">
                WELCOME TO
              </div>
            </div>
            
            {/* Logo */}
            <Link href="/" className="block mt-2">
              <Image
                src="/images/FRG-logo.png"
                alt="Festival Rave Gear Logo"
                width={280}
                height={280}
                priority
                quality={90}
              />
            </Link>

            {/* Cycling Messages */}
            <div className="text-white font-orbitron text-center mt-2 h-6 overflow-hidden">
              <div className="animate-cycle-text">
                <div className="h-6">Peace Begins with Us</div>
                <div className="h-6">Love is the Loudest Frequency</div>
                <div className="h-6">Unity is the Spark, the Beat is the Flame</div>
                <div className="h-6">Respect Builds Bridges, Music Crosses Them</div>
              </div>
            </div>
          </div>

          {/* User and Cart Icons */}
          <div className="fixed right-2 top-4 flex items-center justify-end w-24">
            {/* User Icon */}
            <div className="relative">
              <button
                onClick={handleProfileClick}
                className="flex items-center space-x-1 text-white hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  {user ? (
                    <>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart Icon */}
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
      </div>
    </header>
  );
}