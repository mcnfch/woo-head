'use client';

import Link from 'next/link';
import type { WooCategory } from '@/lib/types';
import type { WooPage } from '@/lib/woocommerce';
import menuConfig from '@/config/menu.json';

interface NavigationProps {
  categories: WooCategory[];
  pages: WooPage[];
}

interface MenuItem {
  title: string;
  type: 'product' | 'non-product';
  visible: boolean;
  order: number;
}

interface DropdownProps {
  title: string;
  items: WooCategory[];
}

function Dropdown({ title, items }: DropdownProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="group relative inline-block">
      <button className="text-white hover:text-purple-200 transition-colors px-3 py-2 text-sm font-medium inline-flex items-center">
        {title}
        <svg
          className="ml-1 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="absolute left-0 mt-0 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
        <div className="relative top-2 p-2 bg-white rounded-md shadow-lg">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/${item.slug}`}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-100 hover:text-purple-900 rounded-md"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StaticLink({ title, href }: { title: string; href: string }) {
  return (
    <Link href={href} className="text-white hover:text-purple-200 transition-colors px-3 py-2 text-sm font-medium">
      {title}
    </Link>
  );
}

export function Navigation({ categories }: NavigationProps) {
  // Build a map of parent categories to their children
  const categoryMap = new Map<number, WooCategory[]>();
  const rootCategories = new Map<string, WooCategory>();
  
  // First, organize all categories by their relationships
  categories.forEach(category => {
    if (category.parent === 0) {
      rootCategories.set(category.name, category);
    } else {
      const children = categoryMap.get(category.parent) || [];
      children.push(category);
      categoryMap.set(category.parent, children);
    }
  });

  // Get menu items and sort by order
  const menuItems = menuConfig.menuItems
    .filter(item => {
      if (item.type === 'non-product') return item.visible;
      return item.visible;
    })
    .sort((a, b) => a.order - b.order);

  return (
    <nav className="bg-[#32143e] w-full">
      <div className="container mx-auto">
        <div className="flex justify-center items-center h-12">
          <div className="flex space-x-8">
            {menuItems.map((item) => {
              if (item.type === 'product') {
                // Find the matching root category by name
                const rootCategory = rootCategories.get(item.title);
                
                if (!rootCategory) {
                  console.log(`No matching category found for menu item: ${item.title}`);
                  return null;
                }
                
                // Get all child categories for this root category
                const children = categoryMap.get(rootCategory.id) || [];
                
                if (children.length > 0) {
                  return (
                    <Dropdown
                      key={rootCategory.slug}
                      title={rootCategory.name}
                      items={children.sort((a, b) => a.name.localeCompare(b.name))}
                    />
                  );
                }
                
                return (
                  <StaticLink
                    key={rootCategory.slug}
                    title={rootCategory.name}
                    href={`/${rootCategory.slug}`}
                  />
                );
              }
              
              // For non-product items (like "About", "Contact", etc.)
              const href = item.type === 'non-product' && 'slug' in item ? `/${item.slug}` : `/${item.title.toLowerCase()}`;
              return (
                <StaticLink
                  key={item.title}
                  title={item.title}
                  href={href}
                />
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}