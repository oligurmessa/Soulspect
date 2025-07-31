"use client"

import * as React from "react"
import { AnimatePresence, motion, useAnimation } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  SlidersHorizontal,
  Type,
  Paperclip,
  AudioLines,
  ChevronRight,
  Video,
  BadgePlus,
  Sparkles,
  Lock,
  Unlock,
  type LucideIcon,
} from "lucide-react"
import { EmotionAnchor } from "@/components/emotion_anchor"
import AudioDrawer from "@/components/drawers/audio_drawer"
import AudioConfirmationBanner from "@/components/ui/audio-confirmation-banner"
import { ItemCarouselRef } from "@/components/ItemCarousel"
import { toast } from "@/components/ui/use-toast"
import { useSidebar } from "@/components/ui/sidebar"
// import { journalPrompts, getRandomPrompt, getCategories, type JournalPrompt } from "@/data/prompts"

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
  onImageAttach?: (files: FileList) => void
  onPromptSelect?: (prompt: string) => void
  onAudioRecorded?: (audioBlob: Blob, transcript?: string) => void
  onEmotionLogged?: (emotion: string, intensity: number, note?: string, emotions?: string[], triggers?: string[]) => void
  itemCarouselRef?: React.RefObject<ItemCarouselRef | null>
  isEditing?: boolean
}

