// src/app/(protected)/dashboard/soul-work/page.tsx
"use client";

import { motion } from "framer-motion";

const SoulWorkPage = () => {
  const exercises = [
    {
      title: "Shadow Work",
      description: "Explore hidden aspects of yourself",
      icon: "psychology_alt",
      duration: "15-20 min",
      difficulty: "Intermediate",
    },
    {
      title: "Inner Child Healing",
      description: "Connect with your younger self",
      icon: "child_care",
      duration: "10-15 min",
      difficulty: "Beginner",
    },
    {
      title: "Values Clarification",
      description: "Identify what truly matters to you",
      icon: "favorite",
      duration: "20-30 min",
      difficulty: "Beginner",
    },
    {
      title: "Life Purpose Exploration",
      description: "Discover your deeper calling",
      icon: "explore",
      duration: "30-45 min",
      difficulty: "Advanced",
    },
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
          Soul Work
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Deep dive into transformative exercises designed to foster profound self-discovery and healing.
        </p>
      </motion.div>

      {/* Exercises Grid */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
        {exercises.map((exercise, index) => (
          <motion.div
            key={index}
            className="glass-card p-6 hover:scale-105 transition-all duration-200 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white">
                  {exercise.icon}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                  {exercise.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {exercise.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">
                      schedule
                    </span>
                    {exercise.duration}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    exercise.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                    exercise.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {exercise.difficulty}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Progress Tracker */}
      <motion.div variants={itemVariants} className="glass-card p-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          Your Journey
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/20 rounded-xl">
            <div>
              <h4 className="font-medium text-gray-800">Exercises Completed</h4>
              <p className="text-gray-600 text-sm">This month</p>
            </div>
            <div className="text-2xl font-bold text-purple-600">3</div>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/20 rounded-xl">
            <div>
              <h4 className="font-medium text-gray-800">Time Invested</h4>
              <p className="text-gray-600 text-sm">Total hours</p>
            </div>
            <div className="text-2xl font-bold text-purple-600">2.5h</div>
          </div>
        </div>
      </motion.div>

      {/* Sacred Space */}
      <motion.div variants={itemVariants} className="glass-card p-8 text-center border-purple-400/30">
        <span className="material-symbols-outlined text-purple-600 text-4xl mb-4 block">
          spa
        </span>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Create Your Sacred Space
        </h3>
        <p className="text-gray-600 mb-6">
          Set aside time and space for deep inner work. These exercises are most effective in a quiet, comfortable environment.
        </p>
        <button className="btn-primary">
          Begin Journey
        </button>
      </motion.div>
    </motion.div>
  );
};

export default SoulWorkPage;