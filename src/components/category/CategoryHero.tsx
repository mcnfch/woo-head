import type { WooCategory } from '@/lib/types';

interface CategoryHeroProps {
  category: WooCategory;
}

export function CategoryHero({ category }: CategoryHeroProps) {
  return (
    <div className="bg-gradient-to-r from-purple-900 to-purple-700 py-12 mb-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-4">{category.name}</h1>
        {category.description && (
          <div 
            className="text-purple-100 prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: category.description }}
          />
        )}
      </div>
    </div>
  );
}
