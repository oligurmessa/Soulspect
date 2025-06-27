// src/app/(protected)/dashboard/insights/page.tsx
"use client";

import { motion } from "framer-motion";

const InsightsPage = () => {
  const insights = [
    {
      title: "Emotional Patterns",
      description: "You tend to feel most energized in the mornings",
      icon: "trending_up",
      color: "from-blue-400 to-cyan-400",
    },
    {
      title: "Stress Triggers",
      description: "Work meetings correlate with anxiety levels",
      icon: "psychology",
      color: "from-purple-400 to-pink-400",
    },
    {
      title: "Growth Areas",
      description: "Self-compassion practices show positive impact",
      icon: "self_improvement",
      color: "from-green-400 to-emerald-400",
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
          AI Insights
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Discover meaningful patterns in your emotional journey with AI-powered analysis.
        </p>
      </motion.div>

      {/* Insights Grid */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            className="glass-card p-6 hover:scale-105 transition-all duration-200"
            whileHover={{ scale: 1.02 }}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${insight.color} flex items-center justify-center mb-4`}>
              <span className="material-symbols-outlined text-white">
                {insight.icon}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {insight.title}
            </h3>
            <p className="text-gray-600">
              {insight.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Detailed Analysis */}
      <motion.div variants={itemVariants} className="glass-card p-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          Weekly Analysis
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white/20 rounded-xl">
            <div>
              <h4 className="font-medium text-gray-800">Overall Mood Trend</h4>
              <p className="text-gray-600 text-sm">Trending upward this week</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600">
                trending_up
              </span>
              <span className="text-green-600 font-semibold">+15%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white/20 rounded-xl">
            <div>
              <h4 className="font-medium text-gray-800">Journal Consistency</h4>
              <p className="text-gray-600 text-sm">5 out of 7 days logged</p>
            </div>
            <div className="w-24 h-2 bg-white/30 rounded-full overflow-hidden">
              <div className="w-5/6 h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Coming Soon */}
      <motion.div variants={itemVariants} className="glass-card p-8 text-center border-purple-400/30">
        <span className="material-symbols-outlined text-purple-600 text-4xl mb-4 block">
          auto_awesome
        </span>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Advanced AI Insights Coming Soon
        </h3>
        <p className="text-gray-600">
          Personalized recommendations, deeper pattern analysis, and predictive insights to accelerate your growth.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default InsightsPage;