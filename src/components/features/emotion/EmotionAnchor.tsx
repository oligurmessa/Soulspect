"use client"

// =============================================================================
// EMOTION ANCHOR - Emotion logging flow with multi-step process
// =============================================================================
// A beautifully designed emotion logging interface with:
// - Three-step flow: mood → emotions → triggers
// - Smooth animations between steps
// - Professional button styling
// - Clean visual hierarchy
// - Glass-morphism aesthetic
// =============================================================================

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { SleekDrawer } from "@/components/sleek_drawer"
import { useToast } from "@/components/ui/use-toast"
import Selector from "./EmotionSelector"
import { useAuth } from "@/context/AuthContext"
import { addEmotionLog } from "@/lib/data/legacy/dbHelpers"
import { AlertCircle } from "lucide-react"

// =============================================================================
// Types & Constants
// =============================================================================

interface EmotionAnchorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEmotionLogged?: (
    emotion: string,
    intensity: number,
    note?: string,
    emotions?: string[],
    triggers?: string[]
  ) => void
}

type Step = "mood" | "emotions" | "triggers"

const ANIMATION = {
  step: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.2, ease: "easeInOut" as const },
  },
}

const STEP_CONFIG = {
  mood: {
    title: "How are you feeling?",
    description: "Select the option that best matches your current state.",
  },
  emotions: {
    title: "What are you feeling?",
    description: "Select all emotions that apply.",
  },
  triggers: {
    title: "What triggered this?",
    description: "Select any triggers that apply (optional).",
  },
}

const MOOD_LEVELS = [
  { value: 0, label: "Very Unhappy", description: "Heavy, restless" },
  { value: 1, label: "Unhappy", description: "Low energy" },
  { value: 2, label: "Slightly Unhappy", description: "Pensive" },
  { value: 3, label: "Neutral", description: "Calm, steady" },
  { value: 4, label: "Slightly Happy", description: "Peaceful" },
  { value: 5, label: "Happy", description: "Warm energy" },
  { value: 6, label: "Very Happy", description: "Radiant" },
]

// =============================================================================
// Component
// =============================================================================

