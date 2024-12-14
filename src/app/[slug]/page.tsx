import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { draftMode } from 'next/headers';

import { getCategories } from '@/lib/woocommerce';
import { productCache } from '@/lib/cache/productCache';
import ProductGrid from '@/components/product/ProductGrid';
import { CategoryHero } from '@/components/category/CategoryHero';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = params;
  
  // Only handle categories in this route
  const categories = await getCategories();
  const category = categories.find(cat => cat.slug === slug);
  if (category) {
    return {
      title: `${category.name} | Festival Rave Gear`,
      description: category.description || `Shop our collection of ${category.name}`,
    };
  }

  return {
    title: 'Not Found | Festival Rave Gear',
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = params;
  
  try {
    const categories = await getCategories();
    const category = categories.find(cat => cat.slug === slug);
    
    if (!category) {
      console.log(`[CategoryPage] Category not found: ${slug}`);
      notFound();
    }

    console.log(`[CategoryPage] Rendering category: ${category.name}`);
    const { products } = await productCache.getProductsByCategory(category.slug);

    return (
      <div>
        <CategoryHero category={category} />
        <ProductGrid products={products} />
      </div>
    );
  } catch (error) {
    console.error('Error in category page:', error);
    notFound();
  }
}
