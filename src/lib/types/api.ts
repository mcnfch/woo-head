export interface WooCommerceApiResponse<T> {
  data: T;
  headers?: {
    'x-wp-totalpages'?: string;
    [key: string]: string | undefined;
  };
}