export function EmotionAnchor({
  open,
  onOpenChange,
  onEmotionLogged,
}: EmotionAnchorProps) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [step, setStep] = useState<Step>("mood")
  const [mood, setMood] = useState<number | null>(null)
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Resets form to initial state
   */
  const resetForm = () => {
    setMood(null)
    setSelectedEmotions([])
    setSelectedTriggers([])
    setStep("mood")
  }

  /**
   * Handles form submission and saves emotion log
   */
  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to save an emotion log.",
        variant: "destructive",
      })
      return
    }

    if (mood === null) {
      toast({
        title: "Mood required",
        description: "Please select a mood level.",
        variant: "destructive",
      })
      return
    }

    if (selectedEmotions.length === 0) {
      toast({
        title: "Please select emotions",
        description: "You need to select at least one emotion to continue.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const intensity = Math.round(((mood + 1) / 7) * 10) // Convert 0-6 to 1-10 scale

      const logData: any = {
        mood,
        emotions: selectedEmotions,
        intensity,
      }

      // Only add triggers if there are any selected
      if (selectedTriggers.length > 0) {
        logData.triggers = selectedTriggers
      }

      await addEmotionLog(user.uid, logData)

      toast({
        title: "Emotion logged!",
        description: "Your emotion has been saved successfully.",
      })

      // Call the callback to add to carousel
      if (onEmotionLogged) {
        const primaryEmotion = selectedEmotions[0]
        onEmotionLogged(
          primaryEmotion,
          intensity,
          undefined,
          selectedEmotions,
          selectedTriggers
        )
      }

      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving emotion log:", error)
      toast({
        title: "Error",
        description: "Failed to save your emotion log. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Continues from mood step to emotions step
   */
  const handleContinueFromMood = () => {
    if (mood === null) {
      toast({
        title: "Select a mood",
        description: "Please select how you are feeling to continue.",
        variant: "destructive",
      })
      return
    }
    setStep("emotions")
  }

  /**
   * Continues from emotions step to triggers step
   */
  const handleContinueFromEmotions = () => {
    if (selectedEmotions.length === 0) {
      toast({
        title: "Please select emotions",
        description: "You need to select at least one emotion to continue.",
        variant: "destructive",
      })
      return
    }
    setStep("triggers")
  }

  /**
   * Handles back button navigation
   */
  const handleBack = () => {
    if (step === "emotions") {
      setStep("mood")
    } else if (step === "triggers") {
      setStep("emotions")
    }
  }

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------



  /**
   * Renders content based on current step
   */
  const renderStepContent = () => {
    switch (step) {
      case "mood":
        return (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <div className="flex justify-between items-stretch w-full gap-1 h-full max-h-[240px]"> {/* Reduced gap and max-height */}
              {/* Column 1: Unhappy (0, 1, 2) */}
              <div className="flex flex-col justify-between gap-1 flex-1"> {/* Reduced gap */}
                {MOOD_LEVELS.slice(0, 3).map((level) => (
                  <MoodButton
                    key={level.value}
                    level={level}
                    mood={mood}
                    setMood={setMood}
                  />
                ))}
              </div>

              {/* Column 2: Neutral (3) */}
              <div className="flex flex-col justify-center items-center flex-1">
                <MoodButton
                  level={MOOD_LEVELS[3]}
                  mood={mood}
                  setMood={setMood}
                  className="w-full h-full"
                />
              </div>

              {/* Column 3: Happy (4, 5, 6) */}
              <div className="flex flex-col justify-between gap-1 flex-1"> {/* Reduced gap */}
                {MOOD_LEVELS.slice(4, 7).map((level) => (
                  <MoodButton
                    key={level.value}
                    level={level}
                    mood={mood}
                    setMood={setMood}
                  />
                ))}
              </div>
            </div>
          </div>
        )

      case "emotions":
        return (
          <div className={cn(
            "h-full overflow-y-auto px-1", // Reduced padding
            "scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent"
          )}>
            <Selector variant="emotion" onChange={setSelectedEmotions} />
          </div>
        )

      case "triggers":
        return (
          <div className={cn(
            "h-full overflow-y-auto px-1", // Reduced padding
            "scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent"
          )}>
            <Selector variant="trigger" onChange={setSelectedTriggers} />
          </div>
        )
    }
  }

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------

  const config = STEP_CONFIG[step]
  const currentStepNumber = step === "mood" ? 1 : step === "emotions" ? 2 : 3

  const handleNext = () => {
    if (step === "mood") handleContinueFromMood()
    else if (step === "emotions") handleContinueFromEmotions()
  }

  return (
    <SleekDrawer
      open={open}
      onOpenChange={onOpenChange}
      currentStep={currentStepNumber}
      totalSteps={3}
      onBack={handleBack}
      onNext={handleNext}
      onDone={handleSubmit}
    >
      <div className="flex flex-col h-full w-full">
        {/* Title & Description (Centered) */}
        <div className="text-center mb-2"> {/* Reduced margin */}
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"> {/* Reduced text size */}
            {config.title}
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5"> {/* Reduced text size and margin */}
            {config.description}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              {...ANIMATION.step}
              className="h-full flex flex-col"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </SleekDrawer>
  )
}

// Helper component for mood buttons (Chip Style with Orange Theme)
function MoodButton({ level, mood, setMood, className }: {
  level: any,
  mood: number | null,
  setMood: (m: number) => void,
  className?: string
}) {
  const isSelected = mood === level.value

  return (
    <motion.button
      whileHover={{
        backgroundColor: isSelected ? "#2a1711" : "rgba(39, 39, 42, 0.8)"
      }}
      whileTap={{
        backgroundColor: isSelected ? "#1f1209" : "rgba(39, 39, 42, 0.9)"
      }}
      onClick={() => setMood(level.value)}
      initial={false}
      animate={{
        backgroundColor: isSelected ? "#2a1711" : "rgba(39, 39, 42, 0.5)",
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 0.5,
        backgroundColor: { duration: 0.1 },
      }}
      className={cn(
        "inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-bold w-full h-full", // Increased text size and weight
        "whitespace-nowrap ring-1 ring-inset transition-all",
        isSelected
          ? "text-[#ff9066] ring-[hsla(0,0%,100%,0.12)]"
          : "text-zinc-400 ring-[hsla(0,0%,100%,0.06)]",
        className
      )}
    >
      {level.label}
    </motion.button>
  )
}

export default EmotionAnchor