const SELECTABLE_MODES = ["Type", "Video"]

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
  onImageAttach,
  onPromptSelect,
  onAudioRecorded,
  onEmotionLogged,
  itemCarouselRef,
  isEditing = false,
}: ActionbarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [isAudioDrawerOpen, setIsAudioDrawerOpen] = React.useState(false)
  const [showAudioConfirmation, setShowAudioConfirmation] = React.useState(false)
  const [isPromptDropdownOpen, setIsPromptDropdownOpen] = React.useState(false)
  const [isLocked, setIsLocked] = React.useState(false)
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const promptDropdownRef = React.useRef<HTMLDivElement>(null)
  const promptHoldTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const promptAnimationControls = useAnimation()


  const ActionbarItems: ActionbarItem[] = [
    { id: "Type", title: "Type", icon: Type },
    { id: "Video", title: "Video", icon: Video },
    { id: "emotions", title: "Emotions", icon: BadgePlus },
    { id: "attach", title: "Attach", icon: Paperclip },
    { id: "prompt", title: "Prompt", icon: ChevronRight },
    { id: "audio", title: "Audio", icon: AudioLines },
  ]

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0 && onImageAttach) {
      // Validate that all files are images
      const imageFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/')
      )
      
      if (imageFiles.length === 0) {
        toast({
          title: "Invalid file type",
          description: "Please select only image files (PNG, JPG, GIF, etc.)",
          variant: "destructive"
        })
        return
      }
      
      if (imageFiles.length < files.length) {
        toast({
          title: "Some files skipped",
          description: `${files.length - imageFiles.length} non-image files were skipped`,
          variant: "default"
        })
      }
      
      // Create a new FileList with only image files
      const dt = new DataTransfer()
      imageFiles.forEach(file => dt.items.add(file))
      onImageAttach(dt.files)
    }
    
    // Reset input so the same file can be selected again
    if (event.target) {
      event.target.value = ''
    }
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }


  const handleRandomPrompt = () => {
    // const randomPrompt = getRandomPrompt()
    // handlePromptSelect(randomPrompt)
  }

  const handleAudioClick = () => {
    // Check if we already have 2 audio recordings
    const currentAudioCount = itemCarouselRef?.current?.getAudioCount() || 0;
    
    if (currentAudioCount >= 2) {
      // Show confirmation banner
      setShowAudioConfirmation(true);
    } else {
      // Open audio drawer directly
      setIsAudioDrawerOpen(true);
    }
  }

  const handleAudioConfirmationAccept = () => {
    setShowAudioConfirmation(false);
    setIsAudioDrawerOpen(true);
  }

  const handleAudioConfirmationReject = () => {
    setShowAudioConfirmation(false);
  }

  const handlePromptClick = () => {
    // Quick click - set random prompt as title
    // const randomPrompt = getRandomPrompt()
    // if (onPromptSelect) {
    //   onPromptSelect(randomPrompt.title)
    // }
  }

  const handlePromptHold = () => {
    // Hold - open dropdown
    console.log('Hold completed - opening dropdown')
    setIsPromptDropdownOpen(true)
  }

  const handlePromptHoldStart = () => {
    console.log('Hold start')
    promptAnimationControls.set({ width: "0%" })
    promptAnimationControls.start({
      width: "100%",
      transition: {
        duration: 1.5, // 1.5 seconds hold duration
        ease: "linear",
      },
    })

    promptHoldTimeoutRef.current = setTimeout(() => {
      console.log('Hold timeout fired')
      handlePromptHold()
      promptAnimationControls.stop()
      promptAnimationControls.start({ width: "0%", transition: { duration: 0.1 } })
      promptHoldTimeoutRef.current = null
    }, 1500)
  }

  const handlePromptHoldEnd = () => {
    console.log('Hold end, timeout exists:', !!promptHoldTimeoutRef.current)
    if (promptHoldTimeoutRef.current) {
      // Hold was not completed - this is a click
      clearTimeout(promptHoldTimeoutRef.current)
      promptHoldTimeoutRef.current = null
      console.log('Quick click detected')
      handlePromptClick()
    }
    // Always reset animation
    promptAnimationControls.stop()
    promptAnimationControls.start({ width: "0%", transition: { duration: 0.1 } })
  }

  // Close dropdown when clicking outside (with delay to prevent immediate close on hold)
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (promptDropdownRef.current && 
          !promptDropdownRef.current.contains(event.target as Node) && 
          !(event.target as Element).closest('[data-prompt-button]')) {
        setIsPromptDropdownOpen(false)
      }
    }

    if (isPromptDropdownOpen) {
      // Add small delay to prevent immediate close after hold
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100)
      
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isPromptDropdownOpen])

  const handleItemClick = (itemId: string) => {
    if (SELECTABLE_MODES.includes(itemId)) {
      onModeChange(itemId)
    }

    // Handle attachment click
    if (itemId === "attach") {
      handleAttachClick()
      return
    }

    // Prompt click is now handled by hold button - skip here
    if (itemId === "prompt") {
      return
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
      {/* Hidden file input for image attachments */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        aria-label="Attach images"
      />
      
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-2 rounded-xl shadow-sm bg-background/90 backdrop-blur-md border border-border",
          className,
        )}
      >
        {/* Selectable Modes */}
        <div className="flex items-center gap-1 px-1 py-1 rounded-lg bg-muted">
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
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:bg-secondary/70 dark:hover:bg-secondary/70",
                )}
              >
                <item.icon size={16} />
                <span>{item.title}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Other Actions */}
        <div className="flex items-center gap-1 relative">
          {ActionbarItems.filter(i => !SELECTABLE_MODES.includes(i.id)).map((item) => {
            // Special handling for prompt button with hold functionality
            if (item.id === "prompt") {
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseDown={handlePromptHoldStart}
                  onMouseUp={handlePromptHoldEnd}
                  onMouseLeave={handlePromptHoldEnd}
                  onTouchStart={handlePromptHoldStart}
                  onTouchEnd={handlePromptHoldEnd}
                  onTouchCancel={handlePromptHoldEnd}
                  data-prompt-button
                  className={cn(
                    "relative overflow-hidden touch-none p-2 rounded-md text-muted-foreground hover:bg-secondary/70 transition-colors",
                    isPromptDropdownOpen && "bg-secondary/70"
                  )}
                >
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={promptAnimationControls}
                    className="absolute left-0 top-0 h-full bg-primary/20"
                  />
                  <span className="relative z-10">
                    <item.icon size={18} />
                  </span>
                </motion.button>
              )
            }

            // Regular buttons for other actions
            const onClick =
              item.id === "emotions"
                ? () => setIsDrawerOpen(true)
                : item.id === "audio"
                ? handleAudioClick
                : () => handleItemClick(item.id)

            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className="p-2 rounded-md text-muted-foreground hover:bg-secondary/70 transition-colors"
              >
                <item.icon size={18} />
              </motion.button>
            )
          })}

          {/* Prompt Dropdown */}
          <AnimatePresence>
            {isPromptDropdownOpen && (
              <motion.div
                ref={promptDropdownRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full mb-2 right-0 w-80 bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-lg z-50"
              >
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Journal Prompts</h3>
                    <button
                      onClick={handleRandomPrompt}
                      className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
                    >
                      Random
                    </button>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    <div className="text-center text-muted-foreground text-sm p-4">
                      Prompts temporarily unavailable
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Toolbar Button (only for Type mode) */}
        {selectedMode === "Type" && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToolbarClick && onToolbarClick()}
            className="p-2 rounded-md text-muted-foreground hover:bg-secondary/70 transition-colors"
            title="Toggle Toolbar"
          >
            <SlidersHorizontal size={18} />
          </motion.button>
        )}

        {/* Intensify Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            // Check if emotions are logged
            const carouselItems = itemCarouselRef?.current?.getAllItems()
            if (!carouselItems?.emotions || carouselItems.emotions.length === 0) {
              toast({
                title: "No emotions logged",
                description: "Please log an emotion first to use the intensify feature",
                variant: "default"
              })
              setIsDrawerOpen(true) // Open emotion drawer
            } else {
              // TODO: Implement intensify functionality
              toast({
                title: "Intensify",
                description: "This feature will enhance your content based on logged emotions",
              })
            }
          }}
          className="p-2 rounded-md text-muted-foreground hover:bg-secondary/70 transition-colors"
          title="Intensify"
        >
          <Sparkles size={18} />
        </motion.button>

        {/* Lock/Unlock Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsLocked(!isLocked)}
          className={cn(
            "flex items-center gap-2 px-4 py-2",
            "rounded-xl border shadow-sm transition-all duration-200",
            "hover:shadow-md active:border-primary/50",
            isLocked
              ? [
                  "bg-primary text-white",
                  "border-primary/30",
                  "hover:bg-primary/90",
                  "hover:border-primary/40",
                ]
              : [
                  "bg-background text-muted-foreground",
                  "border-border/30",
                  "hover:bg-muted",
                  "hover:text-foreground",
                  "hover:border-border/40",
                ]
          )}
        >
          {isLocked ? (
            <Lock className="w-3.5 h-3.5" />
          ) : (
            <Unlock className="w-3.5 h-3.5" />
          )}
          <span className="text-sm font-medium">
            {isLocked ? "Locked" : "Unlocked"}
          </span>
        </motion.button>
      </div>
      
      <EmotionAnchor open={isDrawerOpen} onOpenChange={setIsDrawerOpen} onEmotionLogged={onEmotionLogged} />
      
      <AudioDrawer
        open={isAudioDrawerOpen}
        onOpenChange={setIsAudioDrawerOpen}
        description="Record your voice."
        onAudioRecorded={onAudioRecorded}
      />

      {/* Audio Confirmation Banner */}
      {showAudioConfirmation && (
        <AudioConfirmationBanner
          onAccept={handleAudioConfirmationAccept}
          onReject={handleAudioConfirmationReject}
        />
      )}

    </div>
  )
}

export default Actionbar