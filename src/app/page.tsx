
// HomePage.tsx (or your page file)
"use client"
import { Check, BarChart, Brain, Crosshair, FileText, Rocket } from "lucide-react";
import Frame from "@/components/landing/tabs";
import Component from "@/components/landing/logo_particles";
import { Montserrat } from 'next/font/google'
import { Button } from "@/components/ui/button";
import BrandButton from "@/components/landing/button";
import { Badge } from "@/components/ui/badge";
import { TypewriterEffectSmooth } from "@/components/landing/typewriter-effect"
import { Moon, Sun, GalleryHorizontalEnd } from 'lucide-react';
import Link from 'next/link';

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
  display: 'swap',
})

const words = [
  {
    text: "Transform",
    className: "text-orange-400 font-bold",
  },
  {
    text: "your",
    className: "text-orange-400 font-bold",
  },
  {
    text: "inner",
    className: "text-orange-400 font-bold",
  },
  {
    text: "world",
    className: "text-orange-400 font-bold",
  },
  {
    text: "with",
    className: "text-orange-400 font-bold",
  },
  {
    text: "Soulspect.",
    className: "text-orange-400 font-bold",
  },
];

// Soulspect features array
const features = [
  {
    title: "Emotion Tracking",
    description: "Log and track your daily emotions with our intuitive interface.",
  },
  {
    title: "AI-Powered Insights",
    description: "Get personalized insights powered by Google Gemini AI.",
  },
  {
    title: "Beautiful Analytics",
    description: "Visualize your emotional patterns with stunning charts.",
  },
  {
    title: "Explore Subconscious",
    description: "Dive deep into your subconscious mind with guided tools.",
  },
  {
    title: "Release & Reset",
    description: "Let go of limiting beliefs and negative patterns.",
  },
  {
    title: "Purpose Compass",
    description: "Align your actions with your deepest values and purpose.",
  },
];

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
        <Button asChild size="lg" className="rounded-xl px-5 text-base">
          <a href="/dashboard">
            Get Started
          </a>
        </Button>
      </div>
      
      
      {/* Hero Section with Typewriter Effect */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-neutral-600 dark:text-neutral-200 text-xs sm:text-base mb-4">
              Discover the power of emotional intelligence
            </p>
            <TypewriterEffectSmooth words={words} />
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4 mt-8">
              <Button size="lg" className="dark w-40 h-12 rounded-xl bg-white/85 hover:bg-white">
                <a href="/dashboard">Start Journey</a>
              </Button>
              <Button variant="outline" size="lg" className="w-40 h-12 rounded-xl bg-transparent">
                <a href="#features">Learn More</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="flex gap-4 flex-col items-start max-w-4xl">
            <div>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Emotional Intelligence Platform</Badge>
            </div>
            <div className="flex gap-2 flex-col">
              <h2 className="text-3xl md:text-5xl tracking-tighter lg:max-w-xl font-regular">Your Journey to Self-Discovery</h2>
              <p className="text-lg max-w-xl lg:max-w-xl leading-relaxed tracking-tight text-muted-foreground">
                Soulspect combines cutting-edge AI with proven psychological techniques to help you understand your emotions and transform your life.
              </p>
            </div>
            <div className="flex gap-10 pt-12 flex-col w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {features.map((feature, index) => (
                  <div key={index} className="flex flex-row gap-6 w-full items-start">
                    <Check className="w-4 h-4 mt-2 text-orange-300 flex-shrink-0" />
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">{feature.title}</p>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-xl bg-muted p-10 md:p-16">
            <div className="flex flex-col gap-4 text-center md:text-left">
              <h2 className="text-4xl font-semibold">Ready to Transform Your Life?</h2>
              <p className="max-w-screen-sm text-muted-foreground">
                Join thousands of users who are already discovering their true potential through emotional intelligence.
              </p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <BrandButton label="Begin Your Journey" selected={true} onClick={() => window.location.href = "/dashboard"} />

              <Button variant="outline" size="lg" className="rounded-xl bg-transparent">
                <a href="#pillars">Explore Features</a>
              </Button>


            </div>
            <div className="pointer-events-none absolute -top-1 right-1 z-10 hidden h-full w-full bg-[linear-gradient(to_right,hsl(var(--muted-foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted-foreground))_1px,transparent_1px)] bg-[size:80px_80px] opacity-15 [mask-image:linear-gradient(to_bottom_right,#000,transparent,transparent)] md:block"></div>
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section id="pillars" className="py-20 lg:py-32 bg-gradient-to-b from-transparent to-orange-50/30 dark:to-orange-900/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 mb-6">
              Core Features
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tighter">
              Three Pillars of <span className="text-orange-300">Self-Discovery</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Soulspect provides three core areas to help you understand yourself better and create lasting transformation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white/50 dark:bg-black/20 backdrop-blur-lg rounded-2xl p-8 border border-white/20 dark:border-gray-700">
                <BarChart className="h-8 w-8 text-white" />
              <h3 className="text-2xl font-bold mb-4">Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track your emotional patterns with detailed analytics. Understand your triggers, mood cycles, and growth patterns through beautiful visualizations.
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-black/20 backdrop-blur-lg rounded-2xl p-8 border border-white/20 dark:border-gray-700">
                <Brain className="h-8 w-8 text-white" />

              <h3 className="text-2xl font-bold mb-4">Soulspace</h3>
              <p className="text-muted-foreground leading-relaxed">
                Dive deep into your subconscious, release negative patterns, and make life-changing decisions with AI-guided inner transformation tools.
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-black/20 backdrop-blur-lg rounded-2xl p-8 border border-white/20 dark:border-gray-700">
                <Crosshair className="h-8 w-8 text-white" />
              <h3 className="text-2xl font-bold mb-4">Purpose Compass</h3>
              <p className="text-muted-foreground leading-relaxed">
                Align your daily actions with your deepest values and life purpose. Create a meaningful path forward with clarity and intention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mb-6">
              Process
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tighter">
              Your Journey to <span className="text-orange-300">Self-Mastery</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Follow our proven three-step process to unlock emotional intelligence and transform your inner world.
            </p>
          </div>
          
          <div className="space-y-16 max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4 tracking-tight">Track Your Emotions</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Start by logging your daily emotions, moods, and experiences with our intuitive interface. Build awareness of your emotional landscape and identify patterns over time.
                </p>
              </div>
              <div className="flex-1 bg-muted rounded-2xl p-8 relative overflow-hidden">
                <div className="text-6xl mb-4 text-center"><FileText className="h-16 w-16 mx-auto" /></div>
                <p className="text-center text-muted-foreground">Daily emotion logging interface</p>
                <div className="pointer-events-none absolute -top-1 right-1 z-10 h-full w-full bg-[linear-gradient(to_right,hsl(var(--muted-foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted-foreground))_1px,transparent_1px)] bg-[size:40px_40px] opacity-10"></div>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
              <div className="flex-1">

                <h3 className="text-2xl font-bold mb-4 tracking-tight">Get AI Insights</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Receive personalized insights powered by Google Gemini AI. Understand patterns, triggers, and growth opportunities through advanced emotional analysis.
                </p>
              </div>
              <div className="flex-1 bg-muted rounded-2xl p-8 relative overflow-hidden">
                <div className="text-6xl mb-4 text-center"><GalleryHorizontalEnd className="h-16 w-16 mx-auto" /></div>
                <p className="text-center text-muted-foreground">AI-powered emotional analysis</p>
                <div className="pointer-events-none absolute -top-1 right-1 z-10 h-full w-full bg-[linear-gradient(to_right,hsl(var(--muted-foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted-foreground))_1px,transparent_1px)] bg-[size:40px_40px] opacity-10"></div>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4 tracking-tight">Transform & Grow</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Use Soulspace tools to release limiting beliefs, make important decisions, and align with your true purpose. Create lasting positive change in your life.
                </p>
              </div>
              <div className="flex-1 bg-muted rounded-2xl p-8 relative overflow-hidden">
                <div className="text-6xl mb-4 text-center"><Rocket className="h-16 w-16 mx-auto" /></div>
                <p className="text-center text-muted-foreground">Personal transformation tools</p>
                <div className="pointer-events-none absolute -top-1 right-1 z-10 h-full w-full bg-[linear-gradient(to_right,hsl(var(--muted-foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted-foreground))_1px,transparent_1px)] bg-[size:40px_40px] opacity-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pb-6 pt-16 lg:pb-8 lg:pt-24 border-t">
        <div className="container mx-auto px-4">
          <div className="md:flex md:items-start md:justify-between">
            <Link href="/" className="flex items-center gap-x-2" aria-label="Soulspect">
              <span className={`font-bold text-xl ${montserrat.className}`}>soulspect</span>
            </Link>
            <ul className="flex list-none mt-6 md:mt-0 space-x-3">
              {socialLinks.map((link, i) => (
                <li key={i}>
                  <Button variant="secondary" size="icon" className="h-10 w-10 rounded-full" asChild>
                    <a href={link.href} target="_blank" aria-label={link.label} rel="noreferrer">
                      {link.icon}
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t mt-6 pt-6 md:mt-4 md:pt-8 lg:grid lg:grid-cols-10">
            <nav className="lg:mt-0 lg:col-[4/11]">
              <ul className="list-none flex flex-wrap -my-1 -mx-2 lg:justify-end">
                {mainLinks.map((link, i) => (
                  <li key={i} className="my-1 mx-2 shrink-0">
                    <a href={link.href} className="text-sm text-primary underline-offset-4 hover:underline">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-6 lg:mt-0 lg:col-[4/11]">
              <ul className="list-none flex flex-wrap -my-1 -mx-3 lg:justify-end">
                {legalLinks.map((link, i) => (
                  <li key={i} className="my-1 mx-3 shrink-0">
                    <a href={link.href} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 text-sm leading-6 text-muted-foreground whitespace-nowrap lg:mt-0 lg:row-[1/3] lg:col-[1/4]">
              <div>© 2025 soulspect. Minneapolis, Mn.</div>
            </div>
          </div>
        </div>
      </footer>
          </main>
  )
}