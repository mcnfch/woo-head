'use client';

import Link from 'next/link';
import { useState } from 'react';

const quickLinks = [
  { href: '/about-us', label: 'About Us' },
  { href: '/geo', label: 'Geo' },
  { href: '/sustainability', label: 'Sustainability' },
  { href: '/shipping-returns', label: 'Shipping & Returns' },
  { href: '/contact-us', label: 'Contact Us' },
  { href: '/blog', label: 'Blog' },
];

const categories = [
  { href: '/new-arrivals', label: 'New Arrivals' },
  { href: '/women', label: 'Women' },
  { href: '/men', label: 'Men' },
  { href: '/accessories', label: 'Accessories' },
  { href: '/frg', label: 'Festival Rave Gear' },
];

const brands = [
  { href: '/frg', label: 'Festival Rave Gear' },
];

export function Footer() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Subscribe:', email);
  };

  return (
    <footer className="bg-gray-dark text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Quick Links */}
          <div>
            <h5 className="text-lg font-semibold mb-4 text-white">Quick Links</h5>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-300 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Brands */}
          <div>
            <h5 className="text-lg font-semibold mb-4 text-white">Popular Brands</h5>
            <ul className="space-y-2">
              {brands.map((brand) => (
                <li key={brand.href}>
                  <Link href={brand.href} className="text-gray-300 hover:text-white">
                    {brand.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/brands" className="text-gray-300 hover:text-white">
                  View All
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h5 className="text-lg font-semibold mb-4 text-white">Categories</h5>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.href}>
                  <Link href={category.href} className="text-gray-300 hover:text-white">
                    {category.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/categories" className="text-gray-300 hover:text-white">
                  View All
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h5 className="text-lg font-semibold mb-4 text-white">Sign Up for our Newsletter</h5>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Join our Newsletter..."
                  className="w-full px-4 py-2 border rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-600 text-white px-4 py-1 rounded-md hover:bg-gray-700"
                >
                  Submit
                </button>
              </div>
            </form>

            {/* Social Links */}
            <div className="mt-6">
              <h5 className="text-lg font-semibold mb-4 text-white">Connect With Us</h5>
              <div className="flex space-x-4">
                <a href="https://www.instagram.com/groovygallerydesigns/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p> 2024 Festival Rave Gear | Powered by Next.js</p>
            <Link href="/sitemap.xml" className="hover:text-white">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 