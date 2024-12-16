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
        const response = await getProducts();
        setProducts(response.products);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const sortProducts = (productsToSort: WooProduct[]): WooProduct[] => {
    const sortedProducts = [...productsToSort];

    switch (sortBy) {
      case 'price-asc':
        return sortedProducts.sort((a, b) => 
          parseFloat(a.price) - parseFloat(b.price)
        );
      case 'price-desc':
        return sortedProducts.sort((a, b) => 
          parseFloat(b.price) - parseFloat(a.price)
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
    return <div>Loading...</div>;
  }

  const sortedProducts = sortProducts(products);

  return (
    <main className="min-h-screen bg-gray-50">
      <ShopHeader 
        totalProducts={products.length} 
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
              slug={product.slug}
            />
          ))}
        </div>
      </div>
    </main>
  );
} 