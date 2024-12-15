'use client';

import { useState, useEffect } from 'react';
import { ProductGallery } from './ProductGallery';
import type { WooProduct, WooVariation, WooVariantAttribute } from '@/lib/types';
import { useCart } from '@/context/CartContext';
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
  const [selectedVariation, setSelectedVariation] = useState<WooVariation | null>(null);
  const [isAddToCartEnabled, setIsAddToCartEnabled] = useState(false);
  const [cartSlideOverOpen, setCartSlideOverOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<WooProduct[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Fetch variations when component mounts
  const [variations, setVariations] = useState<WooVariation[]>([]);
  
  useEffect(() => {
    async function fetchVariations() {
      try {
        const response = await woocommerce.get(`products/${product.id}/variations`, {
          per_page: 100
        });
        setVariations(response.data);
      } catch (error) {
        console.error('Error fetching variations:', error);
      }
    }
    
    if (product.type === 'variable') {
      fetchVariations();
    }
  }, [product.id, product.type]);

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

    // Find matching variation
    if (hasAllRequired && variations.length > 0) {
      const matchingVariation = variations.find(variation => 
        variation.attributes.every(attr => 
          selectedAttributes[attr.name] === attr.option
        )
      );
      setSelectedVariation(matchingVariation || null);
    } else {
      setSelectedVariation(null);
    }
  }, [product.attributes, selectedAttributes, variations]);

  // Fetch random products for "Frequently Bought Together"
  useEffect(() => {
    async function fetchRandomProducts() {
      try {
        const response = await woocommerce.get('products', {
          per_page: 10,
          exclude: [product.id]
        });
        
        const shuffled = response.data as WooProduct[];
        const selectedProducts = shuffled
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        
        setRelatedProducts(selectedProducts);
      } catch (error) {
        console.error('Error fetching related products:', error);
      }
    }

    fetchRandomProducts();
  }, [product.id]);

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
        price: parseFloat(selectedVariation?.price || product.price),
        quantity: quantity,
        image: selectedVariation?.image?.src || product.images[0]?.src,
        variation_id: selectedVariation?.id,
        attributes: Object.entries(selectedAttributes).map(([name, option]) => ({
          id: product.attributes?.find(attr => attr.name === name)?.id || 0,
          name,
          option
        }))
      });
      setCartSlideOverOpen(true);
    } catch (error) {
      console.error('Error adding product to cart:', error);
    }
  };

  const handleAddAllToCart = async () => {
    try {
      // Add current product with current quantity
      await handleAddToCart();

      // Add related products with quantity 1
      for (const relatedProduct of relatedProducts) {
        await addToCart({
          product_id: relatedProduct.id,
          name: relatedProduct.name,
          price: parseFloat(relatedProduct.price),
          quantity: 1,
          image: relatedProduct.images[0]?.src,
          attributes: []
        });
      }

      setCartSlideOverOpen(true);
    } catch (error) {
      console.error('Error adding products to cart:', error);
    }
  };

  return (
    <div className="bg-white w-[1024px] mx-auto">
      <div className="px-[10px] py-8">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Main Product Section */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product Image */}
              <div className="relative">
                <ProductGallery 
                  images={product.images} 
                  variantImage={selectedVariation?.image || null}
                />
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                
                <div className="text-2xl font-semibold text-purple-600">
                  ${parseFloat(selectedVariation?.price || product.price).toFixed(2)}
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-semibold">Stock Status:</span>
                  <span className={product.stock_status === 'instock' ? 'text-green-600' : 'text-red-600'}>
                    {product.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                
                <div 
                  className="prose prose-sm text-gray-700"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
                
                {/* Product Attributes/Variations */}
                {product.attributes && product.attributes.length > 0 && (
                  <div className="space-y-4">
                    {product.attributes.filter(attr => attr.variation).map((attribute, attrIndex) => (
                      <div key={`${product.id}-${attribute.name}-${attrIndex}`}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {attribute.name}
                        </label>
                        <select
                          value={selectedAttributes[attribute.name] || ''}
                          onChange={(e) => handleAttributeChange(attribute.name, e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        >
                          <option value="">Select {attribute.name}</option>
                          {attribute.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="flex items-center space-x-4">
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <select
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!isAddToCartEnabled}
                  className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                    !isAddToCartEnabled 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  } transition-colors`}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>

          {/* Frequently Bought Together Section */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Bought Together</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedProducts.map((relatedProduct) => (
                    <div key={`related-${relatedProduct.id}`} className="flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
                      <div className="p-4">
                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                          <img
                            src={relatedProduct.images[0]?.src || '/placeholder.jpg'}
                            alt={relatedProduct.name}
                            className="object-cover"
                          />
                        </div>
                        <div className="mt-4">
                          <h3 className="text-sm font-medium text-gray-900">{relatedProduct.name}</h3>
                          <p className="mt-1 text-sm font-medium text-purple-600">
                            ${parseFloat(relatedProduct.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
