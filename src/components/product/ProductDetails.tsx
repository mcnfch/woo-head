'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { WooProduct, ProductVariation, ProductAttribute } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { AddToCartButton } from './AddToCartButton';
import { CartSlideOver } from './CartSlideOver';

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

  const handleAttributeChange = (attributeName: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attributeName]: value
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="relative aspect-square">
          <Image
            src={product.images[0]?.src || '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover rounded-lg"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          
          <div className="text-2xl font-semibold text-purple-600">
            ${parseFloat(product.price).toFixed(2)}
          </div>
          
          <div 
            className="prose prose-sm"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
          
          {/* Product Attributes/Variations */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="space-y-4">
              {product.attributes.filter(attr => attr.variation).map((attribute) => (
                <div key={attribute.id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {attribute.name}
                  </label>
                  <select
                    value={selectedAttributes[attribute.name] || ''}
                    onChange={(e) => handleAttributeChange(attribute.name, e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select {attribute.name}</option>
                    {attribute.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">SKU:</span>
              <span>{product.sku}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Stock Status:</span>
              <span className={product.stock_status === 'instock' ? 'text-green-600' : 'text-red-600'}>
                {product.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!isAddToCartEnabled || product.stock_status !== 'instock'}
            className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
              isAddToCartEnabled && product.stock_status === 'instock'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {!isAddToCartEnabled ? 'Select Options' : product.stock_status === 'instock' ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>

      {/* Cart Slide Over */}
      <CartSlideOver
        isOpen={cartSlideOverOpen}
        onClose={() => setCartSlideOverOpen(false)}
      />
    </div>
  );
}
