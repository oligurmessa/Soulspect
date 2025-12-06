"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  TypeOutline,
  SlidersHorizontal,
  FileText,
  Paperclip,
  AudioLines,
  Video,
  BadgePlus,
  Wand,
  Lock,
  Unlock,
  ChevronsUp,
  ChevronsDown,
  Camera,
  type LucideIcon,
} from "lucide-react"
import { GeminiSparkle } from "@/components/ui/icons/gemini-sparkle"
import { CameraModal } from "@/components/CameraModal"
import { EmotionAnchor } from "@/components/emotion_anchor"
import AudioDrawer from "@/components/drawers/audio_drawer"
import AudioConfirmationBanner from "@/components/ui/audio-confirmation-banner"
import { ItemCarouselRef } from "@/components/ItemCarousel"
import { toast } from "@/components/ui/use-toast"

// ============================================================================
// Types
// ============================================================================

interface ActionbarItem {
  id: string
  title: string
  icon: LucideIcon
  ariaLabel?: string
}

interface ActionbarProps {
  className?: string
  selectedMode: string | null
  onModeChange: (mode: string) => void
  onToolbarClick?: () => void
  onImageAttach?: (files: FileList) => void
  onPromptSelect?: (prompt: string) => void
  onAudioRecorded?: (audioBlob: Blob, transcript?: string) => void
  onEmotionLogged?: (
    emotion: string,
    intensity: number,
    note?: string,
    emotions?: string[],
    triggers?: string[]
  ) => void
  itemCarouselRef?: React.RefObject<ItemCarouselRef | null>
  isEditing?: boolean
  alwaysShowAllButtons?: boolean
  onPromptClick?: () => void
  isReflectionsCollapsed?: boolean
  onToggleReflectionsCollapse?: () => void
  hasReflections?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const MODES: ActionbarItem[] = [
  { id: "Type", title: "Write", icon: FileText, ariaLabel: "Text mode" },
  { id: "Video", title: "Video", icon: Video, ariaLabel: "Video mode" },
]

const ACTIONS: ActionbarItem[] = [
  { id: "audio", title: "Audio", icon: AudioLines, ariaLabel: "Record audio" },
  { id: "emotions", title: "Emotions", icon: BadgePlus, ariaLabel: "Log emotions" },
  { id: "camera", title: "Camera", icon: Camera, ariaLabel: "Take photo" },
  { id: "attach", title: "Attach", icon: Paperclip, ariaLabel: "Attach images" },
  { id: "connections", title: "Connections", icon: SlidersHorizontal, ariaLabel: "View connections" },
]

const ANIMATION = {
  spring: { type: "spring" as const, bounce: 0.2, duration: 0.5 },
  smooth: { duration: 0.2, ease: "easeInOut" as const },
}

// ============================================================================
// Component
// ============================================================================

export function Actionbar({
  className,
  selectedMode,
  onModeChange,
  alwaysShowAllButtons = false,
  onToolbarClick,
  onImageAttach,
  onAudioRecorded,
  onEmotionLogged,
  itemCarouselRef,
  onPromptClick,
  isReflectionsCollapsed = false,
  onToggleReflectionsCollapse,
  hasReflections = false,
}: ActionbarProps) {
  // ============================================================================
  // State
  // ============================================================================

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [isAudioDrawerOpen, setIsAudioDrawerOpen] = React.useState(false)
  const [isCameraOpen, setIsCameraOpen] = React.useState(false)
  const [showAudioConfirmation, setShowAudioConfirmation] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    )

