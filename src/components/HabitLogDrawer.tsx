"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { addHabitLog } from "@/lib/dbHelpers"

interface HabitsLogDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: "create" | "edit"
  onHabitSaved?: (habitData: any) => void
}

const frequencies = ["Daily", "Weekly", "Custom"]
const timesOfDay = ["Morning", "Afternoon", "Evening", "Night"]
const estimatedFrequencies = ["Multiple times daily", "Daily", "Few times a week", "Weekly", "Few times a month", "Monthly"]

export function HabitsLogDrawer({ open, onOpenChange, mode = "create", onHabitSaved }: HabitsLogDrawerProps) {
  const [step, setStep] = useState<"basic" | "details" | "complete">("basic")
  const [habitName, setHabitName] = useState("")
  const [habitType, setHabitType] = useState<"Build" | "Break" | "">("")
  
  // Build habit fields
  const [whyMatters, setWhyMatters] = useState("")
  const [frequency, setFrequency] = useState("")
  const [timeOfDay, setTimeOfDay] = useState("")
  const [startDate, setStartDate] = useState("")
  const [streakGoal, setStreakGoal] = useState("")
  
  // Break habit fields
  const [triggerPattern, setTriggerPattern] = useState("")
  const [whyQuit, setWhyQuit] = useState("")
  const [currentFrequency, setCurrentFrequency] = useState("")
  const [replacementHabit, setReplacementHabit] = useState("")
  const [awarenessNudges, setAwarenessNudges] = useState(false)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const resetForm = () => {
    setHabitName("")
    setHabitType("")
    setWhyMatters("")
    setFrequency("")
    setTimeOfDay("")
    setStartDate("")
    setStreakGoal("")
    setTriggerPattern("")
    setWhyQuit("")
    setCurrentFrequency("")
    setReplacementHabit("")
    setAwarenessNudges(false)
    setStep("basic")
  }

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save a habit.",
        variant: "destructive",
      })
      return
    }

    if (!habitName || !habitType) {
      toast({
        title: "Error",
        description: "Please fill in the required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const habitData = {
        habitTitle: habitName,
        habitType,
        ...(habitType === "Build" && {
          whyMatters,
          frequency,
          timeOfDay: timeOfDay || undefined,
          startDate: startDate || undefined,
          streakGoal: streakGoal ? parseInt(streakGoal) : undefined,
        }),
        ...(habitType === "Break" && {
          triggerPattern: triggerPattern || undefined,
          whyQuit,
          currentFrequency,
          replacementHabit: replacementHabit || undefined,
          awarenessNudges,
        }),
      }

      await addHabitLog(user.uid, habitData)

      toast({
        title: "Success!",
        description: "Your habit has been saved.",
      })

      // Call the callback if provided
      if (onHabitSaved) {
        onHabitSaved(habitData)
      }

      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving habit:", error)
      toast({
        title: "Error",
        description: "Failed to save your habit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canContinueToDetails = habitName && habitType

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="dark bg-black/100 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-2xl overflow-hidden h-[65vh]">
        <div className="mx-auto w-full max-w-3xl flex flex-col relative h-full">
          
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-20"></div>

          {step === "basic" && (
            <motion.div key="basic" className="p-4 pt-8 flex flex-col h-full">
              <DrawerHeader className="flex items-center justify-between p-0 mb-6 flex-none">
                <div className="flex-1">
                  <DrawerTitle className="text-white/90 text-xl font-light">New Habit</DrawerTitle>
                  <DrawerDescription className="text-white/60 text-sm mt-1">
                    What habit would you like to work on?
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
                  <Label htmlFor="habitName" className="text-white/90 text-sm font-medium">
                    Habit Name *
                  </Label>
                  <Input
                    id="habitName"
                    placeholder="e.g., Morning walk, Read for 30 minutes"
                    className="mt-2 bg-white/5 border-white/10 text-white/80 placeholder:text-white/40 focus-visible:ring-white/30"
                    value={habitName}
                    onChange={(e) => setHabitName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="habitType" className="text-white/90 text-sm font-medium">
                    Type *
                  </Label>
                  <Select value={habitType} onValueChange={(value: "Build" | "Break") => setHabitType(value)}>
                    <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white/80 focus:ring-white/30">
                      <SelectValue placeholder="Select habit type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      <SelectItem value="Build" className="text-white/80">Build (Create new habit)</SelectItem>
                      <SelectItem value="Break" className="text-white/80">Break (Stop existing habit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {step === "details" && habitType === "Build" && (
            <motion.div key="build-details" className="p-4 pt-8 flex flex-col h-full">
              <DrawerHeader className="flex items-center justify-between p-0 mb-6 flex-none">
                <div className="flex-1">
                  <DrawerTitle className="text-white/90 text-xl font-light">Build Details</DrawerTitle>
                  <DrawerDescription className="text-white/60 text-sm mt-1">
                    Help us understand your new habit better.
                  </DrawerDescription>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !whyMatters}
                  className="ml-6 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white border border-green-500 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Habit"}
                </Button>
              </DrawerHeader>

              <div className="flex-1 flex flex-col space-y-4 px-4 pb-6 overflow-y-auto">
                <div>
                  <Label htmlFor="whyMatters" className="text-white/90 text-sm font-medium">
                    Why this matters *
                  </Label>
                  <Textarea
                    id="whyMatters"
                    placeholder="Connect this habit to your values and goals..."
                    className="mt-2 bg-white/5 border-white/10 text-white/80 placeholder:text-white/40 focus-visible:ring-white/30 resize-none"
                    rows={3}
                    value={whyMatters}
                    onChange={(e) => setWhyMatters(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="frequency" className="text-white/90 text-sm font-medium">
                      Frequency
                    </Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white/80 focus:ring-white/30">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10">
                        {frequencies.map((freq) => (
                          <SelectItem key={freq} value={freq} className="text-white/80">{freq}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timeOfDay" className="text-white/90 text-sm font-medium">
                      Time of Day
                    </Label>
                    <Select value={timeOfDay} onValueChange={setTimeOfDay}>
                      <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white/80 focus:ring-white/30">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10">
                        {timesOfDay.map((time) => (
                          <SelectItem key={time} value={time} className="text-white/80">{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-white/90 text-sm font-medium">
                      Start Date
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      className="mt-2 bg-white/5 border-white/10 text-white/80 focus-visible:ring-white/30"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="streakGoal" className="text-white/90 text-sm font-medium">
                      Streak Goal (days)
                    </Label>
                    <Input
                      id="streakGoal"
                      type="number"
                      placeholder="e.g., 30"
                      className="mt-2 bg-white/5 border-white/10 text-white/80 placeholder:text-white/40 focus-visible:ring-white/30"
                      value={streakGoal}
                      onChange={(e) => setStreakGoal(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "details" && habitType === "Break" && (
            <motion.div key="break-details" className="p-4 pt-8 flex flex-col h-full">
              <DrawerHeader className="flex items-center justify-between p-0 mb-6 flex-none">
                <div className="flex-1">
                  <DrawerTitle className="text-white/90 text-xl font-light">Break Details</DrawerTitle>
                  <DrawerDescription className="text-white/60 text-sm mt-1">
                    Let's understand this habit you want to change.
                  </DrawerDescription>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !whyQuit || !currentFrequency}
                  className="ml-6 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white border border-green-500 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Habit"}
                </Button>
              </DrawerHeader>

              <div className="flex-1 flex flex-col space-y-4 px-4 pb-6 overflow-y-auto">
                <div>
                  <Label htmlFor="whyQuit" className="text-white/90 text-sm font-medium">
                    Why you want to quit *
                  </Label>
                  <Textarea
                    id="whyQuit"
                    placeholder="Connect this change to your values and goals..."
                    className="mt-2 bg-white/5 border-white/10 text-white/80 placeholder:text-white/40 focus-visible:ring-white/30 resize-none"
                    rows={3}
                    value={whyQuit}
                    onChange={(e) => setWhyQuit(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="currentFrequency" className="text-white/90 text-sm font-medium">
                    Current Frequency *
                  </Label>
                  <Select value={currentFrequency} onValueChange={setCurrentFrequency}>
                    <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white/80 focus:ring-white/30">
                      <SelectValue placeholder="How often does this happen?" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {estimatedFrequencies.map((freq) => (
                        <SelectItem key={freq} value={freq} className="text-white/80">{freq}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="triggerPattern" className="text-white/90 text-sm font-medium">
                    Trigger Pattern
                  </Label>
                  <Input
                    id="triggerPattern"
                    placeholder="When does this usually happen?"
                    className="mt-2 bg-white/5 border-white/10 text-white/80 placeholder:text-white/40 focus-visible:ring-white/30"
                    value={triggerPattern}
                    onChange={(e) => setTriggerPattern(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="replacementHabit" className="text-white/90 text-sm font-medium">
                    Replacement Habit
                  </Label>
                  <Input
                    id="replacementHabit"
                    placeholder="What could you do instead?"
                    className="mt-2 bg-white/5 border-white/10 text-white/80 placeholder:text-white/40 focus-visible:ring-white/30"
                    value={replacementHabit}
                    onChange={(e) => setReplacementHabit(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label htmlFor="awarenessNudges" className="text-white/90 text-sm font-medium">
                      Awareness Nudges
                    </Label>
                    <p className="text-white/60 text-xs mt-1">Get reminders when triggers are detected</p>
                  </div>
                  <Switch
                    id="awarenessNudges"
                    checked={awarenessNudges}
                    onCheckedChange={setAwarenessNudges}
                    className="data-[state=checked]:bg-white/20"
                  />
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </DrawerContent>
    </Drawer>
  )
}