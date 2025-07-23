"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Mic, Pause, Square } from "lucide-react";
import { toast } from "sonner"; // Assuming you're using shadcn's toast

// Utility to check if DOM is available
const CAN_USE_DOM: boolean = typeof window !== "undefined" && 
  typeof window.document !== "undefined" && 
  typeof window.document.createElement !== "undefined";

// Speech Recognition Support Check
const SUPPORT_SPEECH_RECOGNITION: boolean =
  CAN_USE_DOM &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

interface AIVoiceTranscriptionProps {
  onTranscriptComplete?: (transcript: string) => void;
  className?: string;
  loadingTexts?: string[];
  loadingInterval?: number;
}

export default function AIVoiceTranscription({
  onTranscriptComplete,
  className,
  loadingTexts = [
    "Listening...",
    "I hear you...",
    "Keep going...",
    "Words flowing...",
    "Almost there...",
  ],
  loadingInterval = 4500,
}: AIVoiceTranscriptionProps) {
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  
  // Transcription states
  const [liveTranscript, setLiveTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [editableTranscript, setEditableTranscript] = useState("");
  
  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  
  // Animation states
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  
  // Speech recognition ref
  const recognition = useRef<any>(null);

  // Get Speech Recognition API
  const SpeechRecognition = 
    CAN_USE_DOM ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Timer for recording duration
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRecording && !isPaused) {
      intervalId = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isRecording, isPaused]);

  // Loading text animation
  useEffect(() => {
    if (!isRecording || isPaused) return;

    const timer = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % loadingTexts.length);
    }, loadingInterval);

    return () => clearInterval(timer);
  }, [isRecording, isPaused, loadingInterval, loadingTexts.length]);

  // Speech recognition setup
  useEffect(() => {
    if (!SUPPORT_SPEECH_RECOGNITION) return;

    if (isRecording && !isPaused && !recognition.current && SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            finalText += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Update live transcript for real-time display
        setLiveTranscript(interimTranscript);

        // Update final transcript
        if (finalText) {
          setFinalTranscript(prev => prev + finalText);
          setEditableTranscript(prev => prev + finalText);
        }
      };

      recognition.current.onend = () => {
        if (isRecording && !isPaused) {
          // Restart if still recording (for continuous listening)
          recognition.current?.start();
        }
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      recognition.current.start();
    }

    if ((!isRecording || isPaused) && recognition.current) {
      recognition.current.stop();
      recognition.current = null;
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
        recognition.current = null;
      }
    };
  }, [isRecording, isPaused, SpeechRecognition]);

  // Handle transcript completion when stopping
  useEffect(() => {
    if (!isRecording && !isPaused && finalTranscript && !showDialog) {
      setShowDialog(true);
    }
  }, [isRecording, isPaused, finalTranscript, showDialog]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRecording = () => {
    if (!SUPPORT_SPEECH_RECOGNITION) {
      alert("Speech recognition is not supported in your browser");
      return;
    }

    setIsRecording(true);
    setIsPaused(false);
    setLiveTranscript("");
    setFinalTranscript("");
    setEditableTranscript("");
    setCurrentTextIndex(0);
    setShowDialog(false);
  };

  const handlePauseRecording = () => {
    setIsPaused(true);
  };

  const handleResumeRecording = () => {
    setIsPaused(false);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
  };

  const handleSave = () => {
    // Save the recording (implement your save logic here)
    if (onTranscriptComplete) {
      onTranscriptComplete(editableTranscript);
    }
    
    // Clear states
    setFinalTranscript("");
    setEditableTranscript("");
    setShowDialog(false);
    setTime(0);
    
    // Show success toast
    toast.success("Recording saved successfully!", {
      action: {
        label: "Open",
        onClick: () => {
          // Implement open functionality
          console.log("Open recording");
        },
      },
    });
  };

  const handleCancel = () => {
    // Clear states and stop recording
    setIsRecording(false);
    setIsPaused(false);
    setFinalTranscript("");
    setEditableTranscript("");
    setShowDialog(false);
    setTime(0);
    setLiveTranscript("");
  };

  if (!SUPPORT_SPEECH_RECOGNITION) {
    return (
      <div className={cn("w-full py-4", className)}>
        <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 text-sm text-center">
              Speech recognition is not supported in your browser
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-4">
        {/* Control Buttons */}
        <div className="flex items-center gap-4">
          {/* Microphone/Record Button */}
          <button
            className={cn(
              "group w-16 h-16 rounded-xl flex items-center justify-center transition-colors",
              isRecording && !isPaused
                ? "bg-none"
                : "bg-none hover:bg-black/5 dark:hover:bg-white/5"
            )}
            type="button"
            onClick={!isRecording ? handleStartRecording : handleStopRecording}
          >
            {isRecording && !isPaused ? (
              <div
                className="w-6 h-6 rounded-sm animate-spin bg-red-500 cursor-pointer pointer-events-auto"
                style={{ animationDuration: "3s" }}
              />
            ) : (
              <Mic className="w-6 h-6 text-black/90 dark:text-white/90" />
            )}
          </button>

          {/* Pause Button - only show when recording */}
          {isRecording && (
            <button
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              type="button"
              onClick={isPaused ? handleResumeRecording : handlePauseRecording}
            >
              <Pause className={cn(
                "w-5 h-5",
                isPaused ? "text-green-500" : "text-black/90 dark:text-white/90"
              )} />
            </button>
          )}

          {/* Stop Button - only show when recording */}
          {isRecording && (
            <button
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              type="button"
              onClick={handleStopRecording}
            >
              <Square className="w-5 h-5 text-black/90 dark:text-white/90" />
            </button>
          )}
        </div>

        {/* Timer */}
        <span
          className={cn(
            "font-mono text-sm transition-opacity duration-300",
            isRecording
              ? isPaused 
                ? "text-yellow-500 dark:text-yellow-400"
                : "text-black/70 dark:text-white/70"
              : "text-black/30 dark:text-white/30"
          )}
        >
          {formatTime(time)} {isPaused && "(Paused)"}
        </span>

        {/* Audio Visualizer */}
        <div className="h-4 w-64 flex items-center justify-center gap-0.5">
          {[...Array(48)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-0.5 rounded-full transition-all duration-300",
                isRecording && !isPaused
                  ? "bg-red-500/50 animate-pulse"
                  : isPaused
                  ? "bg-yellow-500/30"
                  : "bg-black/10 dark:bg-white/10 h-1"
              )}
              style={
                isRecording && !isPaused && isClient
                  ? {
                      height: `${20 + Math.random() * 80}%`,
                      animationDelay: `${i * 0.05}s`,
                    }
                  : undefined
              }
            />
          ))}
        </div>

        {/* Status Text */}
        <p className="h-4 text-xs text-black/70 dark:text-white/70">
          {isRecording 
            ? isPaused 
              ? "Recording paused - click pause to resume"
              : "Recording..." 
            : "Click to start recording"
          }
        </p>

        {/* Live Transcription Display with Animation */}
        {isRecording && !isPaused && (
          <div className="flex items-center justify-center p-4 w-full">
            <motion.div
              className="relative px-4 py-2 w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={liveTranscript || currentTextIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    backgroundPosition: ["200% center", "-200% center"],
                  }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    opacity: { duration: 0.3 },
                    y: { duration: 0.3 },
                    backgroundPosition: {
                      duration: 2.5,
                      ease: "linear",
                      repeat: Infinity,
                    },
                  }}
                  className="flex justify-center text-lg font-medium bg-gradient-to-r from-neutral-950 via-neutral-400 to-neutral-950 dark:from-white dark:via-neutral-600 dark:to-white bg-[length:200%_100%] bg-clip-text text-transparent whitespace-nowrap min-w-max min-h-[1.5rem] border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-2 bg-white/50 dark:bg-black/50 backdrop-blur-sm"
                >
                  {liveTranscript || loadingTexts[currentTextIndex]}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        )}

        {/* Editable Transcript Dialog */}
        {showDialog && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <div className="w-full max-w-2xl mx-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-xl">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                  Edit Your Recording
                </h3>
                <textarea
                  value={editableTranscript}
                  onChange={(e) => setEditableTranscript(e.target.value)}
                  className="w-full h-40 p-4 border border-neutral-300 dark:border-neutral-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  placeholder="Your transcribed text will appear here..."
                />
                <div className="flex gap-3 mt-6 justify-end">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}