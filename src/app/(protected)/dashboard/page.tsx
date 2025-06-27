// when the tabs on the left are clicked while keeping the side panel there we render the clicked tab's content. make sure we maintain the glass morphism effect over all components
"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // State to hold the current date, set on the client to avoid SSR hydration mismatch.
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString());
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/"); // Redirect to home page after logout
    } catch (error) {
      console.error("Error logging out:", error);
      setIsLoggingOut(false); // Re-enable button on error
    }
  };
  
  // A safer way to get the user's first name for the greeting.
  const userFirstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || "there";

  // Animation variants for the container and its children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 },
    },
  };


  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 p-4 md:p-8"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants} className="relative">
        <div className="absolute top-0 right-0">
           <button
             onClick={handleLogout}
             disabled={isLoggingOut}
             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white/50 rounded-lg shadow-sm hover:bg-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isLoggingOut ? 'Signing out...' : 'Sign Out'}
           </button>
        </div>
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Welcome back, {userFirstName}
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Ready to continue your journey of self-discovery and emotional growth? 
              Choose an area to explore today.
            </p>
            
            {user?.emailVerified === false && (
              <motion.div 
                variants={itemVariants}
                className="mt-6 glass-card p-4 max-w-md mx-auto border-yellow-400/30"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-yellow-600">
                    mark_email_unread
                  </span>
                  <div className="text-left">
                    <p className="text-yellow-700 font-medium">Verify your email</p>
                    <p className="text-yellow-600 text-sm">
                      Check your inbox to unlock all features.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-3">
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-gray-800 mb-2">0</div>
          <div className="text-gray-600 text-sm">Emotions Logged</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-gray-800 mb-2">0</div>
          <div className="text-gray-600 text-sm">Journal Entries</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-gray-800 mb-2">
            {user?.metadata.creationTime 
              ? Math.floor((Date.now() - new Date(user.metadata.creationTime).getTime()) / (1000 * 60 * 60 * 24))
              : 0
            }
          </div>
          <div className="text-gray-600 text-sm">Days Active</div>
        </div>
      </motion.div>

      {/* Recent Activity Placeholder */}
      <motion.div variants={itemVariants} className="glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-gray-700 text-xl">
            timeline
          </span>
          <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
        </div>
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto rounded-full bg-white/30 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-gray-500 text-3xl">
              sentiment_satisfied
            </span>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Your journey begins here
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Start logging your emotions or writing in your journal to see your activity here.
          </p>
        </div>
      </motion.div>
      
      {/* Development Status */}
      <motion.div variants={itemVariants} className="glass-card p-6 border-blue-400/30">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-blue-600">
            construction
          </span>
          <h3 className="text-lg font-semibold text-gray-800">Development Status</h3>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          You're experiencing an early access version. 
          New features are being added regularly to help you on your emotional growth journey.
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Version: Alpha 1.1</span>
          <span>Last Updated: {currentDate}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardPage;
