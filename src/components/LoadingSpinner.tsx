// src/components/LoadingSpinner.tsx
"use client";

import { motion } from "framer-motion";
import Image from 'next/image';

interface LoadingSpinnerProps {
  message?: string;
  variant?: 'full' | 'page' | 'inline';
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner = ({ 
  message = "Loading your journey...", 
  variant = 'full',
  size = 'md'
}: LoadingSpinnerProps) => {
  
  const sizeConfig = {
    sm: {
      logo: 'h-8 w-8',
      logoText: 'text-lg',
      spinner: 'h-8 w-8',
      text: 'text-sm',
      gap: 'space-y-3'
    },
    md: {
      logo: 'h-12 w-12',
      logoText: 'text-2xl',
      spinner: 'h-12 w-12',
      text: 'text-lg',
      gap: 'space-y-6'
    },
    lg: {
      logo: 'h-16 w-16',
      logoText: 'text-3xl',
      spinner: 'h-16 w-16',
      text: 'text-xl',
      gap: 'space-y-8'
    }
  };

  const config = sizeConfig[size];

  // Full screen loading (for app initialization)
  if (variant === 'full') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F0EF] overflow-hidden">
        {/* Enhanced Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/20 rounded-full blur-3xl"
            animate={{ 
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{ 
              x: [0, -40, 0],
              y: [0, 30, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{ 
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/15 rounded-full blur-3xl"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
        
        <div className={`relative z-10 flex flex-col items-center ${config.gap}`}>
          {/* Enhanced Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex items-center gap-3 mb-4"
          >
            <motion.div 
              className={`${config.logo} rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center relative overflow-hidden`}
              animate={{
                boxShadow: [
                  "0 8px 25px rgba(0, 0, 0, 0.15)",
                  "0 12px 35px rgba(0, 0, 0, 0.25)", 
                  "0 8px 25px rgba(0, 0, 0, 0.15)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: [-100, 100]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <span className="material-symbols-outlined text-white relative z-10">
                psychology
              </span>
            </motion.div>
            <motion.span 
              className={`${config.logoText} font-bold text-gray-800`}
              animate={{
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              soulspect
            </motion.span>
          </motion.div>

          {/* Enhanced Spinner */}
          <div className="relative">
            {/* Outer ring */}
            <motion.div
              className={`${config.spinner} rounded-full border-2 border-gray-200/30`}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Inner spinning ring */}
            <motion.div
              className={`absolute inset-0 ${config.spinner} rounded-full border-2 border-transparent border-t-gray-600 border-r-gray-700`}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Center dot */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-700 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          {/* Loading Text */}
          <motion.p
            className={`${config.text} text-gray-600 font-medium text-center max-w-xs`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 0.5
            }}
          >
            {message}
          </motion.p>

          {/* Progress dots */}
          <motion.div 
            className="flex space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  // Page-level loading (for page transitions)
  if (variant === 'page') {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`glass-card p-8 flex flex-col items-center ${config.gap}`}
        >
          {/* Compact Logo */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`${config.logo} rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center`}>
              <span className="material-symbols-outlined text-white">
                psychology
              </span>
            </div>
            <span className={`${config.logoText} font-bold text-gray-800`}>
              soulspect
            </span>
          </div>

          {/* Spinner */}
          <div className="relative">
            <motion.div
              className={`${config.spinner} rounded-full border-2 border-gray-200/30`}
            />
            <motion.div
              className={`absolute inset-0 ${config.spinner} rounded-full border-2 border-transparent border-t-gray-600`}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <p className={`${config.text} text-gray-600 text-center`}>
            {message}
          </p>
        </motion.div>
      </div>
    );
  }

  // Inline loading (for components)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center justify-center ${config.gap.replace('space-y-', 'gap-')}`}
    >
      <div className="relative">
        <motion.div
          className={`${config.spinner} rounded-full border-2 border-gray-200/30`}
        />
        <motion.div
          className={`absolute inset-0 ${config.spinner} rounded-full border-2 border-transparent border-t-gray-600`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
      {message && (
        <span className={`${config.text} text-gray-600`}>
          {message}
        </span>
      )}
    </motion.div>
  );
};

// Enhanced Loading States for specific use cases
export const PageLoading = ({ message }: { message?: string }) => (
  <LoadingSpinner variant="page" message={message} />
);

export const InlineLoading = ({ message, size = 'sm' }: { message?: string; size?: 'sm' | 'md' | 'lg' }) => (
  <LoadingSpinner variant="inline" message={message} size={size} />
);

export const FullScreenLoading = ({ message }: { message?: string }) => (
  <LoadingSpinner variant="full" message={message} />
);

// Loading Skeleton Component
export const LoadingSkeleton = ({ 
  className = "",
  lines = 3,
  avatar = false 
}: { 
  className?: string;
  lines?: number;
  avatar?: boolean;
}) => {
  return (
    <div className={`glass-card p-6 ${className}`}>
      <div className="animate-pulse">
        {avatar && (
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gray-300/50 rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-300/50 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300/50 rounded w-1/2"></div>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className={`h-4 bg-gray-300/50 rounded ${
                i === lines - 1 ? 'w-2/3' : 'w-full'
              }`}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Loading Overlay Component
export const LoadingOverlay = ({ 
  isVisible, 
  message = "Loading...",
  blur = true 
}: { 
  isVisible: boolean; 
  message?: string;
  blur?: boolean;
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        blur ? 'backdrop-blur-sm' : ''
      } bg-black/20`}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card p-8 flex flex-col items-center space-y-4 max-w-sm mx-4"
      >
        <div className="relative">
          <motion.div
            className="h-12 w-12 rounded-full border-2 border-gray-200/30"
          />
          <motion.div
            className="absolute inset-0 h-12 w-12 rounded-full border-2 border-transparent border-t-gray-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <p className="text-gray-700 text-center font-medium">{message}</p>
      </motion.div>
    </motion.div>
  );
};