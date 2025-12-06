// src/app/layout.tsx 
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'soulspect - Personal Private Intelligence',
  description: 'Transform your daily emotional experiences into meaningful insights with AI-powered growth tracking.',
  keywords: ['emotion tracking', 'mood journal', 'AI insights', 'personal growth', 'mental health'],
  authors: [{ name: 'soulspect' }],
  creator: 'soulspect',
  openGraph: {
    title: 'soulspect - Personal Private Intelligence',
    description: 'Transform your daily emotional experiences into meaningful insights with AI-powered growth tracking.',
    url: 'https://soulspect.com',
    siteName: 'soulspect',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'soulspect - Personal Private Intelligence',
    description: 'Transform your daily emotional experiences into meaningful insights with AI-powered growth tracking.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      {/* ✅ **FIX APPLIED HERE**
        The gradient is now on the body tag.
        This makes it the base layer for the entire page.
        We also include a fallback solid color.
      */}
      <body className={`${inter.className} min-h-screen antialiased`}>
        <ThemeProvider 
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          storageKey="soulspect-theme"
        >
          <AuthProvider>
            {children}
            <Toaster position="top-center" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
