'use client';

import { getProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import type { WooProduct } from '@/lib/types';

interface RelatedProductsProps {
  categoryId: number;
  currentProductId: number;
}

export async function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  try {
    const response = await getProducts(categoryId.toString());
    const relatedProducts = response.products
      .filter((product: WooProduct) => product.id !== currentProductId)
      .slice(0, 4);

    if (!relatedProducts.length) {
      return null;
    }

    return (
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-8">Related Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts.map((product: WooProduct) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.images[0]?.src || '/placeholder.jpg'}
              slug={product.slug}
              stockStatus={product.stock_status}
              shortDescription={product.short_description}
              sku={product.sku}
            />
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading related products:', error);
    return null;
  }
}

export default RelatedProducts;