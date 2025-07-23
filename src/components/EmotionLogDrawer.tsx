"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import EmotionVisualizer from "@/components/EmotionsVisualizer";
import EmotionSelector from "./EmotionSelector";
import { useAuth } from "@/context/AuthContext"
import { addEmotionLog } from "@/lib/dbHelpers"

interface EmotionLogDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const triggers = ["Work", "Family", "Social", "Health", "Financial", "Relationship", "Personal Growth", "Other"]

export function EmotionLogDrawer({ open, onOpenChange }: EmotionLogDrawerProps) {
  const [step, setStep] = useState<"visualize" | "selector" | "context" | "notes" | "triggers" | "complete">("visualize")
  const [mood, setMood] = useState(3) // 0-6 scale from EmotionVisualizer
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [context, setContext] = useState("")
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const resetForm = () => {
    setMood(3)
    setSelectedEmotions([])
    setContext("")
    setSelectedTriggers([])
    setStep("visualize")
  }

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save an emotion log.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      await addEmotionLog(user.uid, {
        mood,
        emotions: selectedEmotions,
        context: context || undefined,
        triggers: selectedTriggers.length > 0 ? selectedTriggers : undefined,
        intensity: Math.round(((mood + 1) / 7) * 10), // Convert 0-6 to 1-10 scale
      })

      toast({
        title: "Success!",
        description: "Your emotion log has been saved.",
      })

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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {/* MODIFIED: Added a fixed height (h-[65vh]) to the DrawerContent. */}
      {/* This ensures the drawer's size is consistent and does not change when the step changes. */}
      <DrawerContent className="dark bg-black/100 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-2xl overflow-hidden h-[45vh]">
        {/* MODIFIED: Added h-full to make this container fill the parent's new fixed height. */}
        <div className="mx-auto w-full max-w-3xl flex flex-col relative h-full">
          
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-20"></div>

          {step === "visualize" && (
            // MODIFIED: This container is now a flex column that fills the drawer's height.
            <motion.div key="visualize" className="p-4 pt-8 flex flex-col h-full">
              <DrawerHeader className="flex items-center justify-between p-0 mb-4 flex-none">
                <div className="flex-1">
                  <DrawerTitle className="text-white/90 text-xl font-light">Emotion Log</DrawerTitle>
                  <DrawerDescription className="text-white/60 text-sm mt-1">
                    How are you feeling right now?
                  </DrawerDescription>
                </div>
                <Button
                  onClick={() => setStep("selector")}
                  className="ml-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all duration-200"
                >
                  Continue
                </Button>
              </DrawerHeader>

              {/* MODIFIED: This div now uses flex-1 to fill the remaining space instead of having a fixed pixel height. */}
              {/* The min-h-0 is important to prevent overflow issues within a flex container. */}
              <div className="w-full flex-1 min-h-0">
                <EmotionVisualizer onMoodChange={setMood} /> 
              </div>
            </motion.div>
          )}

          {step === "selector" && (
            // MODIFIED: This container also fills the drawer's height for consistency.
            <motion.div key="selector" className="p-4 pt-8 flex flex-col h-full">
              <DrawerHeader className="flex items-center justify-between p-0 mb-6 flex-none">
                 <div className="flex-1">
                  <DrawerTitle className="text-white/90 text-xl font-light">What's contributing?</DrawerTitle>
                  <DrawerDescription className="text-white/60 text-sm mt-1">
                    Select any emotions that apply.
                  </DrawerDescription>
                </div>
                <Button
                  onClick={() => setStep("context")}
                  className="ml-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all duration-200"
                >
                  Continue
                </Button>
              </DrawerHeader>

              {/* MODIFIED: This wrapper centers the content vertically and allows scrolling if needed. */}
              <div className="w-full flex-1 overflow-y-auto flex justify-center items-center">
                <EmotionSelector onEmotionsChange={setSelectedEmotions} />
              </div>
            </motion.div>
          )}

          {step === "context" && (
            <motion.div key="context" className="flex flex-col h-full p-4 pt-8">
              <DrawerHeader className="flex-none flex items-center justify-between">
                <div className="flex-1">
                  <DrawerTitle className="text-white/90 text-xl font-light">What's happening?</DrawerTitle>
                  <DrawerDescription className="text-white/60 text-sm mt-1">
                    Add some context to your emotion.
                  </DrawerDescription>
                </div>
                <Button
                  onClick={() => setStep("triggers")}
                  className="ml-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all duration-200"
                >
                  Continue
                </Button>
              </DrawerHeader>

              <div className="flex-1 flex flex-col px-4 pb-6">
                <Label htmlFor="context" className="text-white/90 text-sm font-medium">
                  Context
                </Label>
                <Input
                  id="context"
                  placeholder="What's on your mind?"
                  className="mt-2 bg-white/5 border-white/10 text-white/80 placeholder:text-white/40 focus-visible:ring-white/30"
                  onChange={(e) => setContext(e.target.value)}
                  value={context}
                />
              </div>
            </motion.div>
          )}

          {step === "triggers" && (
            <motion.div key="triggers" className="flex flex-col h-full p-4 pt-8">
              <DrawerHeader className="flex-none flex items-center justify-between">
                <div className="flex-1">
                  <DrawerTitle className="text-white/90 text-xl font-light">What triggered this?</DrawerTitle>
                  <DrawerDescription className="text-white/60 text-sm mt-1">
                    Select any triggers that apply (optional).
                  </DrawerDescription>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="ml-6 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white border border-green-500 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </DrawerHeader>

              <div className="flex-1 flex flex-col px-4 pb-6">
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {triggers.map((trigger) => (
                    <div key={trigger} className="flex items-center space-x-2">
                      <Checkbox
                        id={trigger}
                        checked={selectedTriggers.includes(trigger)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTriggers([...selectedTriggers, trigger])
                          } else {
                            setSelectedTriggers(selectedTriggers.filter(t => t !== trigger))
                          }
                        }}
                        className="border-white/20 data-[state=checked]:bg-white/20 data-[state=checked]:border-white/30"
                      />
                      <Label
                        htmlFor={trigger}
                        className="text-white/80 text-sm font-medium cursor-pointer"
                      >
                        {trigger}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </DrawerContent>
    </Drawer>
  )
}