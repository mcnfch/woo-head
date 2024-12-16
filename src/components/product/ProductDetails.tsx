'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import type { WooProduct, ProductVariation, WooVariantAttribute } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { AddToCartButton } from './AddToCartButton';
import SlideOutCart from '../cart/SlideOutCart';
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
  const [slideOutCartOpen, setSlideOutCartOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<WooProduct[]>([]);
  const [quantity, setQuantity] = useState(1);

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

  // Update selected variation when attributes change
  useEffect(() => {
    if (!product.variations || !product.attributes) return;

    const variations = product.variations;
    const matchingVariation = variations.find(variation => {
      return variation.attributes?.every(varAttr => {
        const selectedValue = selectedAttributes[varAttr.name];
        return selectedValue === varAttr.option;
      });
    });

    setSelectedVariation(matchingVariation || null);
  }, [product.variations, product.attributes, selectedAttributes]);

  const handleAttributeChange = (name: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getSelectedAttributesArray = (): WooVariantAttribute[] => {
    return Object.entries(selectedAttributes).map(([name, option]) => ({
      id: product.attributes?.find(attr => attr.name === name)?.id || 0,
      name,
      option
    }));
  };

  const handleAddToCart = async () => {
    try {
      await addToCart({
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: quantity,
        image: product.images[0]?.src,
        variation_id: selectedVariation?.id,
        attributes: getSelectedAttributesArray()
      });
      setSlideOutCartOpen(true);
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
        attributes: getSelectedAttributesArray()
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

      setSlideOutCartOpen(true);
    } catch (error) {
      console.error('Error adding products to cart:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
        {/* Product Image */}
        <div className="relative aspect-square">
          {product.images && product.images.length > 0 && (
            <Image
              src={product.images[0].src}
              alt={product.images[0].alt || product.name}
              fill
              className="object-cover rounded-lg"
            />
          )}
        </div>

        {/* Product Details */}
        <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>
          
          <div className="mt-3">
            <h2 className="sr-only">Product information</h2>
            <p className="text-3xl text-gray-900">${product.price}</p>
          </div>

          <div className="mt-6">
            <div className="text-base text-gray-700" dangerouslySetInnerHTML={{ __html: product.description }} />
          </div>

          {/* Product Attributes */}
          <div className="mt-8">
            {product.attributes?.map((attribute) => (
              <div key={attribute.id} className="mb-4">
                <label htmlFor={attribute.name} className="block text-sm font-medium text-gray-700">
                  {attribute.name}
                </label>
                <select
                  id={attribute.name}
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

          {/* Quantity Control */}
          <div className="mt-8">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              >
                -
              </button>
              <div className="relative flex items-center justify-center w-20 border-t border-b border-gray-300 bg-white text-sm text-gray-700">
                {quantity}
              </div>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <div className="mt-8">
            <AddToCartButton
              productId={product.id}
              variationId={selectedVariation?.id}
              product={product}
              selectedAttributes={getSelectedAttributesArray()}
              quantity={quantity}
              disabled={!isAddToCartEnabled}
              onAddToCart={() => setSlideOutCartOpen(true)}
              className="w-full"
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

      <SlideOutCart
        isOpen={slideOutCartOpen}
        onClose={() => setSlideOutCartOpen(false)}
      />
    </div>
  );
}
