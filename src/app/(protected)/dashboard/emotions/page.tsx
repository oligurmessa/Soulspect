"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const EmotionsPage = () => {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

  const emotions = [
    { id: 'joy', label: 'Joy', icon: 'sentiment_very_satisfied', color: 'from-yellow-400 to-orange-400' },
    { id: 'calm', label: 'Calm', icon: 'spa', color: 'from-blue-400 to-cyan-400' },
    { id: 'excited', label: 'Excited', icon: 'celebration', color: 'from-purple-400 to-pink-400' },
    { id: 'grateful', label: 'Grateful', icon: 'favorite', color: 'from-green-400 to-emerald-400' },
    { id: 'anxious', label: 'Anxious', icon: 'psychology_alt', color: 'from-red-400 to-pink-400' },
    { id: 'sad', label: 'Sad', icon: 'sentiment_dissatisfied', color: 'from-gray-400 to-blue-400' },
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
          How are you feeling today?
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Track your emotions throughout the day to better understand your patterns and triggers.
        </p>
      </motion.div>

      {/* Emotion Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {emotions.map((emotion) => (
          <motion.button
            key={emotion.id}
            onClick={() => setSelectedEmotion(emotion.id)}
            className={`glass-card p-6 text-center hover:scale-105 transition-all duration-200 ${
              selectedEmotion === emotion.id ? 'ring-2 ring-gray-400/50' : ''
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${emotion.color} flex items-center justify-center`}>
              <span className="material-symbols-outlined text-white text-2xl">
                {emotion.icon}
              </span>
            </div>
            <h3 className="font-semibold text-gray-800">{emotion.label}</h3>
          </motion.button>
        ))}
      </motion.div>

      {/* Intensity Slider */}
      {selectedEmotion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            How intense is this feeling?
          </h3>
          <div className="space-y-6">
            <input
              type="range"
              min="1"
              max="10"
              defaultValue="5"
              className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>Mild</span>
              <span>Moderate</span>
              <span>Intense</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Notes */}
      <motion.div variants={itemVariants} className="glass-card p-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Quick Notes (Optional)
        </h3>
        <textarea
          placeholder="What triggered this emotion? Any additional context..."
          className="w-full h-32 bg-white/20 border border-white/30 rounded-xl p-4 text-gray-800 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-white/20"
        />
      </motion.div>

      {/* Action Button */}
      <motion.div variants={itemVariants} className="text-center">
        <button className="btn-primary px-8 py-4 text-lg">
          Log Emotion
        </button>
      </motion.div>
    </motion.div>
  );
};

export default EmotionsPage;