import { productCache } from '@/lib/cache/productCache';
import { ProductDetails } from '@/components/product/ProductDetails';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type GenerateMetadataProps = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(
  { params }: GenerateMetadataProps
): Promise<Metadata> {
  const slug = await Promise.resolve(params.slug);
  if (!slug) {
    return {
      title: 'Product Not Found',
    };
  }

  console.log(`[ProductPage] Generating metadata for slug: ${slug}`);
  const product = await productCache.getProductBySlug(slug);
  
  if (!product) {
    console.log(`[ProductPage] Product not found for metadata: ${slug}`);
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: `${product.name} | Festival Rave Gear`,
    description: product.short_description || product.description,
  };
}

type PageProps = {
  params: { slug: string };
};

export default async function ProductPage({ params }: PageProps) {
  const slug = await Promise.resolve(params.slug);
  if (!slug) {
    console.log(`[ProductPage] No slug provided`);
    notFound();
  }

  try {
    console.log(`[ProductPage] Loading product with slug: ${slug}`);
    const product = await productCache.getProductBySlug(slug);

    if (!product) {
      console.log(`[ProductPage] Product not found: ${slug}`);
      notFound();
    }

    console.log(`[ProductPage] Found product: ${product.name}`);
    return (
      <div className="container mx-auto px-4 py-8">
        <ProductDetails product={product} />
      </div>
    );
  } catch (error) {
    console.error(`[ProductPage] Error loading product: ${error}`);
    notFound();
  }
}