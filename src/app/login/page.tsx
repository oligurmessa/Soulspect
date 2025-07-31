"use client";

import AuthCard from "@/components/auth/AuthCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Sparkles, Heart, Brain, BarChart } from "lucide-react";

const geist = Geist({ subsets: ["latin"] });

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-screen", geist.className)}>
      {/* Left side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-zinc-900">
        <div className="p-6">
          <Link href="/" className="inline-flex items-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Welcome to Soulspect
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Your journey to self-discovery begins here
              </p>
            </div>
            <AuthCard showGoogle showGithub />
          </div>
        </div>
      </div>

      {/* Right side - Feature Showcase */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white p-12">
        <div className="h-full flex flex-col justify-center max-w-xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">
            Track Your Emotional Journey
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Emotion Tracking</h3>
                <p className="text-zinc-300">
                  Log your daily emotions and discover patterns in your emotional well-being
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">AI-Powered Insights</h3>
                <p className="text-zinc-300">
                  Get personalized insights and recommendations based on your emotional patterns
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Journal & Reflect</h3>
                <p className="text-zinc-300">
                  Express yourself through text, voice, or video journaling with AI prompts
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <BarChart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Analytics Dashboard</h3>
                <p className="text-zinc-300">
                  Visualize your emotional trends and track your personal growth over time
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-sm text-zinc-300 mb-2">Trusted by thousands</p>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
              <span className="ml-2 text-white font-medium">4.9/5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}