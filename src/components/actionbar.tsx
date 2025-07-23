"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  SlidersHorizontal,
  Type,
  Paperclip,
  AudioLines,
  ChevronRight,
  Video,
  BadgePlus,
  BookOpen,
  Save,
  type LucideIcon,
} from "lucide-react"
import { EmotionLogDrawer } from "@/components/EmotionLogDrawer"
import { toast } from "@/components/ui/use-toast"
import { Timestamp } from "firebase/firestore"
import { addJournalEntry } from "@/lib/dbHelpers"
import { useSidebar } from "@/components/ui/sidebar"

interface ActionbarItem {
  id: string
  title: string
  icon: LucideIcon
}

interface ActionbarProps {
  className?: string
  selectedMode: string | null
  onModeChange: (mode: string) => void
  onToolbarClick?: () => void
  onSave?: () => void
  title?: string
  content?: string
  voiceBlob?: Blob | null
  videoBlob?: Blob | null
  selectedDate?: Date
  user?: { uid: string } | null
  isSaving?: boolean
}

const SELECTABLE_MODES = ["Type", "Voice", "Video"]

const transition = {
  type: "spring" as const,
  bounce: 0,
  duration: 0.4,
}

export function Actionbar({
  className,
  selectedMode,
  onModeChange,
  onToolbarClick,
  onSave,
  title,
  content,
  voiceBlob,
  videoBlob,
  selectedDate,
  user,
  isSaving = false,
}: ActionbarProps) {
  const [clickedId, setClickedId] = React.useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const selected = selectedMode?.toLowerCase()

  const ActionbarItems: ActionbarItem[] = [
    { id: "Type", title: "Type", icon: Type },
    { id: "Voice", title: "Voice", icon: AudioLines },
    { id: "Video", title: "Video", icon: Video },
    { id: "emotions", title: "Emotions", icon: BadgePlus },
    { id: "attach", title: "Attach", icon: Paperclip },
    { id: "prompt", title: "Prompt", icon: ChevronRight },
    { id: "journals", title: "Journals", icon: BookOpen },
    { id: "Toolbar", title: "Toolbar", icon: SlidersHorizontal },
  ]

  const handleItemClick = (itemId: string) => {
    setClickedId(itemId)
    if (SELECTABLE_MODES.includes(itemId)) {
      onModeChange(itemId)
    }

    // Logic Placeholder – add handling logic for each action item here
    // For example:
    // if (itemId === "prompt") { openPromptPanel() }

    if (itemId === "Toolbar" && onToolbarClick) {
      onToolbarClick()
    }
  }

  const handleSave = async () => {
    if (onSave) {
      onSave()
    }
  }

  return (
    <div 
      className={cn(
        "fixed bottom-4 z-50 transition-all duration-200",
        isCollapsed 
          ? "left-1/2 -translate-x-1/2" 
          : "left-[calc(50%+8rem)] -translate-x-1/2"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-2 rounded-xl shadow-sm bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-700",
          className,
        )}
      >
        {/* Selectable Modes */}
        <div className="flex items-center gap-1 px-1 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          {ActionbarItems.filter(i => SELECTABLE_MODES.includes(i.id)).map((item) => {
            const isSelected = selectedMode === item.id

            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={transition}
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200",
                  isSelected
                    ? "bg-blue-500 text-white shadow"
                    : "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700",
                )}
              >
                <item.icon size={16} />
                <span>{item.title}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Other Actions */}
        <div className="flex items-center gap-1">
          {ActionbarItems.filter(i => !SELECTABLE_MODES.includes(i.id)).map((item) => {
            const onClick =
              item.id === "emotions"
                ? () => setIsDrawerOpen(true)
                : () => handleItemClick(item.id)

            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className="p-2 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <item.icon size={18} />
              </motion.button>
            )
          })}
        </div>

        {/* Save Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-all duration-200",
            "text-white border-white hover:bg-gray-50 dark:hover:bg-gray-900/20",
            isSaving && "opacity-50 cursor-not-allowed",
          )}
        >
          <Save size={16} />
          <span>Save</span>
        </motion.button>
      </div>
                <EmotionLogDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />

    </div>
  )
}

export default Actionbar
