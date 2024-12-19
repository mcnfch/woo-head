import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import type { WooProduct, WooCategory, WooCommerceError } from './types';
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
  throw new Error('NEXT_PUBLIC_WOOCOMMERCE_URL is not defined');
}

if (!process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY) {
  console.error('NEXT_PUBLIC_WOOCOMMERCE_KEY is missing');
  throw new Error('NEXT_PUBLIC_WOOCOMMERCE_KEY is not defined');
}

if (!process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET) {
  console.error('NEXT_PUBLIC_WOOCOMMERCE_SECRET is missing');
  throw new Error('NEXT_PUBLIC_WOOCOMMERCE_SECRET is not defined');
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
});

// Custom fetch function with error handling
async function customFetch<T>(endpoint: string, options = {}): Promise<T | null> {
  try {
    console.log(`[WooCommerce] Fetching ${endpoint} with options:`, options);
    const response = await woocommerce.get<T>(endpoint, options);
    console.log(`[WooCommerce] Successfully fetched ${endpoint}`);
    return response.data;
  } catch (error) {
    if (isWooCommerceError(error)) {
      console.error(`[WooCommerce] API Error for ${endpoint}:`, error.message);
      if (error.data?.status === 404) {
        return null;
      }
    } else {
      console.error(`[WooCommerce] Unknown error for ${endpoint}:`, error);
    }
    throw error;
  }
}

export async function getCategories(): Promise<WooCategory[]> {
  try {
    console.log('[WooCommerce] Fetching categories...');
    const response = await woocommerce.get<WooCategory[]>('products/categories', {
      per_page: 100,
      hide_empty: false
    });
    console.log(`[WooCommerce] Successfully fetched ${response.data.length} categories`);
    return response.data;
  } catch (error) {
    console.error('[WooCommerce] Error fetching categories:', error);
    return [];
  }
}

export async function getProduct(slug: string): Promise<WooProduct | null> {
  try {
    console.log(`[WooCommerce] Looking up product with slug: ${slug}`);
    
    // Try direct slug lookup first
    const response = await woocommerce.get<WooProduct[]>('products', {
      slug: decodeURIComponent(slug),
      status: 'publish'
    });

    if (response.data && response.data.length > 0) {
      console.log(`[WooCommerce] Found product by slug: ${response.data[0].name}`);
      return response.data[0];
    }

    // If not found, try searching
    console.log(`[WooCommerce] Product not found by slug, trying search...`);
    const searchResponse = await woocommerce.get<WooProduct[]>('products', {
      search: slug.replace(/-/g, ' '),
      status: 'publish',
      per_page: 100
    });

    const matchingProduct = searchResponse.data.find(p => p.slug === slug);
    if (matchingProduct) {
      console.log(`[WooCommerce] Found product by search: ${matchingProduct.name}`);
      return matchingProduct;
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
    const params: any = {
      per_page: 100,
      status: 'publish'
    };

    if (categorySlug) {
      const categories = await getCategories();
      const category = categories.find(cat => cat.slug === categorySlug);
      if (category) {
        params.category = category.id;
      }
    }

    const response = await woocommerce.get<WooProduct[]>('products', params);
    console.log('[WooCommerce] API Response:', {
      params,
      totalProducts: response.data.length,
      headers: response.headers
    });
    const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1', 10);

    console.log(`[WooCommerce] Successfully fetched ${response.data.length} products`);
    return { 
      products: response.data,
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
    function buildCategoryTree(categories: WooCategory[], parentId = 0): WooCategory[] {
      return categories
        .filter(category => category.parent === parentId)
        .map(category => ({
          ...category,
          children: buildCategoryTree(categories, category.id)
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

interface WooPage {
  id: number;
  title: { rendered: string };
  slug: string;
  content: { rendered: string };
  status: string;
}

interface WooPost {
  id: number;
  title: { rendered: string };
  slug: string;
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  featured_media: number;
  status: string;
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
    return pages;
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
    return response.json();
  } catch (error) {
    console.error('[WooCommerce] Error fetching posts:', error);
    return [];
  }
}

// Function to get a single blog post by ID
export async function getBlogPost(id: number): Promise<WooPost | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/wp-json/wp/v2/posts/${id}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

// Alias for getPosts to maintain compatibility
export const getBlogPosts = getPosts;

export async function testConnection() {
  try {
    console.log('[WooCommerce] Testing connection...');
    const response = await woocommerce.get('');
    console.log('[WooCommerce] Successfully connected to WooCommerce API');
    return {
      success: true,
      message: 'Successfully connected to WooCommerce API'
    };
  } catch (error) {
    console.error('[WooCommerce] Error testing connection:', error);
    return {
      success: false,
      message: isWooCommerceError(error) ? error.message : 'Unknown error occurred'
    };
  }
}