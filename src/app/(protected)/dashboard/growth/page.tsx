// src/app/(protected)/dashboard/growth/page.tsx
"use client";

import { motion } from "framer-motion";

const GrowthPage = () => {
  const goals = [
    { id: 1, title: "Practice Daily Meditation", progress: 75, streak: 12 },
    { id: 2, title: "Improve Sleep Quality", progress: 60, streak: 8 },
    { id: 3, title: "Express Gratitude Daily", progress: 90, streak: 21 },
  ];

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
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Growth Tracking
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Monitor your personal development journey and celebrate your progress.
        </p>
      </motion.div>

      {/* Goals Overview */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-3">
        {goals.map((goal) => (
          <div key={goal.id} className="glass-card p-6">
            <h3 className="font-semibold text-gray-800 mb-4">{goal.title}</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{goal.progress}%</span>
                </div>
                <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500 text-lg">
                  local_fire_department
                </span>
                <span className="text-sm text-gray-600">{goal.streak} day streak</span>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Growth Chart Placeholder */}
      <motion.div variants={itemVariants} className="glass-card p-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          Growth Timeline
        </h3>
        <div className="h-64 bg-white/20 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-gray-400 text-5xl mb-4 block">
              analytics
            </span>
            <p className="text-gray-600">Interactive growth charts coming soon</p>
          </div>
        </div>
      </motion.div>

      {/* Add New Goal */}
      <motion.div variants={itemVariants} className="glass-card p-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          Set New Goal
        </h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="What would you like to work on?"
            className="input-field"
          />
          <div className="flex gap-4">
            <button className="btn-secondary">
              Cancel
            </button>
            <button className="btn-primary">
              Add Goal
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GrowthPage;
