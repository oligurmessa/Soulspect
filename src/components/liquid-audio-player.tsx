"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Play, Pause, Undo, Redo, Captions, Trash2 } from "lucide-react"
import { LiquidGlassCard, CardHeader, CardContent } from "./kokonutui/liquid-glass-card"

interface LiquidAudioPlayerProps {
  audioUrl?: string
  title?: string
  onTitleChange?: (title: string) => void
  onDelete?: () => void
  className?: string
  createdAt?: Date
}

export function LiquidAudioPlayer({
  audioUrl,
  title = "Untitled",
  onTitleChange,
  onDelete,
  className,
  createdAt
}: LiquidAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [localTitle, setLocalTitle] = useState(title)
  const [isReady, setIsReady] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)

  // Simple audio setup
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    // Reset states
    setIsReady(false)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)

    // Simple event handlers
    const handleCanPlay = () => {
      setIsReady(true)
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    // Add listeners
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    // Set source
    audio.src = audioUrl

    // Cleanup
    return () => {
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [audioUrl])

  // Format time in MM:SS
  const formatTime = (timeInSeconds: number) => {
    if (!isFinite(timeInSeconds) || timeInSeconds < 0) return "0:00"
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Handle play/pause
  const handlePlayPause = () => {
    const audio = audioRef.current
    if (!audio || !isReady) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(error => {
        console.error('Playback failed:', error)
      })
    }
  }

  // Handle seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !isReady || duration === 0) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    audio.currentTime = percent * duration
  }

  // Handle skip
  const handleSkip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio || !isReady) return
    
    const newTime = Math.max(0, Math.min(duration, audio.currentTime + seconds))
    audio.currentTime = newTime
  }

  // Handle title change
  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle)
    onTitleChange?.(newTitle)
  }

  const dateString = createdAt ? `Created: ${createdAt.toLocaleDateString()}` : `Created: ${new Date().toLocaleDateString()}`

  return (
    <div className={`w-[500px] ${className}`}>
      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        preload="metadata"
      />
      
      <LiquidGlassCard
        variant="primary"
        className="relative z-30 backdrop-blur-md bg-background/50 p-3"
        glassEffect={false}
        size="custom"
      >
        <div className="flex items-start gap-1">
          <div className="flex-1">
            <CardHeader
              title={localTitle}
              onTitleChange={handleTitleChange}
              isEditable={true}
              date={dateString}
              className="space-y-0.5"
            />
          </div>
        </div>

        <CardContent className="pt-2">
          {/* Progress Bar */}
          <div className="space-y-1">
            <div
              className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/50 dark:bg-zinc-800/50 cursor-pointer"
              onClick={handleSeek}
              role="slider"
              aria-label={`Seek to ${formatTime(currentTime)} of ${formatTime(duration)}`}
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-300/20 via-zinc-300/30 to-zinc-300/20 dark:from-white/5 dark:via-white/10 dark:to-white/5" />

              {/* Progress indicator */}
              <div
                className="absolute inset-y-0 left-0 bg-zinc-500 transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                {formatTime(currentTime)}
              </span>
              <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </CardContent>

        {/* Controls */}
        <div className="flex justify-between items-center px-3 pb-2 pt-1">
          {/* Left: Captions button */}
          <button
            className="p-2 rounded-full transition-colors text-zinc-600 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="View captions"
          >
            <Captions className="size-5" />
          </button>

          {/* Center: Main playback controls */}
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-full bg-zinc-100/50 dark:bg-zinc-800/50 transition-colors text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
              aria-label="Rewind 15 seconds"
              onClick={() => handleSkip(-15)}
              disabled={!isReady}
            >
              <Undo className="size-5" />
            </button>
            
            <button
              className="p-3 transition-colors text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 rounded-lg"
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={handlePlayPause}
              disabled={!isReady}
            >
              {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
            </button>
            
            <button
              className="p-2 rounded-full bg-zinc-100/50 dark:bg-zinc-800/50 transition-colors text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
              aria-label="Forward 15 seconds"
              onClick={() => handleSkip(15)}
              disabled={!isReady}
            >
              <Redo className="size-5" />
            </button>
          </div>

          {/* Right: Delete button */}
          <button
            className="p-2 rounded-full transition-colors text-red-500/70 hover:text-red-500 hover:bg-red-500/10"
            aria-label="Delete recording"
            onClick={onDelete}
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      </LiquidGlassCard>
    </div>
  )
}