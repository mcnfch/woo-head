import type { Metadata } from 'next';
import { categoryCache } from '@/lib/cache/categoryCache';
import { getProducts } from '@/lib/woocommerce';
import ProductGrid from '@/components/product/ProductGrid';
import { CategoryHero } from '@/components/category/CategoryHero';
import { NoProductsFound } from '@/components/product/NoProductsFound';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = params;
  
  try {
    const categories = await categoryCache.getAllCategories();
    const category = categories.find(cat => {
      console.log(`Comparing category slug: "${cat.slug}" with requested: "${slug}"`);
      return cat.slug === slug;
    });
    
    if (category) {
      return {
        title: `${category.name} | Festival Rave Gear`,
        description: category.description || `Shop our collection of ${category.name}`,
      };
    }
  } catch (error) {
    console.error(`[CategoryPage] Error generating metadata for slug: ${slug}`, error);
  }

  return {
    title: 'Category Not Found | Festival Rave Gear',
    description: 'The requested category could not be found.',
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = params;
  
  try {
    const categories = await categoryCache.getAllCategories();
    const category = categories.find(cat => cat.slug === slug);
      
    if (!category) {
      return <NoProductsFound categoryName={slug} />;
    }

    const { products } = await getProducts(category.slug);

    if (!products?.length) {
      return <NoProductsFound categoryName={category.name} />;
    }

    return (
      <div>
        <CategoryHero category={category} />
        <ProductGrid products={products} />
      </div>
    );
  } catch (error) {
    console.error(`[CategoryPage] Error rendering category page for slug: "${slug}"`, error);
    return <NoProductsFound categoryName={slug} />;
  }
}
