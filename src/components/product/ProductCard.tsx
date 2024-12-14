'use client';

import { memo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export interface ProductCardProps {
  id: number;
  name: string;
  price: string;
  image?: string;
  stockStatus?: string;
  shortDescription?: string;
  sku?: string;
  slug: string;
}

function ProductCardComponent({ 
  id, 
  name, 
  price, 
  image,
  stockStatus = 'instock',
  shortDescription = '',
  sku: _sku = '',
  slug,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = () => {
    addToCart({
      product_id: id,
      name,
      price: parseFloat(price),
      quantity: 1,
      image: image || '/placeholder.jpg'
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <Link href={`/product/${slug}`} className="group flex-grow">
        <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-gray-100">
          {!imageError && image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover object-center group-hover:opacity-75"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>
        <div className="flex flex-col flex-grow p-4">
          <h3 className="text-sm font-medium text-gray-900">{name}</h3>
          <div className="mt-1 flex-grow">
            <p className="text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: shortDescription }} />
          </div>
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-900">${parseFloat(price).toFixed(2)}</p>
          </div>
        </div>
      </Link>
      <div className="p-4 pt-0">
        <button
          onClick={handleAddToCart}
          disabled={stockStatus !== 'instock'}
          className={`w-full rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm ${
            stockStatus === 'instock'
              ? 'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {stockStatus === 'instock' ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}

export default memo(ProductCardComponent);