    if (imageFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please select only image files",
        variant: "destructive",
      })
      return
    }

    if (imageFiles.length < files.length) {
      toast({
        title: "Some files skipped",
        description: `${files.length - imageFiles.length} non-image files were skipped`,
      })
    }

    const dataTransfer = new DataTransfer()
    imageFiles.forEach((file) => dataTransfer.items.add(file))

    if (onImageAttach) {
      onImageAttach(dataTransfer.files)
    }

    event.target.value = ""
  }

  const handleCameraPhotoTaken = (file: File) => {
    if (onImageAttach) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      onImageAttach(dataTransfer.files)
    }
  }

  const handleAudioClick = () => {
    const audioCount = itemCarouselRef?.current?.getAudioCount() || 0

    if (audioCount >= 2) {
      setShowAudioConfirmation(true)
    } else {
      setIsAudioDrawerOpen(true)
    }
  }

  const handleActionClick = (actionId: string) => {
    switch (actionId) {
      case "audio":
        handleAudioClick()
        break
      case "emotions":
        setIsDrawerOpen(true)
        break
      case "attach":
        fileInputRef.current?.click()
        break
      case "connections":
        // Handle connections
        break
      default:
        break
    }
  }

  const handleIntensifyClick = () => {
    const carouselItems = itemCarouselRef?.current?.getAllItems()

    if (!carouselItems?.emotions || carouselItems.emotions.length === 0) {
      toast({
        title: "No emotions logged",
        description: "Please log an emotion first to use this feature",
      })
      setIsDrawerOpen(true)
    } else {
      toast({
        title: "Intensify",
        description: "Enhancing your content based on logged emotions",
      })
    }
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        aria-label="Attach images"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={ANIMATION.smooth}
        className={cn(
          "flex items-center gap-1.5 sm:gap-2",
          "px-2 py-1.5 sm:px-3 sm:py-2",
          "rounded-xl sm:rounded-2xl",
          "bg-white/80 dark:bg-neutral-900/80",
          "backdrop-blur-xl",
          "border border-neutral-200/50 dark:border-neutral-800/50",
          "shadow-lg shadow-neutral-900/5 dark:shadow-black/20",
          "transition-all duration-300",
          "hover:shadow-xl hover:shadow-neutral-900/10 dark:hover:shadow-black/30",
          className
        )}
      >
        {/* Mode Selection */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-neutral-100/80 dark:bg-neutral-800/50">
          {MODES.map((mode) => {
            const isSelected = selectedMode === mode.id
            const Icon = mode.icon

            return (
              <motion.button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={ANIMATION.spring}
                aria-label={mode.ariaLabel}
                className={cn(
                  "relative flex items-center gap-1.5 sm:gap-2",
                  "px-2.5 py-1.5 sm:px-3 sm:py-2",
                  "rounded-md sm:rounded-lg",
                  "text-xs sm:text-sm font-medium",
                  "transition-all duration-200",
                  "outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600",
                  isSelected
                    ? [
                      "bg-white dark:bg-neutral-700",
                      "text-neutral-900 dark:text-white",
                      "shadow-sm",
                    ]
                    : [
                      "text-neutral-600 dark:text-neutral-400",
                      "hover:text-neutral-900 dark:hover:text-neutral-200",
                    ]
                )}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
                <span className="hidden xs:inline">{mode.title}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Separator */}
        <div className="w-px h-5 sm:h-6 bg-neutral-200 dark:bg-neutral-800" />

        {/* Action Buttons */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {ACTIONS.map((action) => {
            const Icon = action.icon

            return (
              <Tooltip key={action.id} content={action.title}>
                <motion.button
                  onClick={() => handleActionClick(action.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={ANIMATION.spring}
                  aria-label={action.ariaLabel}
                  className={cn(
                    "p-1.5 sm:p-2",
                    "rounded-md sm:rounded-lg",
                    "text-neutral-600 dark:text-neutral-400",
                    "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    "hover:text-neutral-900 dark:hover:text-white",
                    "transition-all duration-200",
                    "outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600"
                  )}
                >
                  <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
                </motion.button>
              </Tooltip>
            )
          })}

          {/* AI Reflection Button */}
          {onPromptClick && (
            <Tooltip content="AI Reflection">
              <motion.button
                onClick={onPromptClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={ANIMATION.spring}
                aria-label="Add AI reflection"
                className={cn(
                  "p-1.5 sm:p-2",
                  "rounded-md sm:rounded-lg",
                  "text-[#ff9066] dark:text-[#ff9066]",
                  "hover:bg-[#ff9066]/10 dark:hover:bg-[#ff9066]/10",
                  "hover:text-[#ff9066] dark:hover:text-[#ff9066]",
                  "transition-all duration-200",
                  "outline-none focus-visible:ring-2 focus-visible:ring-[#ff9066]"
                )}
              >
                <GeminiSparkle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
              </motion.button>
            </Tooltip>
          )}

          {/* Toolbar Button - Desktop only */}
          {(alwaysShowAllButtons || selectedMode === "Type") && onToolbarClick && (
            <Tooltip content="Formatting">
              <motion.button
                onClick={onToolbarClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={ANIMATION.spring}
                aria-label="Toggle formatting toolbar"
                className={cn(
                  "hidden sm:flex p-2 rounded-lg",
                  "text-neutral-600 dark:text-neutral-400",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  "hover:text-neutral-900 dark:hover:text-white",
                  "transition-all duration-200",
                  "outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600"
                )}
              >
                <TypeOutline className="w-[18px] h-[18px]" strokeWidth={2} />
              </motion.button>
            </Tooltip>
          )}

          {/* Intensify Button - Tablet+ */}
          <Tooltip content="Intensify">
            <motion.button
              onClick={handleIntensifyClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={ANIMATION.spring}
              aria-label="Intensify content"
              className={cn(
                "hidden xs:flex p-1.5 sm:p-2",
                "rounded-md sm:rounded-lg",
                "text-amber-600 dark:text-amber-400",
                "hover:bg-amber-50 dark:hover:bg-amber-950/50",
                "hover:text-amber-700 dark:hover:text-amber-300",
                "transition-all duration-200",
                "outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              )}
            >
              <Wand className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
            </motion.button>
          </Tooltip>
        </div>

        {/* Separator */}
        {onToggleReflectionsCollapse && (
          <div className="w-px h-5 sm:h-6 bg-neutral-200 dark:bg-neutral-800" />
        )}

        {/* Collapse/Expand Toggle */}
        {onToggleReflectionsCollapse && (
          <motion.button
            onClick={hasReflections ? onToggleReflectionsCollapse : undefined}
            disabled={!hasReflections}
            whileHover={hasReflections ? { scale: 1.02 } : {}}
            whileTap={hasReflections ? { scale: 0.98 } : {}}
            transition={ANIMATION.spring}
            aria-label={
              isReflectionsCollapsed ? "Expand all reflections" : "Collapse all reflections"
            }
            className={cn(
              "flex items-center gap-1.5 sm:gap-2",
              "px-2.5 py-1.5 sm:px-3 sm:py-2",
              "rounded-lg sm:rounded-xl",
              "text-xs sm:text-sm font-medium",
              "transition-all duration-200",
              "outline-none focus-visible:ring-2",
              !hasReflections
                ? "opacity-40 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600"
                : isReflectionsCollapsed
                  ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
            )}
          >
            {isReflectionsCollapsed ? (
              <ChevronsDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
            ) : (
              <ChevronsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
            )}
            <span className="hidden sm:inline">
              {isReflectionsCollapsed ? "Expand" : "Collapse"}
            </span>
          </motion.button>
        )}
      </motion.div>

      {/* Drawers & Modals */}
      <EmotionAnchor
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onEmotionLogged={onEmotionLogged}
      />

      <AudioDrawer
        open={isAudioDrawerOpen}
        onOpenChange={setIsAudioDrawerOpen}
        description="Record your voice."
        onAudioRecorded={onAudioRecorded}
      />

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoTaken={handleCameraPhotoTaken}
      />

      {showAudioConfirmation && (
        <AudioConfirmationBanner
          onAccept={() => {
            setShowAudioConfirmation(false)
            setIsAudioDrawerOpen(true)
          }}
          onReject={() => setShowAudioConfirmation(false)}
        />
      )}
    </>
  )
}

// ============================================================================
// Tooltip Component
// ============================================================================

interface TooltipProps {
  content: string
  children: React.ReactElement
}

function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
              "px-2 py-1 rounded-md",
              "bg-neutral-900 dark:bg-neutral-100",
              "text-white dark:text-neutral-900",
              "text-xs font-medium whitespace-nowrap",
              "pointer-events-none z-50",
              "shadow-lg"
            )}
          >
            {content}
            <div
              className={cn(
                "absolute top-full left-1/2 -translate-x-1/2 -mt-px",
                "w-2 h-2 rotate-45",
                "bg-neutral-900 dark:bg-neutral-100"
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Actionbar
