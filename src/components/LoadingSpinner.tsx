"use client";

import { motion } from "framer-motion";

export const LoadingSpinner = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-white">
      <div className="flex flex-col items-center space-y-4">
        <motion.div
          className="h-8 w-8 rounded-full border-2 border-brand-black border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          className="text-brand-black/80"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
        >
          Loading...
        </motion.p>
      </div>
    </div>
  );
};