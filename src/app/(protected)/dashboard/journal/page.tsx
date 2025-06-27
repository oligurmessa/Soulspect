// src/app/(protected)/dashboard/journal/page.tsx
"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const JournalPage = () => {
  const [entry, setEntry] = useState("");
  const [mood, setMood] = useState(5);

  const prompts = [
    "What are three things you're grateful for today?",
    "Describe a moment when you felt truly present.",
    "What challenged you today, and how did you handle it?",
    "What would you tell your younger self about today?",
    "How did you show kindness to yourself or others today?",
  ];

  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

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
          Smart Journal
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Reflect on your day with AI-powered prompts and insights to deepen your self-awareness.
        </p>
      </motion.div>

      {/* Writing Prompts */}
      <motion.div variants={itemVariants} className="glass-card p-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          Writing Prompts
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt, index) => (
            <motion.button
              key={index}
              onClick={() => setSelectedPrompt(prompt)}
              className={`glass-button p-4 text-left hover:scale-105 transition-all duration-200 ${
                selectedPrompt === prompt ? 'bg-white/40' : ''
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="material-symbols-outlined text-gray-600 mb-2 block">
                lightbulb
              </span>
              <p className="text-sm text-gray-700">{prompt}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Journal Entry */}
      <motion.div variants={itemVariants} className="glass-card p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Today's Entry
          </h3>
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {selectedPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/20 border border-white/30 rounded-xl p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-gray-600 mt-1">
                auto_awesome
              </span>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Prompt:</p>
                <p className="text-gray-600">{selectedPrompt}</p>
              </div>
            </div>
          </motion.div>
        )}

        <textarea
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="Start writing your thoughts..."
          className="w-full h-64 bg-white/20 border border-white/30 rounded-xl p-6 text-gray-800 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-white/20 text-lg leading-relaxed"
        />

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Mood:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={mood}
              onChange={(e) => setMood(parseInt(e.target.value))}
              className="w-32 h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-800 font-medium">{mood}/10</span>
          </div>
          <div className="text-sm text-gray-500">
            {entry.length} characters
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="flex gap-4 justify-center">
        <button className="btn-secondary px-6 py-3">
          Save Draft
        </button>
        <button className="btn-primary px-8 py-3">
          Save Entry
        </button>
      </motion.div>
    </motion.div>
  );
};

export default JournalPage;
