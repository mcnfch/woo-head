'use client';

import { Suspense } from 'react';
import type { WooProduct } from '@/lib/types';
import ProductList from '@/components/product/ProductList';
import ProductListSkeleton from '@/components/product/ProductListSkeleton';

interface CategoryContentProps {
  products: WooProduct[];
  categoryName: string;
}

export default function CategoryContent({ products, categoryName }: CategoryContentProps) {
  if (!Array.isArray(products)) {
    console.error('Products is not an array:', products);
    return (
      <div className="page-section">
        <h1 className="page-header">{categoryName}</h1>
        <div className="content-container text-center">
          No products found
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="page-section">
        <h1 className="page-header">{categoryName}</h1>
        <div className="content-container text-center">
          No products found
        </div>
      </div>
    );
  }

  return (
    <div className="page-section">
      <h1 className="page-header">{categoryName}</h1>
      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList products={products} categoryName={categoryName} />
      </Suspense>
    </div>
  );
}