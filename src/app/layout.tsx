import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { Orbitron } from 'next/font/google';
import "./globals.css";
import { ClientLayout } from '@/components/layout/ClientLayout';
import { getCategories } from '@/lib/woocommerce';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-orbitron',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: '%s | Festival Rave Gear',
    default: 'Festival Rave Gear',
  },
  description: 'Find the perfect festival and rave outfits, accessories, and gear for your next event.',
  keywords: ['festival', 'rave', 'clothing', 'accessories', 'fashion'],
  authors: [{ name: 'Festival Rave Gear' }],
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: 'https://staging.festivalravegear.com'
  },
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
    <html lang="en">
      <body className={`${inter.variable} ${orbitron.variable}`}>
        <ClientLayout categories={categories}>{children}</ClientLayout>
      </body>
    </html>
  );
}
