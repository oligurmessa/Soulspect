"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import Image from 'next/image';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.3,
      delayChildren: 0.2
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { 
      duration: 0.8, 
      ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smoother animation
    },
  },
};

const buttonVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { 
      delay: 1.2, 
      duration: 0.6,
      type: "spring",
      stiffness: 200,
      damping: 20
    },
  },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.95
  }
};

export const AnimatedLandingContent = () => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center px-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-0 mb-1">
          <Image
            src="/logo.png"
            alt="Soulspect Logo"
            width={148}
            height={148}  
            style={{ marginTop: '18px' }}
            unoptimized
          />
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-brand-black">
            soulspect
          </h1>
        </div>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <p className="text-lg md:text-xl lg:text-2xl text-brand-black/80 max-w-2xl leading-relaxed">
          Effortless emotion logging meets AI-powered growth.
        </p>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <p className="text-sm md:text-base text-brand-black/60 max-w-lg mt-4 leading-relaxed">
          Transform your daily emotional experiences into meaningful insights. 
          Track your mood, reflect on your thoughts, and discover patterns that drive your personal growth.
        </p>
      </motion.div>

      <motion.div
        className="mt-12"
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
      >
        <div className="rounded-full bg-brand-black px-8 py-4 shadow-lg">
          <h2 className="text-xl font-semibold tracking-wide text-brand-white">
            Coming Soon
          </h2>
        </div>
      </motion.div>

      <motion.div
        className="mt-8 flex space-x-4"
        variants={itemVariants}
      >
        <Link href="/login">
          <motion.button
            className="rounded-lg border-2 border-brand-black px-6 py-2 text-brand-black transition-colors hover:bg-brand-black hover:text-brand-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Early Access
          </motion.button>
        </Link>
      </motion.div>

      {/* Decorative elements */}
      <motion.div
        className="absolute top-20 left-20 hidden lg:block"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <div className="h-32 w-32 rounded-full bg-brand-black/10" />
      </motion.div>
      
      <motion.div
        className="absolute bottom-20 right-20 hidden lg:block"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
      >
        <div className="h-24 w-24 rounded-full bg-brand-black/10" />
      </motion.div>
    </motion.div>
  );
};