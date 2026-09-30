import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './global.css';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ChatCapsule — Private Instagram DM Archive',
    template: '%s | ChatCapsule'
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'Instagram chat viewer',
    'Instagram DM viewer',
    'Instagram data export',
    'Instagram ZIP reader',
    'view Instagram messages',
    'Instagram message backup',
    'read old Instagram DMs',
  ],
  authors: [{ name: 'ChatCapsule' }],
  creator: 'ChatCapsule',
  publisher: 'ChatCapsule',
  category: 'Utilities',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    title: 'ChatCapsule — Private Instagram DM Archive',
    description: SITE_DESCRIPTION,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'ChatCapsule — Private Instagram DM Archive',
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: {
    icon: '/icon.svg',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", inter.variable, manrope.variable)} suppressHydrationWarning>
      <body className="antialiased font-body" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
