import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { categoryCache } from '@/lib/cache/categoryCache';
import { productCache } from '@/lib/cache/productCache';
import CategoryContent from '@/components/category/CategoryContent';
import { CategoryHero } from '@/components/category/CategoryHero';

interface PageProps {
  params: { slug: string };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const categories = await categoryCache.getAllCategories();
  const category = categories.find(cat => cat.slug === params.slug);
  
  if (!category) {
    return {
      title: 'Category Not Found | Festival Rave Gear',
    };
  }

  return {
    title: `${category.name} | Festival Rave Gear`,
    description: category.description || `Shop our collection of ${category.name} at Festival Rave Gear`,
    openGraph: {
      title: `${category.name} | Festival Rave Gear`,
      description: category.description || `Shop our collection of ${category.name} at Festival Rave Gear`,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const categories = await categoryCache.getAllCategories();
  const category = categories.find(cat => cat.slug === params.slug);

  if (!category) {
    notFound();
  }

  // Get products for this category
  const { products } = await productCache.getProductsByCategory(params.slug);

  return (
    <div className="min-h-screen">
      <CategoryHero category={category} />
      <CategoryContent products={products} categoryName={category.name} />
    </div>
  );
}

// Enable ISR with a 1 hour revalidation period
export const revalidate = 3600;
