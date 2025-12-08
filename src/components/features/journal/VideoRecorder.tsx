"use client"

// =============================================================================
// VIDEO RECORDER - Professional video journaling interface
// =============================================================================
// A beautifully designed video recording component with:
// - Clean, minimal controls that appear contextually
// - Smooth animations and transitions
// - Professional recording states (idle, recording, paused, preview)
// - Responsive design that works on all devices
// - Glass-morphism aesthetic matching the app
// =============================================================================

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Video, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Camera,
  AlertCircle,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// Types
// =============================================================================

interface VideoRecorderProps {
  onRecordingComplete: (videoBlob: Blob, duration: number) => void
  onDone?: () => void
}

type RecordingState = "idle" | "requesting" | "recording" | "paused" | "preview"

// =============================================================================
// Constants
// =============================================================================

const ANIMATION = {
  smooth: { duration: 0.2, ease: "easeInOut" as const },
  bounce: { type: "spring" as const, bounce: 0.3, duration: 0.6 },
}

// =============================================================================
// Component
// =============================================================================

export function VideoRecorder({ 
  onRecordingComplete, 
  onDone = () => {}
}: VideoRecorderProps) {
  
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [state, setState] = useState<RecordingState>("idle")
  const [recordingTime, setRecordingTime] = useState(0)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // ---------------------------------------------------------------------------
  // Cleanup Effect
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // ---------------------------------------------------------------------------
  // Auto-request permission when component mounts
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (hasPermission === null) {
      requestPermission()
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Permission Request
  // ---------------------------------------------------------------------------
  const requestPermission = async () => {
    setState("requesting")
    setError(null)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        }, 
        audio: true 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      streamRef.current = stream
      setHasPermission(true)
      setState("idle")
      return true
    } catch (err) {
      console.error('Error accessing camera/microphone:', err)
      setHasPermission(false)
      setError('Unable to access camera and microphone. Please check your permissions.')
      setState("idle")
      return false
    }
  }

  // ---------------------------------------------------------------------------
  // Recording Controls
  // ---------------------------------------------------------------------------
  const startRecording = async () => {
    if (hasPermission === null) {
      const granted = await requestPermission()
      if (!granted) return
    }

    if (!streamRef.current) {
      await requestPermission()
    }

    try {
      if (!streamRef.current) return
      
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })
      
      videoChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' })
        onRecordingComplete(videoBlob, recordingTime)
        
        const url = URL.createObjectURL(videoBlob)
        setPreviewUrl(url)
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
        
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
        
        setState("preview")
      }
      
      mediaRecorderRef.current.start(100)
      setState("recording")
      setRecordingTime(0)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Failed to start recording. Please try again.')
    }
  }

  const pauseRecording = () => {
    if (!mediaRecorderRef.current) return

    if (state === "paused") {
      mediaRecorderRef.current.resume()
      setState("recording")
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      mediaRecorderRef.current.pause()
      setState("paused")
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && (state === "recording" || state === "paused")) {
      mediaRecorderRef.current.stop()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const retakeVideo = async () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setRecordingTime(0)
    setState("idle")
    await requestPermission()
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ---------------------------------------------------------------------------
  // Permission Denied State
  // ---------------------------------------------------------------------------
  if (hasPermission === false) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            Camera Access Denied
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {error || "Please allow camera and microphone access to record video."}
          </p>
          <button
            onClick={requestPermission}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5",
              "bg-neutral-900 dark:bg-neutral-100",
              "text-white dark:text-neutral-900",
              "text-sm font-medium rounded-lg",
              "hover:bg-neutral-800 dark:hover:bg-neutral-200",
              "transition-colors duration-200"
            )}
          >
            <Camera className="w-4 h-4" />
            Try Again
          </button>
        </motion.div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full">
      {/* ===================================================================
          VIDEO PREVIEW AREA - Main recording interface
          =================================================================== */}
      <div className="flex-1 relative bg-zinc-950 flex items-center justify-center overflow-hidden min-h-0">
        {/* Video Element */}
        <div className="relative w-full h-full flex items-center justify-center">
          {previewUrl ? (
            <video
              src={previewUrl}
              controls
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="max-w-full max-h-full object-contain mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
          )}

          {/* Camera Loading State */}
          {state === "requesting" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-zinc-950 flex items-center justify-center"
            >
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-neutral-400 animate-spin mx-auto mb-4" />
                <p className="text-sm text-neutral-400">Accessing camera...</p>
              </div>
            </motion.div>
          )}

          {/* Prompt to start - Only show when idle and no stream yet */}
          {state === "idle" && !streamRef.current && hasPermission === null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
            >
              <div className="w-20 h-20 mb-6 rounded-full bg-zinc-800 flex items-center justify-center">
                <Video className="w-10 h-10 text-neutral-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-100 mb-2">
                Ready to Record
              </h3>
              <p className="text-neutral-400 mb-6 max-w-sm">
                Click the record button below to start your video journal entry
              </p>
            </motion.div>
          )}

          {/* Recording Indicator */}
          <AnimatePresence>
            {state === "recording" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-4 left-4 sm:top-6 sm:left-6"
              >
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-red-500/90 backdrop-blur-sm shadow-lg">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2.5 h-2.5 rounded-full bg-white"
                  />
                  <span className="text-sm font-semibold text-white">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Paused Indicator */}
          <AnimatePresence>
            {state === "paused" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-4 left-4 sm:top-6 sm:left-6"
              >
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-amber-500/90 backdrop-blur-sm shadow-lg">
                  <Pause className="w-3.5 h-3.5 text-white" fill="white" />
                  <span className="text-sm font-semibold text-white">
                    Paused · {formatTime(recordingTime)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording Controls Overlay */}
          <AnimatePresence>
            {(state === "recording" || state === "paused") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6 z-10"
              >
                <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-xl">
                  {/* Pause/Resume Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={pauseRecording}
                    className={cn(
                      "p-3 rounded-xl transition-colors duration-200",
                      "hover:bg-white/20 dark:hover:bg-zinc-800/50"
                    )}
                    title={state === "paused" ? "Resume" : "Pause"}
                  >
                    {state === "paused" ? (
                      <Play className="w-5 h-5 text-white" fill="white" />
                    ) : (
                      <Pause className="w-5 h-5 text-white" />
                    )}
                  </motion.button>

                  {/* Stop Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopRecording}
                    className={cn(
                      "p-3 rounded-xl transition-colors duration-200",
                      "bg-red-500 hover:bg-red-600"
                    )}
                    title="Stop Recording"
                  >
                    <Square className="w-5 h-5 text-white" fill="white" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview Controls */}
          <AnimatePresence>
            {state === "preview" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6 z-10"
              >
                <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-white/10 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-xl">
                  {/* Retake Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={retakeVideo}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg",
                      "bg-white/10 hover:bg-white/20",
                      "text-white text-sm font-medium",
                      "transition-colors duration-200"
                    )}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake</span>
                  </motion.button>

                  {/* Done Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onDone}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg",
                      "bg-emerald-500 hover:bg-emerald-600",
                      "text-white text-sm font-medium",
                      "transition-colors duration-200"
                    )}
                  >
                    <Check className="w-4 h-4" />
                    <span>Done</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Record Button - Centered at bottom */}
        <AnimatePresence>
          {state === "idle" && streamRef.current && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={ANIMATION.bounce}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                className={cn(
                  "relative w-20 h-20 rounded-full",
                  "bg-red-500 hover:bg-red-600",
                  "shadow-xl shadow-red-500/50",
                  "transition-all duration-200",
                  "before:absolute before:inset-0 before:rounded-full",
                  "before:border-4 before:border-white/30",
                  "after:absolute after:inset-2 after:rounded-full",
                  "after:bg-white/20"
                )}
                title="Start Recording"
              >
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <Video className="w-8 h-8 text-white" />
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}