'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { WooImage } from '@/lib/types';

interface ProductGalleryProps {
  images: WooImage[];
  variantImage?: WooImage | null;
}

export function ProductGallery({ images = [], variantImage }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const displayImages = variantImage ? [variantImage] : images;

  if (!displayImages.length) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No image available</span>
      </div>
    );
  }

  const currentImage = displayImages[selectedImage];
  if (!currentImage) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Main Image Container */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={currentImage.src}
          alt={currentImage.alt || 'Product image'}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          quality={85}
          loading="eager"
        />

        {/* Only show navigation arrows if we're showing default images and there's more than one */}
        {!variantImage && displayImages.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImage(prev => (prev > 0 ? prev - 1 : displayImages.length - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedImage(prev => (prev < displayImages.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Only show thumbnail gallery for default images */}
      {!variantImage && displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {displayImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(index)}
              className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 ${
                selectedImage === index ? 'ring-2 ring-purple-600' : ''
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt || 'Product thumbnail'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 10vw"
                quality={60}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}