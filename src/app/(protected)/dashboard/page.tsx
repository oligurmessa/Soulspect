"use client";

import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-white to-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-brand-black">soulspect</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-brand-black/60">
                Welcome, {user?.displayName || user?.email?.split('@')[0]}
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Welcome Section */}
          <motion.div variants={itemVariants} className="card">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-brand-black mb-4">
                Welcome to Your Dashboard
              </h2>
              <p className="text-brand-black/60 max-w-2xl mx-auto">
                You are now logged into soulspect! This is where you will track your emotions, 
                reflect on your thoughts, and discover insights about your personal growth journey.
              </p>
              {user?.emailVerified === false && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">
                    mark_email_unread
                  </span>
                  Please check your email and verify your account to unlock all features.
                </p>
              </div>
              )}
            </div>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <motion.div variants={itemVariants} className="card">
              <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span
                  className="material-symbols-outlined text-blue-600"
                  style={{ fontSize: '2.5rem', lineHeight: 1 }}
                >
                  edit_note
                </span>
              </div>


                <h3 className="text-lg font-semibold text-brand-black mb-2">
                  Emotion Logging
                </h3>
                <p className="text-brand-black/60 text-sm">
                  Quickly capture and track your daily emotions with our intuitive logging system.
                </p>
                <button className="mt-4 btn-secondary w-full">
                  Coming Soon
                </button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="card">
              <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-green-600 text-2xl"
                  style={{ fontSize: '2.5rem', lineHeight: 1 }}
                  >
                  neurology
                </span>
              </div>

                <h3 className="text-lg font-semibold text-brand-black mb-2">
                  AI Insights
                </h3>
                <p className="text-brand-black/60 text-sm">
                  Get personalized insights and patterns from your emotional data powered by AI.
                </p>
                <button className="mt-4 btn-secondary w-full">
                  Coming Soon
                </button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="card">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-purple-600"
                     style={{ fontSize: '2.5rem', lineHeight: 1 }}
                  >
                    bar_chart
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-brand-black mb-2">
                  Growth Tracking
                </h3>
                <p className="text-brand-black/60 text-sm">
                  Visualize your emotional journey and track your personal growth over time.
                </p>
                <button className="mt-4 btn-secondary w-full">
                  Coming Soon
                </button>
              </div>
            </motion.div>
          </div>

          {/* User Information */}
          <motion.div variants={itemVariants} className="card">
            <h3 className="text-lg font-semibold text-brand-black mb-4">
              Account Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-brand-black/60">Email:</span>
                <span className="text-brand-black font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-brand-black/60">Display Name:</span>
                <span className="text-brand-black font-medium">
                  {user?.displayName || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-brand-black/60">Account Created:</span>
                <span className="text-brand-black font-medium">
                  {user?.metadata.creationTime 
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : 'Unknown'
                  }
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-brand-black/60">Email Verified:</span>
                <span className={`font-medium flex items-center gap-1 ${user?.emailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                  <span className="material-symbols-outlined">
                    {user?.emailVerified ? 'check_circle' : 'hourglass_bottom'}
                  </span>
                  {user?.emailVerified ? 'Verified' : 'Pending'}
                </span>
              </div>

            </div>
          </motion.div>

          {/* Development Status */}
          <motion.div variants={itemVariants} className="card bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="text-center">
              
              <h3 className="text-lg font-semibold text-brand-black mb-2 flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-grey-500"
                  style={{ fontSize: '2rem', lineHeight: 1 }}
                >
                  construction
                </span>
                Development Status
              </h3>

              <p className="text-brand-black/60 text-sm mb-4">
                You are experiencing the early access version of soulspect. 
                New features are being added regularly.
              </p>
              <div className="text-xs text-brand-black/50">
                Current Version: Alpha 1.0 • Last Updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardPage;