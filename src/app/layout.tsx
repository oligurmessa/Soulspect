import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

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
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} bg-brand-white antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}