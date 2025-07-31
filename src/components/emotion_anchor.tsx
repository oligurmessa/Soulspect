"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import SmoothDrawer from "@/components/smooth_drawer";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import EmotionVisualizer from "@/components/EmotionsVisualizer";
import Selector from "./EmotionSelector";
import { useAuth } from "@/context/AuthContext";
import { addEmotionLog } from "@/lib/dbHelpers";

interface EmotionAnchorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmotionLogged?: (emotion: string, intensity: number, note?: string, emotions?: string[], triggers?: string[]) => void;
}

export function EmotionAnchor({ open, onOpenChange, onEmotionLogged }: EmotionAnchorProps) {
  const [step, setStep] = useState<"visualize" | "emotions" | "triggers">("visualize");
  const [mood, setMood] = useState(3); // 0-6 scale from EmotionVisualizer
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const resetForm = () => {
    setMood(3);
    setSelectedEmotions([]);
    setSelectedTriggers([]);
    setStep("visualize");
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save an emotion log.",
        variant: "destructive",
      });
      return;
    }

    if (selectedEmotions.length === 0) {
      toast({
        title: "Please select emotions",
        description: "You need to select at least one emotion to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const logData: any = {
        mood,
        emotions: selectedEmotions,
        intensity: Math.round(((mood + 1) / 7) * 10), // Convert 0-6 to 1-10 scale
      };
      
      // Only add triggers if there are any selected
      if (selectedTriggers.length > 0) {
        logData.triggers = selectedTriggers;
      }
      
      await addEmotionLog(user.uid, logData);

      toast({
        title: "Success!",
        description: "Your emotion log has been saved.",
      });

      // Call the callback to add to carousel
      if (onEmotionLogged && selectedEmotions.length > 0) {
        const primaryEmotion = selectedEmotions[0]; // Use the first selected emotion
        const intensity = Math.round(((mood + 1) / 7) * 10); // Convert 0-6 to 1-10 scale
        onEmotionLogged(primaryEmotion, intensity, undefined, selectedEmotions, selectedTriggers);
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving emotion log:", error);
      toast({
        title: "Error",
        description: "Failed to save your emotion log. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueFromVisualize = () => {
    setStep("emotions");
  };

  const handleContinueFromEmotions = () => {
    if (selectedEmotions.length === 0) {
      toast({
        title: "Please select emotions",
        description: "You need to select at least one emotion to continue.",
        variant: "destructive",
      });
      return;
    }
    setStep("triggers");
  };

  const handleBack = () => {
    if (step === "emotions") {
      setStep("visualize");
    } else if (step === "triggers") {
      setStep("emotions");
    }
  };

  return (
    <SmoothDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={
        step === "visualize" ? "Emotion Log" :
        step === "emotions" ? "What are you feeling?" :
        "What triggered this?"
      }
      description={
        step === "visualize" ? "How are you feeling right now?" :
        step === "emotions" ? "Select all emotions that apply." :
        "Select any triggers that apply."
      }
      showBackButton={step !== "visualize"}
      onBackClick={handleBack}
      actionButton={
        <Button
          onClick={
            step === "visualize" ? handleContinueFromVisualize :
            step === "emotions" ? handleContinueFromEmotions :
            handleSubmit
          }
          disabled={isSubmitting}
          className="h-10 px-4 rounded-lg"
        >
          {step === "triggers" ? (isSubmitting ? "Saving..." : "Save") : "Continue"}
        </Button>
      }
      className="h-full"
    >
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className={step === "visualize" ? "h-full" : "space-y-3"}
      >
        {step === "visualize" && (
          <div className="flex flex-col h-full">
            <div className="flex-1"></div>
            <div className="flex flex-col items-center pb-2 w-full">
              <div className="w-full max-w-xl h-64">
                <EmotionVisualizer
                  onMoodChange={setMood}
                />
              </div>
            </div>
          </div>
        )}

        {step === "emotions" && (
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            <Selector
              variant="emotion"
              onChange={setSelectedEmotions}
            />
          </div>
        )}

        {step === "triggers" && (
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            <Selector
              variant="trigger"
              onChange={setSelectedTriggers}
            />
          </div>
        )}
      </motion.div>
    </SmoothDrawer>
  );
}