'use client';

import { ProductGallery } from './ProductGallery';
import type { WooImage } from '@/lib/types';

interface ClientGalleryProps {
  images: WooImage[];
  forcedIndex?: number;
}

export function ClientGallery({ images, forcedIndex }: ClientGalleryProps) {
  return <ProductGallery images={images} forcedIndex={forcedIndex} />;
}
