"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// Types
// =============================================================================

interface AttachmentTriggerProps {
  count: number
  isOpen: boolean
  onClick: () => void
}

// =============================================================================
// Component
// =============================================================================

const AttachmentTrigger = React.forwardRef<HTMLButtonElement, AttachmentTriggerProps>(
  ({ count, isOpen, onClick }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
          "relative inline-flex items-center gap-2",
          "px-3 py-2 sm:px-3.5 sm:py-2.5",
          "rounded-lg sm:rounded-xl",
          "text-sm font-medium",
          "transition-all duration-150",
          "outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600",
          isOpen
            ? [
              "bg-[#ff9066] dark:bg-[#ff9066]",
              "text-white dark:text-neutral-900",
              "shadow-md",
            ]
            : [
              "bg-white/80 dark:bg-neutral-900/80",
              "text-neutral-700 dark:text-neutral-300",
              "backdrop-blur-sm",
              "border border-neutral-200/50 dark:border-neutral-800/50",
              "shadow-sm hover:shadow-md",
              "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
              "hover:border-neutral-300 dark:hover:border-neutral-700",
            ]
        )}
        aria-label={`Attachments (${count})`}
      >
        <FileText className="w-4 h-4" strokeWidth={2} />

        {/* Count Badge */}
        {count > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "absolute -top-1 -right-1",
              "min-w-[18px] h-[18px] px-1",
              "rounded-full",
              "flex items-center justify-center",
              "text-[10px] font-bold",
              isOpen
                ? "bg-white text-[#ff9066]"
                : "bg-[#ff9066] dark:bg-[#ff9066] text-white dark:text-neutral-900"
            )}
          >
            {count > 99 ? "99+" : count}
          </motion.div>
        )}
      </motion.button>
    )
  }
)

AttachmentTrigger.displayName = "AttachmentTrigger"

export { AttachmentTrigger }