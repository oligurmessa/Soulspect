import React from "react"
import { motion } from "framer-motion"
import { Save } from "lucide-react"
import { MetaState } from "../types"

interface SaveButtonProps {
  isEditing: boolean
  meta: MetaState
  hasMeaningfulContent: boolean
  onClick: () => void
}

export const SaveButton: React.FC<SaveButtonProps> = ({ isEditing, meta, hasMeaningfulContent, onClick }) => {
  const isLoading = meta.status === "saving"
  const buttonText = isEditing ? "Update" : "Done"

  return (
    <motion.button
      whileHover={{ scale: isLoading ? 1 : 1.05 }}
      whileTap={{ scale: isLoading ? 1 : 0.95 }}
      onClick={onClick}
      disabled={isLoading || !hasMeaningfulContent}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-neutral-100 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-neutral-800 hover:border-neutral-700 shadow-sm"
    >
      {isLoading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Save className="w-4 h-4" />
        </motion.div>
      ) : (
        <Save className="w-4 h-4" />
      )}
      {buttonText}
    </motion.button>
  )
}