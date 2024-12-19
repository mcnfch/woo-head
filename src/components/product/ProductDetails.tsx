'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { WooProduct, ProductVariation, ProductAttribute } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { AddToCartButton } from './AddToCartButton';
import { QuickAddModal } from '../cart/QuickAddModal';
import { woocommerce } from '@/lib/woocommerce';
import dynamic from 'next/dynamic';
import { ClientGallery } from './ClientGallery';
import SlideOutCart from '../cart/SlideOutCart';

const SlideOutCartDynamic = dynamic(() => import('../cart/SlideOutCart'), {
  ssr: false,
});

interface ProductDetailsProps {
  product: WooProduct;
}

interface SelectedAttributes {
  [key: string]: string;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { addToCart } = useCart();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [isAddToCartEnabled, setIsAddToCartEnabled] = useState(false);
  const [currentImages, setCurrentImages] = useState(product.images);
  const [cartSlideOverOpen, setCartSlideOverOpen] = useState(false);
  const [forcedImageIndex, setForcedImageIndex] = useState<number | undefined>(undefined);
  const [relatedProducts, setRelatedProducts] = useState<WooProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<WooProduct | null>(null);
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);

  // Initialize single-option attributes and handle shipping/country selection
  useEffect(() => {
    if (!product.attributes) return;

    const initialAttributes: SelectedAttributes = {};
    product.attributes.forEach(attr => {
      // Handle single-option attributes
      if (attr.variation && attr.options && attr.options.length === 1) {
        initialAttributes[attr.name] = attr.options[0];
      }
      
      // Handle shipping/country selection
      if (attr.variation && attr.options && attr.options.length > 0) {
        const attrNameLower = attr.name.toLowerCase();
        const isShippingOrCountry = attrNameLower.includes('shipping') || 
                                  attrNameLower.includes('country') ||
                                  attrNameLower.includes('location');
        
        if (isShippingOrCountry) {
          const hasUSOption = attr.options.some(opt => {
            const optLower = opt.toLowerCase();
            return optLower.includes('united states') || 
                   optLower.includes('us') || 
                   optLower === 'usa' ||
                   optLower === 'u.s.' ||
                   optLower === 'u.s.a.';
          });

          if (hasUSOption) {
            const usOption = attr.options.find(opt => {
              const optLower = opt.toLowerCase();
              return optLower.includes('united states') || 
                     optLower.includes('us') || 
                     optLower === 'usa' ||
                     optLower === 'u.s.' ||
                     optLower === 'u.s.a.';
            });
            initialAttributes[attr.name] = usOption!;
          }
        }
      }
    });

    if (Object.keys(initialAttributes).length > 0) {
      setSelectedAttributes(prev => ({
        ...prev,
        ...initialAttributes
      }));
    }
  }, [product.attributes]);

  // Handle attribute changes
  const handleAttributeChange = (attributeName: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attributeName]: value
    }));
  };

  // Effect to update selected variation and images when attributes change
  useEffect(() => {
    const hasAllRequired = product.attributes?.every(attr => 
      !attr.variation || selectedAttributes[attr.name]
    ) ?? false;

    // If all attributes are selected, find the matching variation
    if (hasAllRequired && Array.isArray(product.variations) && product.variations.length > 0) {
      try {
        // Find matching variation
        const matchingVariation = product.variations.find(variation => {
          if (!variation.attributes) return false;
          return variation.attributes.every(attr => 
            selectedAttributes[attr.name] === attr.option
          );
        });

        if (matchingVariation) {
          setSelectedVariation(matchingVariation);
          // Update images based on variation
          if (matchingVariation.image && matchingVariation.image.src) {
            // First try to find this image in the product gallery
            const galleryImage = product.images.find(img => 
              img.id === matchingVariation.image.id || 
              img.src === matchingVariation.image.src
            );

            if (galleryImage) {
              // If the variation image is in the gallery, show all product images
              // but make sure the variation image is first
              const reorderedImages = [
                galleryImage,
                ...product.images.filter(img => img.id !== galleryImage.id)
              ];
              setCurrentImages(reorderedImages);
              // Force the gallery to show the variation image
              setForcedImageIndex(0);
            } else {
              // If it's a unique variation image, show it first followed by product images
              const variationImage = {
                id: matchingVariation.image.id,
                src: matchingVariation.image.src,
                name: matchingVariation.image.name || '',
                alt: matchingVariation.image.alt || `${product.name} - ${matchingVariation.attributes.map(attr => attr.option).join(' ')}`,
                date_created: matchingVariation.image.date_created || '',
                date_created_gmt: matchingVariation.image.date_created_gmt || '',
                date_modified: matchingVariation.image.date_modified || '',
                date_modified_gmt: matchingVariation.image.date_modified_gmt || ''
              };
              setCurrentImages([variationImage, ...product.images]);
              // Force the gallery to show the variation image
              setForcedImageIndex(0);
            }
          } else {
            // If no variation image, show product images
            setCurrentImages(product.images);
            setForcedImageIndex(undefined);
          }
        } else {
          setSelectedVariation(null);
          setCurrentImages(product.images);
          setForcedImageIndex(undefined);
        }
      } catch (error) {
        console.error('Error finding variation:', error);
        setSelectedVariation(null);
        setCurrentImages(product.images);
        setForcedImageIndex(undefined);
      }
    } else {
      setSelectedVariation(null);
      setCurrentImages(product.images);
      setForcedImageIndex(undefined);
    }
  }, [product.attributes, selectedAttributes, product.variations, product.images]);

  const handleAddToCart = async () => {
    try {
      await addToCart({
        product_id: product.id,
        name: product.name,
        price: parseFloat(selectedVariation?.price || product.price),
        quantity: 1,
        image: currentImages[0]?.src,
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

  // Filter out single-option attributes and US shipping/country options
  const getVisibleAttributes = () => {
    if (!product.attributes) return [];
    return product.attributes.filter(attr => {
      if (!attr.variation) return false;
      if (!attr.options || attr.options.length <= 1) return false;

      // Hide shipping/country attributes if US is an option
      const attrNameLower = attr.name.toLowerCase();
      const isShippingOrCountry = attrNameLower.includes('shipping') || 
                                attrNameLower.includes('country') ||
                                attrNameLower.includes('location');
      
      if (isShippingOrCountry) {
        const hasUSOption = attr.options.some(opt => {
          const optLower = opt.toLowerCase();
          return optLower.includes('united states') || 
                 optLower.includes('us') || 
                 optLower === 'usa' ||
                 optLower === 'u.s.' ||
                 optLower === 'u.s.a.';
        });
        return !hasUSOption;
      }

      return true;
    });
  };

  const visibleAttributes = getVisibleAttributes();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Gallery */}
        <div className="relative">
          <ClientGallery images={currentImages} forcedIndex={forcedImageIndex} />
        </div>

        {/* Product Info */}
        <div className="space-y-6 bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          
          <div className="text-2xl font-semibold text-purple-600">
            ${parseFloat(selectedVariation?.price || product.price).toFixed(2)}
          </div>

          {/* Only show attributes with multiple options */}
          {visibleAttributes.length > 0 && (
            <div className="flex flex-wrap gap-6 items-end mt-8">
              {visibleAttributes.map((attribute, attrIndex) => (
                <div key={`${product.id}-attr-${attrIndex}-${attribute.id}`} className="flex-1 min-w-[240px]">
                  <label className="block text-base font-semibold text-gray-800 mb-2">
                    {attribute.name}
                  </label>
                  <select
                    value={selectedAttributes[attribute.name] || ''}
                    onChange={(e) => handleAttributeChange(attribute.name, e.target.value)}
                    className="block w-full px-4 py-3 text-lg border-2 border-gray-300 
                      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                      rounded-lg bg-white shadow-sm 
                      hover:border-purple-300 transition-colors
                      appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      backgroundSize: '1.5rem',
                      paddingRight: '3rem'
                    }}
                  >
                    <option value="">Select {attribute.name}</option>
                    {attribute.options?.map((option, optIndex) => (
                      <option key={`${product.id}-attr-${attrIndex}-opt-${optIndex}`} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Add to Cart Button */}
          <div className="mt-8">
            <button
              onClick={handleAddToCart}
              disabled={!isAddToCartEnabled}
              className={`w-full py-4 px-8 text-lg font-semibold rounded-lg shadow-sm
                ${isAddToCartEnabled 
                  ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-purple-500' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              Add to Cart
            </button>
          </div>

          {/* Product Description */}
          {product.description && (
            <div className="mt-8 prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          )}
        </div>
      </div>

      {/* Cart Slide Over */}
      <SlideOutCart 
        isOpen={cartSlideOverOpen}
        onClose={() => setCartSlideOverOpen(false)}
      />

      {/* Quick Add Modal */}
      {quickAddModalOpen && selectedProduct && (
        <QuickAddModal
          open={quickAddModalOpen}
          setOpen={setQuickAddModalOpen}
          product={selectedProduct}
        />
      )}
    </div>
  );
}
