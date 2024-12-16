import NodeCache from 'node-cache';
import { woocommerce } from '../woocommerce';
import type { WooProduct } from '@/types/woocommerce';

const ITEMS_PER_PAGE = 100;

class ProductCache {
  private cache: NodeCache;
  private static instance: ProductCache;

  private constructor() {
    this.cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache
  }

  public static getInstance(): ProductCache {
    if (!ProductCache.instance) {
      ProductCache.instance = new ProductCache();
    }
    return ProductCache.instance;
  }

  private normalizeSlug(slug: string): string {
    return decodeURIComponent(slug)
      .toLowerCase()
      .replace(/[''"]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/\/+$/, '')
      .replace(/^product\//, '');
  }

  private getProductKey(slug: string): string {
    return `product:${this.normalizeSlug(slug)}`;
  }

  private getCategoryKey(slug: string): string {
    return `category:${this.normalizeSlug(slug)}`;
  }

  async getProductBySlug(slug: string): Promise<WooProduct | null> {
    console.log(`[ProductCache] Looking up product with original slug: "${slug}"`);
    const normalizedSlug = this.normalizeSlug(slug);
    
    const cacheKey = this.getProductKey(normalizedSlug);
    const cachedProduct = this.cache.get<WooProduct>(cacheKey);

    if (cachedProduct) {
      console.log(`[ProductCache] Found product in cache: ${cachedProduct.name}`);
      return cachedProduct;
    }

    try {
      // Try direct slug lookup first
      console.log(`[ProductCache] Trying direct slug lookup: "${normalizedSlug}"`);
      const { data: products } = await woocommerce.get<WooProduct[]>('products', {
        slug: normalizedSlug,
        status: 'publish',
        per_page: ITEMS_PER_PAGE
      });

      console.log(`[ProductCache] Direct lookup returned ${products.length} products`);
      products.forEach(p => console.log(`[ProductCache] Found product: ${p.name} (${p.slug})`));

      if (products && products.length > 0) {
        const product = products[0];
        console.log(`[ProductCache] Found product by direct lookup: ${product.name}`);
        this.cache.set(cacheKey, product);
        return product;
      }

      // If not found by slug, try searching
      console.log(`[ProductCache] Product not found by slug, trying search...`);
      const searchTerm = normalizedSlug.replace(/-/g, ' ');
      console.log(`[ProductCache] Search term: "${searchTerm}"`);
      
      const { data: searchProducts } = await woocommerce.get<WooProduct[]>('products', {
        search: searchTerm,
        status: 'publish',
        per_page: ITEMS_PER_PAGE
      });

      console.log(`[ProductCache] Search returned ${searchProducts.length} products`);
      searchProducts.forEach(p => console.log(`[ProductCache] Search result: ${p.name} (${p.slug})`));

      // Look for best match
      const bestMatch = searchProducts.find(p => {
        const productSlug = this.normalizeSlug(p.slug || '');
        const isMatch = productSlug.includes(normalizedSlug) || normalizedSlug.includes(productSlug);
        console.log(`[ProductCache] Comparing "${productSlug}" with "${normalizedSlug}": ${isMatch}`);
        return isMatch;
      });

      if (bestMatch) {
        console.log(`[ProductCache] Found product by search: ${bestMatch.name}`);
        this.cache.set(cacheKey, bestMatch);
        return bestMatch;
      }

      console.log(`[ProductCache] No product found for slug: ${slug}`);
      this.cache.set(cacheKey, null);
      return null;
    } catch (error) {
      console.error('[ProductCache] Error fetching product:', error);
      return null;
    }
  }

  async getProductsByCategory(categorySlug?: string, page = 1): Promise<{ products: WooProduct[]; totalPages: number }> {
    const cacheKey = categorySlug ? this.getCategoryKey(`${categorySlug}:${page}`) : `all:${page}`;
    const cachedResult = this.cache.get<{ products: WooProduct[]; totalPages: number }>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    try {
      const params: Record<string, any> = {
        per_page: ITEMS_PER_PAGE,
        page,
        status: 'publish'
      };

      if (categorySlug) {
        const categoryResponse = await woocommerce.get('products/categories', {
          slug: categorySlug
        });

        const categories = categoryResponse.data;
        if (categories && categories.length > 0) {
          params.category = categories[0].id;
        }
      }

      const response = await woocommerce.get('products', params);
      const totalPages = parseInt(response.headers?.['x-wp-totalpages'] || '1', 10);
      const result = {
        products: response.data,
        totalPages
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[ProductCache] Error fetching products:', error);
      this.cache.set(cacheKey, { products: [], totalPages: 0 }); // Set cache to empty result on error
      return { products: [], totalPages: 0 };
    }
  }

  clearCache(): void {
    this.cache.flushAll();
  }

  invalidateProduct(productId: string): void {
    const keys = this.cache.keys();
    const productKeys = keys.filter(key => key.includes(productId));
    productKeys.forEach(key => this.cache.del(key));
  }

  invalidateCache(): void {
    this.clearCache();
  }
}

export const productCache = ProductCache.getInstance();
