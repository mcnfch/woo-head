'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { WooImage } from '@/lib/types';

interface ProductGalleryProps {
  images: WooImage[];
}

export function ProductGallery({ images = [] }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No image available</span>
      </div>
    );
  }

  const currentImage = images[selectedImage];
  if (!currentImage) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
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
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((image, index) => (
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