export interface WooImage {
  id: number;
  src: string;
  name: string;
  alt: string;
  date_created: string;
  date_modified: string;
}

export interface WooVariantAttribute {
  id: number;
  name: string;
  option: string;
}

export interface WooVariation {
  id: number;
  sku: string;
  price: string;
  attributes: WooVariantAttribute[];
}

export interface WooAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface ProductVariation {
  id: number;
  sku: string;
  price: string;
  attributes: WooVariantAttribute[];
}

export interface ProductAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  sku: string;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  description: string;
  short_description: string;
  images: WooImage[];
  attributes: WooAttribute[];
  variations: WooVariation[];
  average_rating?: string;
  rating_count?: number;
}

export interface CartItem {
  product_id: number;
  variation_id?: number;
  quantity: number;
  name: string;
  price?: number;
  image?: string;
  sku?: string;
  attributes?: WooVariantAttribute[];
  optionsRequired: boolean;
  optionsSelected: boolean;
  product?: WooProduct;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  total: number;
  totals?: {
    subtotal: string;
    total: string;
  };
}

export interface CartResponse {
  success: boolean;
  message: string;
  product_id: number;
  quantity: number;
  cart: CartState;
}

export interface AddToCartInput {
  product_id: number;
  variation_id?: number;
  quantity: number;
  name?: string;
  price?: number;
  image?: string;
  sku?: string;
  attributes?: WooVariantAttribute[];
}

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  roles: string[];
}

export interface UserRegistrationData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UserUpdateData {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}

export interface AddressData {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

export interface WooLinks {
  self: Array<{
    href: string;
    targetHints?: {
      allow: string[];
    };
  }>;
  collection: Array<{ href: string }>;
  up?: Array<{ href: string }>;
}

export interface WooCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: string;
  image: WooImage | null;
  menu_order: number;
  count: number;
  _links: WooLinks;
}

export interface WooPage {
  id: number;
  title: { rendered: string };
  slug: string;
  content: { rendered: string };
  status: string;
}

export interface CategoryNode extends WooCategory {
  children: CategoryNode[];
  menuOrder: number;
  visible: boolean;
  key: string;
}

export interface WooCommerceResponse<T> {
  data: T;
  headers?: {
    'x-wp-totalpages'?: string;
  };
}

export interface WooCommerceError {
  message: string;
  code: string;
  data: {
    status: number;
  };
}

export interface WooOrder {
  id: number;
  status: string;
  total: string;
  line_items: CartItem[];
  billing: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
}

export interface CartContextType {
  cart: CartState | null;
  loading: boolean;
  error: string | null;
  addToCart: (item: AddToCartInput) => Promise<CartResponse>;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

export function convertToNodes(categories: WooCategory[]): CategoryNode[] {
  // Create a map of id to category with children array
  const categoryMap = new Map<number, CategoryNode>();
  
  // First pass: Create CategoryNode objects for each category
  categories.forEach(category => {
    categoryMap.set(category.id, {
      ...category,
      children: [],
      menuOrder: category.menu_order,
      visible: true,
      key: category.id.toString()
    });
  });
  
  // Second pass: Build the tree structure
  const roots: CategoryNode[] = [];
  categoryMap.forEach(node => {
    if (node.parent === 0) {
      // This is a root node
      roots.push(node);
    } else {
      // This is a child node
      const parent = categoryMap.get(node.parent);
      if (parent) {
        parent.children.push(node);
      }
    }
  });
  
  // Sort the categories
  const sortCategories = (categories: CategoryNode[]) => {
    categories.sort((a, b) => a.menuOrder - b.menuOrder);
    categories.forEach(category => {
      if (category.children.length > 0) {
        sortCategories(category.children);
      }
    });
  };
  
  sortCategories(roots);
  return roots;
}