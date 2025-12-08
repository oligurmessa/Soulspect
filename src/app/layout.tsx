// src/app/layout.tsx 
import type { Metadata } from 'next';
import { Geist, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SoulSpect - Personal Private Intelligence',
  description: 'Transform your daily emotional experiences into meaningful insights with AI-powered growth tracking.',
  keywords: ['emotion tracking', 'mood journal', 'AI insights', 'personal growth', 'mental health'],
  authors: [{ name: 'SoulSpect' }],
  creator: 'SoulSpect',
  openGraph: {
    title: 'SoulSpect - Personal Private Intelligence',
    description: 'Transform your daily emotional experiences into meaningful insights with AI-powered growth tracking.',
    url: 'https://soulspect.com',
    siteName: 'SoulSpect',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SoulSpect - Personal Private Intelligence',
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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // iOS Safari specific viewport settings for proper dvh and safe area support
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className={`${geist.variable} ${geist.className} ${inter.variable} min-h-screen antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          storageKey="soulspect-theme"
          disableTransitionOnChange
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
