import type { WooCategory } from '@/lib/types';
import menuConfig from '@/config/menu.json';

// Categories that should never be displayed
const EXCLUDED_SLUGS = ['uncategorized'];

interface MenuItem {
  title: string;
  type: 'product' | 'non-product';
  visible: boolean;
  order: number;
}

interface MenuConfig {
  menuItems: MenuItem[];
}

export function filterAndSortCategories(categories: WooCategory[], options: {
  parentOnly?: boolean;
  maxItems?: number;
  forFooter?: boolean;
} = {}): WooCategory[] {
  const { parentOnly = true, maxItems, forFooter = false } = options;
  const config = menuConfig as MenuConfig;
  
  // Create a map of menu items for quick lookup
  const menuItemsMap = new Map(
    config.menuItems.map(item => [item.title.toLowerCase(), item])
  );

  return categories
    .filter(category => {
      // Basic exclusions
      if (EXCLUDED_SLUGS.includes(category.slug)) return false;
      if (category.count === 0) return false;
      if (parentOnly && category.parent !== 0) return false;

      // For footer, we might want to show all valid categories
      if (forFooter) return true;

      // Check if category is configured in menu
      const menuItem = menuItemsMap.get(category.name.toLowerCase());
      return menuItem?.visible ?? false;
    })
    .sort((a, b) => {
      // Get menu items for both categories
      const aMenuItem = menuItemsMap.get(a.name.toLowerCase());
      const bMenuItem = menuItemsMap.get(b.name.toLowerCase());

      // If both have menu items, sort by order
      if (aMenuItem && bMenuItem) {
        return aMenuItem.order - bMenuItem.order;
      }

      // If only one has a menu item, prioritize it
      if (aMenuItem) return -1;
      if (bMenuItem) return 1;

      // For items not in menu (like in footer), sort by product count
      return (b.count || 0) - (a.count || 0);
    })
    .slice(0, maxItems || undefined);
}

export function getCategoryBySlug(categories: WooCategory[], slug: string): WooCategory | undefined {
  // Don't return excluded categories
  if (EXCLUDED_SLUGS.includes(slug)) return undefined;
  
  return categories.find(category => category.slug === slug);
}

export function isValidCategory(category: WooCategory): boolean {
  if (EXCLUDED_SLUGS.includes(category.slug)) return false;
  if (category.count === 0) return false;
  
  const config = menuConfig as MenuConfig;
  const menuItem = config.menuItems.find(
    item => item.title.toLowerCase() === category.name.toLowerCase()
  );
  
  return menuItem?.visible ?? false;
}
