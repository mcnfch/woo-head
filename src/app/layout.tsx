import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { ClientLayout } from '@/components/layout/ClientLayout';
import { getCategories } from '@/lib/woocommerce';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: '%s | Festival Rave Gear',
    default: 'Festival Rave Gear - Your Ultimate Festival Fashion Destination',
  },
  description: 'Find the perfect festival and rave outfits, accessories, and gear for your next event.',
  keywords: ['festival', 'rave', 'clothing', 'accessories', 'fashion'],
  authors: [{ name: 'Festival Rave Gear' }],
  robots: 'index, follow',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    title: 'Festival Rave Gear',
    description: 'Your Ultimate Festival Fashion Destination',
    siteName: 'Festival Rave Gear',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Festival Rave Gear',
    description: 'Your Ultimate Festival Fashion Destination',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();

  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <ClientLayout categories={categories}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
