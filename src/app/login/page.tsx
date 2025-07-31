"use client";

import AuthCard from "@/components/auth/AuthCard";
import Link from "next/link";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Moon, Sun } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100", geist.className)}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between p-6">
        <Link 
          href="/" 
          className="inline-flex items-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>
        
        <button 
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          onClick={() => document.documentElement.classList.toggle("dark")}
        >
          <Moon className="h-4 w-4 block dark:hidden" />
          <Sun className="h-4 w-4 hidden dark:block" />
        </button>
      </div>
      
      {/* Main content */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-6rem)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
      <a
        href="https://soulspect.com"
        className=" text-zinc-900 dark:text-zinc-100 text-4xl font-bold py-2 px-4 transition-colors hover:text-orange-300"
        style={{ 
          textShadow: '0 0 10px rgba(255, 144, 102, 0.7)',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700
        }}
      >
        soulspect
      </a>
          </div>
          
          <AuthCard showGoogle showMeta />
        </div>
      </div>
    </div>
  );
}