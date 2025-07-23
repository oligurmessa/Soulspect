// src/app/layout.tsx 
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'soulspect - Effortless Emotion Logging',
  description: 'Transform your daily emotional experiences into meaningful insights with AI-powered growth tracking.',
  keywords: ['emotion tracking', 'mood journal', 'AI insights', 'personal growth', 'mental health'],
  authors: [{ name: 'soulspect' }],
  creator: 'soulspect',
  openGraph: {
    title: 'soulspect - Effortless Emotion Logging',
    description: 'Transform your daily emotional experiences into meaningful insights with AI-powered growth tracking.',
    url: 'https://soulspect.com',
    siteName: 'soulspect',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'soulspect - Effortless Emotion Logging',
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
      <body className={`${inter.className} min-h-screen antialiased 
                         bg-[#111111] dark:bg-gradient-to-b dark:from-[#1D1D1D] dark:to-[#111111]
                         text-foreground`}>
        <ThemeProvider attribute="class">
          <AuthProvider>
            {children}
            <Toaster position="top-center" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
