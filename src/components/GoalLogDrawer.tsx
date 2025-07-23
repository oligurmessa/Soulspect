"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { addGoalLog } from "@/lib/dbHelpers"

interface GoalLogDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const goalTypes = ["Short-Term", "Long-Term"]

export function GoalLogDrawer({ open, onOpenChange }: GoalLogDrawerProps) {
  const [step, setStep] = useState<"basic" | "details" | "complete">("basic")
  const [goalTitle, setGoalTitle] = useState("")
  const [goalType, setGoalType] = useState("")
  const [whyMatters, setWhyMatters] = useState("")
  const [deadline, setDeadline] = useState("")
  const [progress, setProgress] = useState([0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const resetForm = () => {
    setGoalTitle("")
    setGoalType("")
    setWhyMatters("")
    setDeadline("")
    setProgress([0])
    setStep("basic")
  }

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save a goal.",
        variant: "destructive",
      })
      return
    }

    if (!goalTitle || !goalType) {
      toast({
        title: "Error",
        description: "Please fill in the required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const goalData = {
        goalTitle,
        goalType,
        whyMatters: whyMatters || undefined,
        deadline: deadline || undefined,
        progress: progress[0],
      }

      await addGoalLog(user.uid, goalData)

      toast({
        title: "Success!",
        description: "Your goal has been saved.",
      })

      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving goal:", error)
      toast({
        title: "Error",
        description: "Failed to save your goal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canContinueToDetails = goalTitle && goalType

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="dark bg-black/100 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-2xl overflow-hidden h-[65vh]">
        <div className="mx-auto w-full max-w-3xl flex flex-col relative h-full">
          
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-20"></div>

          {step === "basic" && (
            <motion.div key="basic" className="p-4 pt-8 flex flex-col h-full">
              <DrawerHeader className="flex items-center justify-between p-0 mb-6 flex-none">
                <div className="flex-1">
                  <DrawerTitle className="text-white/90 text-xl font-light">New Goal</DrawerTitle>
                  <DrawerDescription className="text-white/60 text-sm mt-1">
                    What goal would you like to achieve?
                  </DrawerDescription>
                </div>
                <Button
                  onClick={() => setStep("details")}
                  disabled={!canContinueToDetails}
                  className="ml-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  Continue
                </Button>
              </DrawerHeader>

              <div className="flex-1 flex flex-col space-y-6 px-4 pb-6 overflow-y-auto">
                <div>
                  <Label htmlFor="goalTitle" className="text-white/90 text-sm font-medium">
                    Goal Title *
                  </Label>
                  <Input
                    id="goalTitle"
                    placeholder="e.g., Learn Spanish, Run a marathon, Save $10,000"
                    className="mt-2 bg-white/5 border-white/10 text-white/80 placeholder:text-white/40 focus-visible:ring-white/30"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="goalType" className="text-white/90 text-sm font-medium">
                    Goal Type *
                  </Label>
                  <Select value={goalType} onValueChange={setGoalType}>
                    <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white/80 focus:ring-white/30">
                      <SelectValue placeholder="Select goal type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {goalTypes.map((type) => (
                        <SelectItem key={type} value={type} className="text-white/80">
                          {type} {type === "Short-Term" ? "(< 1 year)" : "(1+ years)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {step === "details" && (
            <motion.div key="details" className="p-4 pt-8 flex flex-col h-full">
              <DrawerHeader className="flex items-center justify-between p-0 mb-6 flex-none">
                <div className="flex-1">
                  <DrawerTitle className="text-white/90 text-xl font-light">Goal Details</DrawerTitle>
                  <DrawerDescription className="text-white/60 text-sm mt-1">
                    Add context and track your progress.
                  </DrawerDescription>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="ml-6 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white border border-green-500 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Goal"}
                </Button>
              </DrawerHeader>

              <div className="flex-1 flex flex-col space-y-6 px-4 pb-6 overflow-y-auto">
                <div>
                  <Label htmlFor="whyMatters" className="text-white/90 text-sm font-medium">
                    Why this matters
                  </Label>
                  <Textarea
                    id="whyMatters"
                    placeholder="Connect this goal to your values and what truly matters to you..."
                    className="mt-2 bg-white/5 border-white/10 text-white/80 placeholder:text-white/40 focus-visible:ring-white/30 resize-none"
                    rows={3}
                    value={whyMatters}
                    onChange={(e) => setWhyMatters(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="deadline" className="text-white/90 text-sm font-medium">
                    Deadline
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    className="mt-2 bg-white/5 border-white/10 text-white/80 focus-visible:ring-white/30"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                  <p className="text-white/60 text-xs mt-1">Optional but adds commitment</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="progress" className="text-white/90 text-sm font-medium">
                      Current Progress
                    </Label>
                    <span className="text-white/80 text-sm font-medium bg-white/10 px-3 py-1 rounded-lg">
                      {progress[0]}%
                    </span>
                  </div>
                  
                  <div className="px-2">
                    <Slider
                      id="progress"
                      min={0}
                      max={100}
                      step={5}
                      value={progress}
                      onValueChange={setProgress}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-white/60 mt-2">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  <p className="text-white/60 text-xs">
                    Track your progress to stay motivated and see how far you've come
                  </p>
                </div>

                {/* Progress visualization */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/80 text-sm font-medium">Progress Overview</span>
                    <span className="text-white/60 text-xs">
                      {progress[0] === 0 ? "Just getting started" : 
                       progress[0] < 25 ? "Making progress" :
                       progress[0] < 50 ? "Quarter way there" :
                       progress[0] < 75 ? "Halfway done!" :
                       progress[0] < 100 ? "Almost there!" : "Completed!"}
                    </span>
                  </div>
                  
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress[0]}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </DrawerContent>
    </Drawer>
  )
}