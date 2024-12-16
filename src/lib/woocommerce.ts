import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import type { 
  WooProduct, 
  WooCategory, 
  WooCommerceError 
} from './types';
import type { WooCommerceApiResponse } from './types/api';
import type { CreateDraftOrderRequest, WooOrder } from './types/order';
import { productCache } from './cache/productCache';
import { categoryCache } from './cache/categoryCache';

function isWooCommerceError(error: unknown): error is WooCommerceError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  );
}

if (!process.env.NEXT_PUBLIC_WOOCOMMERCE_URL) {
  console.error('NEXT_PUBLIC_WOOCOMMERCE_URL is missing');
  throw new Error('NEXT_PUBLIC_WOOCOMMERCE_URL is required');
}

if (!process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY) {
  console.error('NEXT_PUBLIC_WOOCOMMERCE_KEY is missing');
  throw new Error('NEXT_PUBLIC_WOOCOMMERCE_KEY is required');
}

if (!process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET) {
  console.error('NEXT_PUBLIC_WOOCOMMERCE_SECRET is missing');
  throw new Error('NEXT_PUBLIC_WOOCOMMERCE_SECRET is required');
}

console.log('[WooCommerce] API Configuration:', {
  url: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL,
  hasKey: !!process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY,
  hasSecret: !!process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET
});

console.log(`[WooCommerce] Initializing API with URL: ${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}`);

export const woocommerce = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL,
  consumerKey: process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY,
  consumerSecret: process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET,
  version: 'wc/v3',
  queryStringAuth: true,
  axiosConfig: {
    headers: {
      'Accept': 'application/json'
    }
  }
});

async function customFetch<T>(endpoint: string, options: Record<string, any> = {}): Promise<T | null> {
  try {
    const response = await woocommerce.get(endpoint, options);
    return response.data;
  } catch (error) {
    if (isWooCommerceError(error)) {
      console.error(`WooCommerce API Error: ${error.message}`);
    } else {
      console.error('Unknown API Error:', error);
    }
    return null;
  }
}

export async function getCategories(): Promise<WooCategory[]> {
  try {
    console.log('[WooCommerce] Fetching categories...');
    const response = await customFetch<WooCategory[]>('products/categories', {
      per_page: 100,
      hide_empty: false
    });
    console.log(`[WooCommerce] Successfully fetched ${response?.length || 0} categories`);
    return response || [];
  } catch (error) {
    console.error('[WooCommerce] Error fetching categories:', error);
    return [];
  }
}

export async function getProduct(slug: string): Promise<WooProduct | null> {
  try {
    console.log(`[WooCommerce] Looking up product with slug: ${slug}`);
    
    // Try direct slug lookup first
    const products = await customFetch<WooProduct[]>('products', {
      slug: decodeURIComponent(slug),
      status: 'publish'
    });

    if (products && products.length > 0) {
      const product = products[0];
      if (product) {
        console.log(`[WooCommerce] Found product by slug: ${product.name}`);
        return product;
      }
    }

    // If not found, try searching
    console.log(`[WooCommerce] Product not found by slug, trying search...`);
    const searchProducts = await customFetch<WooProduct[]>('products', {
      search: slug.replace(/-/g, ' '),
      status: 'publish',
      per_page: 100
    });

    if (searchProducts && searchProducts.length > 0) {
      const matchingProduct = searchProducts.find((p: WooProduct) => p.slug === slug);
      if (matchingProduct) {
        console.log(`[WooCommerce] Found product by search: ${matchingProduct.name}`);
        return matchingProduct;
      }
    }

    console.log(`[WooCommerce] No product found for slug: ${slug}`);
    return null;
  } catch (error) {
    console.error('[WooCommerce] Error fetching product:', error);
    return null;
  }
}

