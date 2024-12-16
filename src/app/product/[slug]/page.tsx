import { productCache } from '@/lib/cache/productCache';
import { ProductDetails } from '@/components/product/ProductDetails';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface PageProps {
  params: { slug: string };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await productCache.getProductBySlug(params.slug);
  
  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: `${product.name} | Festival Rave Gear`,
    description: product.short_description || product.description,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await productCache.getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return <ProductDetails product={product} />;
}