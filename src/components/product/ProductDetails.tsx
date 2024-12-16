'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import type { WooProduct, ProductVariation, ProductAttribute } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { AddToCartButton } from './AddToCartButton';
import { CartSlideOver } from '../cart/CartSlideOver';
import { woocommerce } from '@/lib/woocommerce';

interface ProductDetailsProps {
  product: WooProduct;
}

interface SelectedAttributes {
  [key: string]: string;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { addToCart } = useCart();
  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttributes>({});
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [isAddToCartEnabled, setIsAddToCartEnabled] = useState(false);
  const [cartSlideOverOpen, setCartSlideOverOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<WooProduct[]>([]);

  // Check if all required attributes are selected
  useEffect(() => {
    if (!product.attributes || product.attributes.length === 0) {
      setIsAddToCartEnabled(true);
      return;
    }

    const requiredAttributes = product.attributes.filter(attr => attr.variation);
    const hasAllRequired = requiredAttributes.every(attr => 
      selectedAttributes[attr.name] && selectedAttributes[attr.name] !== ''
    );

    setIsAddToCartEnabled(hasAllRequired);
  }, [product.attributes, selectedAttributes]);

  // Fetch random products for "Frequently Bought Together"
  useEffect(() => {
    async function fetchRandomProducts() {
      try {
        const response = await woocommerce.get('products', {
          per_page: 4,
          exclude: [product.id]
        });
        if (response.data && Array.isArray(response.data)) {
          setRelatedProducts(response.data);
        }
      } catch (error) {
        console.error('Error fetching related products:', error);
      }
    }
    fetchRandomProducts();
  }, [product.id]);

  const handleAttributeChange = (name: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddToCart = async () => {
    try {
      await addToCart({
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        image: product.images[0]?.src,
        variation_id: selectedVariation?.id,
        attributes: Object.entries(selectedAttributes).map(([name, option]) => ({
          id: product.attributes?.find(attr => attr.name === name)?.id || 0,
          name,
          option
        }))
      });
      setCartSlideOverOpen(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleAddAllToCart = async () => {
    try {
      // Add current product
      await addToCart({
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        image: product.images[0]?.src,
        variation_id: selectedVariation?.id,
        attributes: Object.entries(selectedAttributes).map(([name, option]) => ({
          id: product.attributes?.find(attr => attr.name === name)?.id || 0,
          name,
          option
        }))
      });

      // Add related products
      for (const relatedProduct of relatedProducts) {
        await addToCart({
          product_id: relatedProduct.id,
          name: relatedProduct.name,
          price: parseFloat(relatedProduct.price),
          quantity: 1,
          image: relatedProduct.images[0]?.src
        });
      }

      setCartSlideOverOpen(true);
    } catch (error) {
      console.error('Error adding products to cart:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:max-w-7xl lg:px-8">
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
        {/* Image gallery */}
        <div className="relative">
          {product.images[0]?.src && (
            <div className="w-full aspect-square rounded-lg overflow-hidden">
              <Image
                src={product.images[0].src}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-center object-cover"
              />
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>
          <div className="mt-3">
            <h2 className="sr-only">Product information</h2>
            <p className="text-3xl text-gray-900">${parseFloat(product.price).toFixed(2)}</p>
          </div>

          <div className="mt-6">
            <h3 className="sr-only">Description</h3>
            <div 
              className="text-base text-gray-700 space-y-6"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>

          <div className="mt-6">
            {product.attributes?.map((attr) => (
              <div key={attr.id} className="mb-4">
                <label htmlFor={attr.name} className="block text-sm font-medium text-gray-700">
                  {attr.name}
                </label>
                <select
                  id={attr.name}
                  name={attr.name}
                  value={selectedAttributes[attr.name] || ''}
                  onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                >
                  <option value="">Select {attr.name}</option>
                  {attr.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <AddToCartButton
              productId={product.id}
              variationId={selectedVariation?.id}
              disabled={!isAddToCartEnabled}
              className="w-full"
              onAddToCart={() => setCartSlideOverOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Frequently Bought Together</h2>
          <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <div key={relatedProduct.id} className="group relative">
                {relatedProduct.images[0]?.src && (
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-200">
                    <Image
                      src={relatedProduct.images[0].src}
                      alt={relatedProduct.name}
                      width={300}
                      height={300}
                      className="w-full h-full object-center object-cover group-hover:opacity-75"
                    />
                  </div>
                )}
                <div className="mt-4 flex justify-between">
                  <div>
                    <h3 className="text-sm text-gray-700">
                      <Link href={`/product/${relatedProduct.slug}`}>
                        {relatedProduct.name}
                      </Link>
                    </h3>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    ${parseFloat(relatedProduct.price).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <Link href="/cart" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          View cart
        </Link>
        <Link href="/checkout" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 ml-4">
          Checkout
        </Link>
      </div>

      <CartSlideOver
        isOpen={cartSlideOverOpen}
        onClose={() => setCartSlideOverOpen(false)}
      />
    </div>
  );
}
