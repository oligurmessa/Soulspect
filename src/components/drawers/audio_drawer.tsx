"use client"

// =============================================================================
// AUDIO DRAWER - Voice recording interface
// =============================================================================
// A beautifully designed audio recording drawer with:
// - Real-time recording visualization with animated waveform bars
// - Minimalist timer display
// - Sleek professional controls
// - Smooth animations
// - Modern aesthetic inspired by kokonutui
// =============================================================================

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { SleekDrawer } from "@/components/sleek_drawer"
import { useToast } from "@/hooks/use-toast"
import {
    Mic,
    Square,
    Play,
    Pause,
    Trash2,
    Save,
    Loader2,
    RotateCcw,
    Check
} from "lucide-react"

// =============================================================================
// Types & Constants
// =============================================================================

interface AudioDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    description?: string
    onAudioRecorded?: (audioBlob: Blob, transcript?: string) => void
}

type RecordingState = "idle" | "recording" | "paused" | "stopped"

const ANIMATION = {
    pulse: {
        scale: [1, 1.1, 1],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut" as const,
        },
    },
}

// =============================================================================
// Component
// =============================================================================

export default function AudioDrawer({
    open,
    onOpenChange,
    description = "Record your voice note.",
    onAudioRecorded,
}: AudioDrawerProps) {
    // ---------------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------------
    const [recordingState, setRecordingState] = useState<RecordingState>("idle")
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const { toast } = useToast()

    // ---------------------------------------------------------------------------
    // Effects
    // ---------------------------------------------------------------------------

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current)
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop()
            }
        }
    }, [])

    /**
     * Reset state when drawer closes
     */
    useEffect(() => {
        if (!open) {
            handleReset()
        }
    }, [open])

    // ---------------------------------------------------------------------------
    // Handlers
    // ---------------------------------------------------------------------------

    /**
     * Starts audio recording
     */
    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)

            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
                setAudioBlob(audioBlob)
                setRecordingState("stopped")

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setRecordingState("recording")

            // Start timer
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)

        } catch (error) {
            console.error("Error accessing microphone:", error)
            toast({
                title: "Microphone access denied",
                description: "Please allow microphone access to record audio.",
                variant: "destructive",
            })
        }
    }

    /**
     * Stops recording
     */
    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop()
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current)
            }
        }
    }

    /**
     * Pauses recording
     */
    const handlePauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.pause()
            setRecordingState("paused")
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current)
            }
        }
    }

    /**
     * Resumes recording
     */
    const handleResumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
            mediaRecorderRef.current.resume()
            setRecordingState("recording")
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        }
    }

    /**
     * Saves the recorded audio
     */
    const handleSave = async () => {
        if (!audioBlob) return

        setIsProcessing(true)

        try {
            // Call the callback with the audio blob
            if (onAudioRecorded) {
                onAudioRecorded(audioBlob)
            }

            toast({
                title: "Audio saved!",
                description: "Your voice note has been added.",
            })

            onOpenChange(false)
            handleReset()
        } catch (error) {
            console.error("Error saving audio:", error)
            toast({
                title: "Error",
                description: "Failed to save audio. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsProcessing(false)
        }
    }

    /**
     * Resets recording state
     */
    const handleReset = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current)
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop()
        }

        setRecordingState("idle")
        setRecordingTime(0)
        setAudioBlob(null)
        audioChunksRef.current = []
    }

    /**
     * Deletes current recording
     */
    const handleDelete = () => {
        handleReset()
        toast({
            title: "Recording deleted",
            description: "Your recording has been discarded.",
        })
    }

    // ---------------------------------------------------------------------------
    // Render Helpers
    // ---------------------------------------------------------------------------

    /**
     * Formats time in MM:SS format
     */
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    /**
     * Renders waveform visualization
     */
    const renderWaveform = () => {
        const barCount = 48
        return (
            <div className="h-4 w-64 flex items-center justify-center gap-0.5">
                {[...Array(barCount)].map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-0.5 rounded-full transition-all duration-300",
                            recordingState === "recording"
                                ? "bg-black/50 dark:bg-white/50 animate-pulse"
                                : recordingState === "paused"
                                ? "bg-amber-500/30 dark:bg-amber-400/30"
                                : recordingState === "stopped"
                                ? "bg-green-500/30 dark:bg-green-400/30"
                                : "bg-black/10 dark:bg-white/10 h-1"
                        )}
                        style={
                            recordingState === "recording"
                                ? {
                                      height: `${20 + Math.random() * 80}%`,
                                      animationDelay: `${i * 0.05}s`,
                                      animationDuration: "1.5s",
                                  }
                                : recordingState === "paused"
                                ? {
                                      height: `${20 + (i % 3) * 20}%`,
                                  }
                                : recordingState === "stopped"
                                ? {
                                      height: `${15 + (i % 2) * 10}%`,
                                  }
                                : undefined
                        }
                    />
                ))}
            </div>
        )
    }

    /**
     * Renders recording controls based on state
     */
    const renderControls = () => {
        if (recordingState === "idle") {
            return (
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={handleStartRecording}
                        className={cn(
                            "group w-16 h-16 rounded-xl flex items-center justify-center transition-all",
                            "hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                        type="button"
                        aria-label="Start recording"
                    >
                        <Mic className="w-6 h-6 text-black/90 dark:text-white/90" />
                    </button>

                    <span className="font-mono text-sm text-black/30 dark:text-white/30">
                        00:00
                    </span>

                    {renderWaveform()}

                    <p className="h-4 text-xs text-black/70 dark:text-white/70">
                        Click to speak
                    </p>
                </div>
            )
        }

        if (recordingState === "recording" || recordingState === "paused") {
            return (
                <div className="flex flex-col items-center gap-2">
                    {/* Main recording button with animated square when recording */}
                    <button
                        onClick={recordingState === "recording" ? handlePauseRecording : handleResumeRecording}
                        className={cn(
                            "group w-16 h-16 rounded-xl flex items-center justify-center transition-all",
                            recordingState === "recording" 
                                ? "bg-none" 
                                : "bg-amber-500/10 dark:bg-amber-400/10"
                        )}
                        type="button"
                        aria-label={recordingState === "recording" ? "Pause recording" : "Resume recording"}
                    >
                        {recordingState === "recording" ? (
                            <div
                                className="w-6 h-6 rounded-sm animate-spin bg-black dark:bg-white"
                                style={{ animationDuration: "3s" }}
                            />
                        ) : (
                            <Play className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        )}
                    </button>

                    {/* Timer */}
                    <span className={cn(
                        "font-mono text-sm transition-opacity duration-300",
                        recordingState === "recording"
                            ? "text-black/70 dark:text-white/70"
                            : "text-amber-600/70 dark:text-amber-400/70"
                    )}>
                        {formatTime(recordingTime)}
                    </span>

                    {/* Waveform */}
                    {renderWaveform()}

                    {/* Status text and controls */}
                    <div className="flex flex-col items-center gap-3">
                        <p className="h-4 text-xs text-black/70 dark:text-white/70">
                            {recordingState === "recording" ? "Listening..." : "Paused"}
                        </p>

                        {/* Control buttons row */}
                        <div className="flex items-center gap-2">
                            {/* Stop button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStopRecording}
                                className={cn(
                                    "p-2.5 rounded-lg",
                                    "bg-black/5 dark:bg-white/5",
                                    "hover:bg-black/10 dark:hover:bg-white/10",
                                    "text-black/70 dark:text-white/70",
                                    "transition-all duration-200"
                                )}
                                aria-label="Stop recording"
                            >
                                <Square className="w-4 h-4" strokeWidth={2} fill="currentColor" />
                            </motion.button>

                            {/* Reset button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleReset}
                                className={cn(
                                    "p-2.5 rounded-lg",
                                    "bg-black/5 dark:bg-white/5",
                                    "hover:bg-black/10 dark:hover:bg-white/10",
                                    "text-black/70 dark:text-white/70",
                                    "transition-all duration-200"
                                )}
                                aria-label="Reset recording"
                            >
                                <RotateCcw className="w-4 h-4" strokeWidth={2} />
                            </motion.button>
                        </div>
                    </div>
                </div>
            )
        }

        if (recordingState === "stopped" && audioBlob) {
            return (
                <div className="flex flex-col items-center gap-2">
                    {/* Completed indicator */}
                    <button
                        className="group w-16 h-16 rounded-xl flex items-center justify-center bg-green-500/10 dark:bg-green-400/10"
                        type="button"
                        disabled
                    >
                        <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </button>

                    {/* Final time */}
                    <span className="font-mono text-sm text-green-600/70 dark:text-green-400/70">
                        {formatTime(recordingTime)}
                    </span>

                    {/* Waveform (static) */}
                    {renderWaveform()}

                    <p className="h-4 text-xs text-black/70 dark:text-white/70 mb-2">
                        Recording complete
                    </p>

                    {/* Audio player */}
                    <div className={cn(
                        "w-full max-w-xs p-3 rounded-xl mb-3",
                        "bg-black/5 dark:bg-white/5",
                        "border border-black/10 dark:border-white/10"
                    )}>
                        <audio
                            src={URL.createObjectURL(audioBlob)}
                            controls
                            className="w-full h-8 [&::-webkit-media-controls-panel]:bg-transparent"
                            style={{ filter: "invert(0.9)" }}
                        />
                    </div>

                    {/* Action buttons - sleek minimal style */}
                    <div className="flex items-center gap-2">
                        {/* Delete button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDelete}
                            className={cn(
                                "p-2.5 rounded-lg",
                                "bg-black/5 dark:bg-white/5",
                                "hover:bg-red-50 dark:hover:bg-red-950/20",
                                "text-black/70 dark:text-white/70",
                                "hover:text-red-600 dark:hover:text-red-400",
                                "transition-all duration-200"
                            )}
                            aria-label="Delete recording"
                        >
                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </motion.button>

                        {/* Re-record button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleReset}
                            className={cn(
                                "p-2.5 rounded-lg",
                                "bg-black/5 dark:bg-white/5",
                                "hover:bg-black/10 dark:hover:bg-white/10",
                                "text-black/70 dark:text-white/70",
                                "transition-all duration-200"
                            )}
                            aria-label="Re-record"
                        >
                            <RotateCcw className="w-4 h-4" strokeWidth={2} />
                        </motion.button>

                        {/* Save button - prominent */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSave}
                            disabled={isProcessing}
                            className={cn(
                                "px-4 py-2.5 rounded-lg flex items-center gap-2",
                                "font-medium text-sm",
                                "transition-all duration-200",
                                isProcessing
                                    ? "bg-black/20 dark:bg-white/20 text-black/40 dark:text-white/40 cursor-not-allowed"
                                    : [
                                        "bg-black dark:bg-white",
                                        "text-white dark:text-black",
                                        "hover:bg-black/90 dark:hover:bg-white/90",
                                    ]
                            )}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Save</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>
            )
        }

        return null
    }

    // ---------------------------------------------------------------------------
    // Main Render
    // ---------------------------------------------------------------------------

    return (
        <SleekDrawer
            open={open}
            onOpenChange={onOpenChange}
            currentStep={1}
            totalSteps={1}
            showNavigation={false} // Hide navigation arrows since it's a single screen
        >
            <div className="flex flex-col h-full w-full py-4">
                {/* Minimalist header */}
                <div className="text-center mb-6">
                    <h2 className="text-base font-medium text-black/90 dark:text-white/90">
                        Voice Note
                    </h2>
                    <p className="text-xs text-black/50 dark:text-white/50 mt-1">
                        {description}
                    </p>
                </div>

                {/* Main content area */}
                <div className="flex-1 flex flex-col items-center justify-center w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={recordingState}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="w-full max-w-sm flex flex-col items-center"
                        >
                            {renderControls()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </SleekDrawer>
    )
}