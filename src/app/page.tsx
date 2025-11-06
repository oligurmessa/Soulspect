
// HomePage.tsx (or your page file)
"use client"
import { Check, BarChart, Brain, Crosshair, FileText, Rocket, Moon, Sun, GalleryHorizontalEnd } from "lucide-react";
import Frame from "@/components/landing/tabs";
import { Montserrat } from 'next/font/google'
import dynamic from 'next/dynamic'

import { Button } from "@/components/ui/button";
import BrandButton from "@/components/landing/button";
import { InteractiveHoverButton } from "@/components/landing/interactive-hover-button";
import Link from 'next/link';
import Footer from "@/components/landing/footer";
import Loading from "@/components/landing/loading";

const Component = dynamic(() => import('@/components/landing/logo_particles'), {
  loading: () => <Loading />,
  ssr: false
});

const Squares = dynamic(() => import('@/components/landing/squares-background').then(m => m.Squares), {
  loading: () => <Loading />,
  ssr: false
});

const FeaturesSectionWithHoverEffects = dynamic(() => import('@/components/landing/features-effects').then(m => m.FeaturesSectionWithHoverEffects), {
  loading: () => <Loading />,
  ssr: false
});

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
  display: 'swap',
})


// Example socialLinks array
const socialLinks = [
  {
    href: "https://twitter.com/getsoulspect",
    label: "Twitter",
    icon: <svg width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M20 3.924c-.735.326-1.525.547-2.355.646a4.13 4.13 0 0 0 1.805-2.277 8.19 8.19 0 0 1-2.605.995A4.107 4.107 0 0 0 9.85 7.03a11.65 11.65 0 0 1-8.457-4.287a4.106 4.106 0 0 0 1.27 5.482a4.073 4.073 0 0 1-1.86-.513v.052a4.108 4.108 0 0 0 3.292 4.025a4.11 4.11 0 0 1-1.853.07a4.109 4.109 0 0 0 3.834 2.85A8.233 8.233 0 0 1 0 17.545a11.616 11.616 0 0 0 6.29 1.844c7.547 0 11.675-6.254 11.675-11.675c0-.178-.004-.355-.012-.53A8.348 8.348 0 0 0 20 3.924z"/></svg>
  },
  {
    href: "",
    label: "GitHub",
    icon: <svg width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M10 .5A9.5 9.5 0 0 0 .5 10c0 4.2 2.7 7.8 6.5 9.1c.5.1.7-.2.7-.5v-1.7c-2.7.6-3.3-1.3-3.3-1.3c-.4-1-1-1.3-1-1.3c-.8-.6.1-.6.1-.6c.9.1 1.4.9 1.4.9c.8 1.4 2.1 1 2.6.8c.1-.6.3-1 .5-1.2c-2.2-.3-4.5-1.1-4.5-4.9c0-1.1.4-2 .9-2.7c-.1-.3-.4-1.3.1-2.7c0 0 .8-.3 2.8 1c.8-.2 1.7-.3 2.6-.3c.9 0 1.8.1 2.6.3c2-.1 2.8-1 2.8-1c.5 1.4.2 2.4.1 2.7c.6.7.9 1.6.9 2.7c0 3.8-2.3 4.6-4.5 4.9c.3.3.6.8.6 1.7v2.5c0 .3.2.6.7.5c3.8-1.3 6.5-4.9 6.5-9.1A9.5 9.5 0 0 0 10 .5z"/></svg>
  }
];

// Main navigation links for the footer
const mainLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

// Legal links for the footer
const legalLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" }
];

export default function HomePage() {
  return (
    <main className="bg-gray-100 dark:bg-[#0e0f11] text-gray-800 dark:text-gray-200">
      {/* Renders the particle component */}
      <Component/> 
      <Frame/>

      {/* Theme toggle and button positioned on the right */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        <button 
          className="p-2 rounded-lg bg-white/50 dark:bg-black/30 backdrop-blur-lg border border-white/20 dark:border-black/20 hover:bg-white/70 dark:hover:bg-black/50 transition-colors"
          onClick={() => document.documentElement.classList.toggle("dark")}
        >
          <Moon className="h-4 w-4 block dark:hidden" />
          <Sun className="h-4 w-4 hidden dark:block" />
        </button>
        {/* Get Started button */}


        <Link href="/dashboard">
          <InteractiveHoverButton>
            Get Started
          </InteractiveHoverButton>
        </Link>
      </div>
      
      
      {/* Hero Section with Typewriter Effect */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-neutral-600 dark:text-neutral-200 text-xl sm:text-3xl mb-4">
            Personal memory, private intelligence, perceptible growth.
            </p>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4 mt-8">
              <Link href="/dashboard">
                <Button size="lg" className="dark w-40 h-12 rounded-xl bg-white/85 hover:bg-white">
                  Start Journey
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-40 h-12 rounded-xl bg-transparent" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>


      {/* Features Section */}
<section id="features" className="py-20 lg:py-32">
  <div className="container mx-auto px-4">
    <div className="flex flex-col items-center text-center">
      <h2 className="text-3xl md:text-4xl tracking-tighter font-bold">
      AI app made particularly for you.
      </h2>
      <p className="text-lg max-w-2xl mt-4 leading-relaxed tracking-tight text-muted-foreground">
      The AI app for your mind and memories, built to preserve your life experiences, protect your data, enhance your self-understanding, and turn reflection into growth.
      </p>
    </div>
    
    {/* The new features component is imported and used here */}
    <div className="mt-12">
      <FeaturesSectionWithHoverEffects />
    </div>
  </div>
</section>


{/* Call to Action Section */}
<section className="py-20 lg:py-32">
  <div className="container mx-auto px-4">
    <div className="relative isolate overflow-hidden p-10 md:p-16">
      {/* The Squares component is used as the background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Squares 
          borderColor="rgba(255, 255, 255, 0.1)"
          squareSize={30}
          speed={0.5}
          direction="diagonal"
        />
      </div>

      {/* Content for the section */}
      <div className="flex flex-col gap-4 text-center md:text-left">
        <h2 className="text-4xl font-semibold text-white">Ready to Document Your Life?</h2>
        <p className="max-w-screen-sm text-neutral-300">
          Join the millions of people who are already documenting their life. Do it smart!
        </p>
      </div>
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Link href="/dashboard">
          <BrandButton label="Begin Your Journey" selected={true} />
        </Link>
        <Button variant="outline" size="lg" className="rounded-xl bg-transparent border-neutral-600 text-white hover:bg-neutral-800 hover:border-neutral-500" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
          Explore Features
        </Button>
      </div>
    </div>
  </div>
</section>



      {/* Footer */}
      <Footer />
          </main>
  )
}