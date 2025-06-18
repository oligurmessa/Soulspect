import { AnimatedLandingContent } from '@/components/AnimatedLandingContent';

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-white via-brand-white to-gray-100" />
      
      {/* Main content */}
      <div className="relative z-10 w-full max-w-6xl">
        <AnimatedLandingContent />
      </div>
      
      {/* Footer */}
      <footer className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <p className="text-xs text-brand-black/40">
          © 2024 soulspect. All rights reserved.
        </p>
      </footer>
    </main>
  );
}