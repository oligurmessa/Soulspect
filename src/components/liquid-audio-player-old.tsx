"use client"

import * as React from "react"
import { useCallback, useState, useRef, useEffect } from "react"
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
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)

  // Initialize audio element with proper loading
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) {
      console.log('No audio element or URL provided')
      setIsLoading(false)
      return
    }

    console.log('Setting up audio for item list player:', audioUrl)
    
    // Check if this is a Firebase Storage URL or a blob URL
    const isFirebaseUrl = audioUrl.includes('firebasestorage.googleapis.com')
    const isBlobUrl = audioUrl.startsWith('blob:')
    
    if (!isFirebaseUrl && !isBlobUrl && audioUrl !== '') {
      console.warn('Unexpected audio URL format:', audioUrl)
    }
    
    setIsLoading(true)
    setHasError(false) // Reset error state
    
    // For Firebase URLs, try with credentials and proper headers
    if (isFirebaseUrl) {
      audio.crossOrigin = 'use-credentials'
    }
    
    audio.src = audioUrl

    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        console.log('Duration found in item list:', audio.duration)
        setDuration(audio.duration)
        setIsLoading(false)
      }
    }

    const handleLoadStart = () => {
      setIsLoading(true)
    }

    const handleLoadedMetadata = () => {
      console.log('Loaded metadata in item list, duration:', audio.duration)
      updateDuration()
    }

    const handleLoadedData = () => {
      console.log('Loaded data in item list, duration:', audio.duration)
      updateDuration()
    }

    const handleCanPlay = () => {
      console.log('Can play in item list, duration:', audio.duration)
      updateDuration()
    }

    const handleCanPlayThrough = () => {
      console.log('Can play through in item list, duration:', audio.duration)
      updateDuration()
    }

    const handleDurationChange = () => {
      console.log('Duration changed in item list:', audio.duration)
      updateDuration()
    }

    const handleTimeUpdate = () => {
      if (isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime)
      }
      // Sometimes duration is only available during playback
      if (duration === 0 || !isFinite(duration)) {
        updateDuration()
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      audio.currentTime = 0
    }

    const handleError = (e: Event) => {
      console.error('Audio loading error for URL:', audioUrl, e)
      setIsLoading(false)
      setDuration(0)
      setHasError(true)
      
      // For Firebase URLs that fail to load, we might want to show a message
      if (isFirebaseUrl) {
        console.warn('Firebase Storage URL failed to load. This might be due to authentication or CORS issues.')
      }
    }

    // Add all event listeners
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('canplaythrough', handleCanPlayThrough)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    // Force load the audio
    audio.load()

    // Fallback: try to get duration periodically
    const durationCheckInterval = setInterval(() => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        console.log('Duration found via interval in item list:', audio.duration)
        setDuration(audio.duration)
        setIsLoading(false)
        clearInterval(durationCheckInterval)
      }
    }, 100)

    // WebM duration workaround: try to seek to the end briefly
    const webmDurationFix = () => {
      if ((duration === 0 || !isFinite(duration)) && audio.readyState >= 2) {
        console.log('Trying WebM duration fix in item list')
        const originalTime = audio.currentTime
        audio.currentTime = 999999 // Try to seek to end
        setTimeout(() => {
          if (audio.duration && isFinite(audio.duration)) {
            console.log('WebM fix worked in item list:', audio.duration)
            setDuration(audio.duration)
            setIsLoading(false)
            audio.currentTime = originalTime
          }
        }, 50)
      }
    }

    // Try WebM fix after a short delay
    setTimeout(webmDurationFix, 500)

    // Clear interval after 5 seconds max
    const loadingTimeout = setTimeout(() => {
      clearInterval(durationCheckInterval)
      if (duration === 0 || isLoading) {
        console.log('Duration detection timeout in item list for URL:', audioUrl)
        setIsLoading(false)
        setHasError(true)
        
        // If this is a Firebase URL that's taking too long, it's likely inaccessible
        if (isFirebaseUrl) {
          console.warn('Firebase Storage URL timed out. Audio may not be accessible.')
        }
      }
    }, 5000)

    return () => {
      clearInterval(durationCheckInterval)
      clearTimeout(loadingTimeout)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('canplaythrough', handleCanPlayThrough)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [audioUrl, duration])

  // Format time in MM:SS
  const formatTime = useCallback((timeInSeconds: number) => {
    if (!isFinite(timeInSeconds) || isNaN(timeInSeconds) || timeInSeconds < 0) {
      return "0:00"
    }
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  // Calculate progress percentage
  const progress = duration > 0 && isFinite(currentTime) ? (currentTime / duration) * 100 : 0

  // Handle play/pause
  const handlePlayPause = async () => {
    const audio = audioRef.current
    if (!audio || isLoading || hasError) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        await audio.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsPlaying(false)
      setHasError(true)
    }
  }

  // Handle seek - click on progress bar
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || duration === 0 || !isFinite(duration) || isLoading || hasError) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    const newTime = percent * duration

    if (isFinite(newTime)) {
      audio.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  // Handle rewind 15 seconds
  const handleRewind = () => {
    const audio = audioRef.current
    if (!audio || isLoading) return
    
    const newTime = Math.max(0, currentTime - 15)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Handle forward 15 seconds
  const handleForward = () => {
    const audio = audioRef.current
    if (!audio || isLoading) return
    
    const newTime = Math.min(duration, currentTime + 15)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Handle title change
  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle)
    if (onTitleChange) {
      onTitleChange(newTitle)
    }
  }

  // Placeholder for captions
  const handleCaptionsClick = () => {
    console.log("Captions button clicked!")
    // Implement captions logic here
  }

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete()
    }
  }

  const dateString = createdAt ? `Created: ${createdAt.toLocaleDateString()}` : `Created: ${new Date().toLocaleDateString()}`

  return (
    <div className={`w-[500px] ${className}`}>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />
      
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
                {isLoading ? "Loading..." : hasError ? "Error" : formatTime(duration)}
              </span>
            </div>
          </div>
        </CardContent>

        {/* Combined Controls Section - Main controls + Footer controls */}
        <div className="flex justify-between items-center px-3 pb-2 pt-1">
          {/* Left: Captions button */}
          <button
            className="p-2 rounded-full transition-colors text-zinc-600 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="View captions"
            onClick={handleCaptionsClick}
          >
            <Captions className="size-5" />
          </button>

          {/* Center: Main playback controls */}
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-full bg-zinc-100/50 dark:bg-zinc-800/50 transition-colors text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
              aria-label="Rewind 15 seconds"
              onClick={handleRewind}
              disabled={isLoading || hasError}
            >
              <Undo className="size-5" />
            </button>
            
            <button
              className={`p-3 transition-colors rounded-lg ${
                hasError 
                  ? "text-red-500 cursor-not-allowed" 
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
              }`}
              aria-label={hasError ? "Audio Error" : isPlaying ? "Pause" : "Play"}
              onClick={handlePlayPause}
              disabled={isLoading || duration === 0 || hasError}
              title={hasError ? "Audio file cannot be loaded" : undefined}
            >
              {hasError ? (
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5C3.312 18.333 4.274 20 5.814 20z" />
                </svg>
              ) : isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
            </button>
            
            <button
              className="p-2 rounded-full bg-zinc-100/50 dark:bg-zinc-800/50 transition-colors text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
              aria-label="Forward 15 seconds"
              onClick={handleForward}
              disabled={isLoading || hasError}
            >
              <Redo className="size-5" />
            </button>
          </div>

          {/* Right: Delete button */}
          <button
            className="p-2 rounded-full transition-colors text-red-500/70 hover:text-red-500 hover:bg-red-500/10"
            aria-label="Delete recording"
            onClick={handleDeleteClick}
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      </LiquidGlassCard>
    </div>
  )
}