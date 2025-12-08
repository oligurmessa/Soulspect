import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Check, AlertCircle } from "lucide-react"
import { MetaState } from "../types"

interface StatusIndicatorProps {
  meta: MetaState
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ meta }) => {
  // We render a fixed-width container to prevent layout shifts
  return (
    <div className="flex items-center justify-center w-6 h-6 mr-1">
      <AnimatePresence mode="wait">
        {meta.status === "saving" && (
          <motion.div
            key="saving"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
          </motion.div>
        )}

        {meta.status === "editing" && (
          <motion.div
            key="editing"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
                boxShadow: [
                  "0 0 8px rgba(251,191,36,0.5)",
                  "0 0 16px rgba(251,191,36,0.8)",
                  "0 0 8px rgba(251,191,36,0.5)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        )}

        {meta.status === "saved" && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { delay: 2 } }} // Fade out after 2s
          >
            <Check className="w-4 h-4 text-emerald-500/80" strokeWidth={2.5} />
          </motion.div>
        )}

        {meta.status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <AlertCircle className="w-4 h-4 text-red-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}