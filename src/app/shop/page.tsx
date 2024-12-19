'use client';

import { useState, useEffect } from 'react';
import { getProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import { ShopHeader } from '@/components/shop/ShopHeader';
import type { WooProduct } from '@/lib/types';

export default function ShopPage() {
  const [products, setProducts] = useState<WooProduct[]>([]);
  const [sortBy, setSortBy] = useState('default');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const result = await getProducts();
        setProducts(result.products || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const sortProducts = (productsToSort: WooProduct[]): WooProduct[] => {
    if (!productsToSort?.length) return [];
    
    const sortedProducts = [...productsToSort];

    switch (sortBy) {
      case 'price-asc':
        return sortedProducts.sort((a, b) => 
          parseFloat(a.price || '0') - parseFloat(b.price || '0')
        );
      case 'price-desc':
        return sortedProducts.sort((a, b) => 
          parseFloat(b.price || '0') - parseFloat(a.price || '0')
        );
      case 'name-asc':
        return sortedProducts.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
      case 'name-desc':
        return sortedProducts.sort((a, b) => 
          b.name.localeCompare(a.name)
        );
      default:
        return sortedProducts;
    }
  };

  const handleSort = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-orbitron">Loading products...</div>
      </div>
    );
  }

  const sortedProducts = sortProducts(products);

  if (!sortedProducts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-8 shadow-lg max-w-2xl mx-4 text-center">
          <h2 className="text-3xl font-orbitron mb-4 tracking-wider">
            No Products Found
          </h2>
          <p className="text-gray-700 text-lg mb-6">
            We couldn't find any products at the moment. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <ShopHeader 
        totalProducts={sortedProducts.length} 
        onSort={handleSort}
        currentSort={sortBy}
      />
      
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 mb-16">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.images[0]?.src || '/placeholder.jpg'}
              stockStatus={product.stock_status}
              shortDescription={product.short_description}
              sku={product.sku}
            />
          ))}
        </div>
      </div>
    </main>
  );
}