export async function getProducts(categorySlug?: string): Promise<{ products: WooProduct[], totalPages: number }> {
  try {
    console.log(`[WooCommerce] Fetching products for category: ${categorySlug || 'all'}`);
    const params: Record<string, any> = {
      per_page: 100,
      status: 'publish'
    };

    if (categorySlug) {
      const categories = await customFetch<WooCategory[]>('products/categories', {
        per_page: 100,
        hide_empty: false
      });
      if (categories) {
        const category = categories.find(cat => cat.slug === categorySlug);
        if (category) {
          params.category = category.id;
        }
      }
    }

    const response = await woocommerce.get<WooCommerceApiResponse<WooProduct[]>>('products', params);
    const products = response.data.data || [];
    const totalPages = parseInt(response.data.headers?.['x-wp-totalpages'] || '1', 10);

    console.log(`[WooCommerce] Successfully fetched ${products.length} products`);
    return { 
      products,
      totalPages 
    };
  } catch (error) {
    console.error('[WooCommerce] Error fetching products:', error);
    return { products: [], totalPages: 0 };
  }
}

export async function getAllCategories(): Promise<WooCategory[]> {
  try {
    console.log('[WooCommerce] Fetching all categories');
    const response = await woocommerce.get<WooCategory[]>('products/categories', {
      per_page: 100,
      hide_empty: false
    });

    const categories = response.data;

    // Function to build category tree
    function buildCategoryTree(cats: WooCategory[], parentId = 0): WooCategory[] {
      return cats
        .filter((category: WooCategory) => category.parent === parentId)
        .map((category: WooCategory) => ({
          ...category,
          children: buildCategoryTree(cats, category.id)
        }));
    }

    // Build and return the category tree
    const tree = buildCategoryTree(categories);
    console.log(`[WooCommerce] Successfully built category tree with ${categories.length} categories`);
    return tree;
  } catch (error) {
    console.error('[WooCommerce] Error fetching all categories:', error);
    return [];
  }
}

export interface WooPage {
  id: number;
  title: { rendered: string };
  slug: string;
  content: { rendered: string };
  status: string;
}

export interface WooPost {
  id: number;
  title: { rendered: string };
  slug: string;
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  featured_media: number;
  status: string;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url?: string;
    }>;
  };
}

// Function to get WordPress pages
export async function getPages(): Promise<WooPage[]> {
  try {
    console.log('[WooCommerce] Fetching WordPress pages');
    const response = await fetch(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/wp/v2/pages`);
    if (!response.ok) {
      throw new Error('Failed to fetch pages');
    }
    const pages = await response.json();
    console.log(`[WooCommerce] Successfully fetched ${pages.length} pages`);
    return pages as WooPage[];
  } catch (error) {
    console.error('[WooCommerce] Error fetching pages:', error);
    return [];
  }
}

// Function to get blog posts
export async function getPosts(): Promise<WooPost[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/wp/v2/posts?_embed`);
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }
    return response.json() as Promise<WooPost[]>;
  } catch (error) {
    console.error('[WooCommerce] Error fetching posts:', error);
    return [];
  }
}

// Alias for getPosts to maintain compatibility
export const getBlogPosts = getPosts;

/**
 * Creates a draft order in WooCommerce
 * @param orderData Order data to create
 * @returns Created order or null if failed
 */
export async function createDraftOrder(orderData: CreateDraftOrderRequest): Promise<WooOrder | null> {
  try {
    console.log('[WooCommerce] Creating draft order with data:', JSON.stringify(orderData, null, 2));
    const response = await woocommerce.post<WooCommerceApiResponse<WooOrder>>('orders', {
      ...orderData,
      status: 'processing'  // Use processing for dropshipping workflow
    });
    
    const order = response.data.data;
    if (!order) {
      throw new Error('No order data received from API');
    }
    
    console.log(`[WooCommerce] Successfully created draft order ${order.id}`);
    return order;
  } catch (error) {
    if (isWooCommerceError(error)) {
      console.error('[WooCommerce] Error creating draft order:', error.message, '\nFull error:', error);
    } else {
      console.error('[WooCommerce] Unknown error creating draft order:', error);
    }
    return null;
  }
}

export async function testConnection() {
  try {
    console.log('[WooCommerce] Testing connection...');
    await woocommerce.get('');
    console.log('[WooCommerce] Successfully connected to WooCommerce API');
    return {
      success: true,
      message: 'Successfully connected to WooCommerce API'
    };
  } catch (error) {
    console.error('[WooCommerce] Connection test failed:', error);
    return {
      success: false,
      message: isWooCommerceError(error) ? error.message : 'Unknown error occurred'
    };
  }
}