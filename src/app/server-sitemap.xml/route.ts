import { getProducts, getCategories } from '@/lib/woocommerce';
import type { WooProduct, WooCategory } from '@/lib/types';

export async function GET(): Promise<Response> {
  // Fetch all products and categories
  const [productsResponse, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  // Create sitemap entries
  const entries = [
    {
      url: process.env.SITE_URL!,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // Products
    ...productsResponse.products.map((product: WooProduct) => ({
      url: `${process.env.SITE_URL}/product/${product.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    })),
    // Categories
    ...categories.map((category: WooCategory) => ({
      url: `${process.env.SITE_URL}/category/${category.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    })),
  ];

  // Convert to XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${entries.map((entry) => `
        <url>
          <loc>${entry.url}</loc>
          <lastmod>${entry.lastModified.toISOString()}</lastmod>
          <changefreq>${entry.changeFrequency}</changefreq>
          <priority>${entry.priority}</priority>
        </url>
      `).join('')}
    </urlset>`;

  // Return as XML response
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}