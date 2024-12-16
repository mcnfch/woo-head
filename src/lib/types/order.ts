export interface WooOrderLineItem {
  product_id: number;
  quantity: number;
  variation_id?: number;
}

export interface WooAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface CreateDraftOrderRequest {
  status: 'processing' | 'on-hold' | 'completed' | 'cancelled';
  payment_method?: string;
  payment_method_title?: string;
  billing: WooAddress;
  shipping: WooAddress;
  line_items: WooOrderLineItem[];
  shipping_lines?: Array<{
    method_id: string;
    method_title: string;
    total: string;
  }>;
}

export interface WooOrder extends Omit<CreateDraftOrderRequest, 'status'> {
  id: number;
  status: string;
  total: string;
  total_tax: string;
  date_created: string;
  date_modified: string;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    quantity: number;
    total: string;
  }>;
}
