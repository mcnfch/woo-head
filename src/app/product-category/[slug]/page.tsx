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
    // Log the attempt
    console.log(`\n[CategoryPage] Attempting to fetch category: "${slug}"`);
    
    const categories = await categoryCache.getAllCategories();
    
    // Debug: Log all categories with more details
    console.log('\nAll available categories:');
    categories.forEach(cat => {
      console.log(`Category: "${cat.name}"`);
      console.log(`  slug: "${cat.slug}"`);
      console.log(`  id: ${cat.id}`);
      console.log(`  parent: ${cat.parent}`);
      console.log(`  count: ${cat.count}`);
    });
    
    const category = categories.find(cat => cat.slug === slug);
    
    if (!category) {
      console.log(`[CategoryPage] Category not found: "${slug}"`);
      return <NoProductsFound categoryName={slug} />;
    }

    console.log(`[CategoryPage] Found category: ${category.name} (id: ${category.id})`);
    const { products } = await getProducts(category.slug);

    if (!products?.length) {
      console.log(`[CategoryPage] No products found for category: ${category.name}`);
      return <NoProductsFound categoryName={category.name} />;
    }

    console.log(`[CategoryPage] Found ${products.length} products for category: ${category.name}`);
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
