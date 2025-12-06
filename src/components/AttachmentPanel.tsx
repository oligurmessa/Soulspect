"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Camera,
  AudioLines,
  Video,
  Heart,
  X,
  Plus,
  Play,
  Pause,
  Trash2,
  Upload,
  FileText
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { PhotoItem, AudioItem, VideoItem, MoodItem } from "@/hooks/useAttachments"

// =============================================================================
// Types
// =============================================================================

interface AttachmentPanelProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLButtonElement | null>

  // Data from useAttachments hook
  photos: PhotoItem[]
  audio: AudioItem[]
  video: VideoItem[]
  mood: MoodItem | null

  // Handlers
  onDeletePhoto: (id: string) => void
  onDeleteAudio: (id: string) => void
  onDeleteVideo: (id: string) => void
  onClearMood: () => void

  // Add handlers (optional - for future extensibility)
  onAddPhoto?: () => void
  onAddAudio?: () => void
  onAddVideo?: () => void
  onAddMood?: () => void
}

// =============================================================================
// Component
// =============================================================================

export function AttachmentPanel({
  isOpen,
  onClose,
  anchorRef,
  photos,
  audio,
  video,
  mood,
  onDeletePhoto,
  onDeleteAudio,
  onDeleteVideo,
  onClearMood,
  onAddPhoto,
  onAddAudio,
  onAddVideo,
  onAddMood,
}: AttachmentPanelProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [playingAudioId, setPlayingAudioId] = React.useState<string | null>(null)

  // =============================================================================
  // Click Outside Handler (FIXED)
  // =============================================================================

  React.useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node

      // Don't close if clicking inside the panel or on the anchor button
      if (
        panelRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return
      }

      onClose()
    }

    // Immediate attachment, no timeout needed if we handle propagation correctly
    // or if the trigger click is handled separately.
    // Using a small timeout is sometimes safer for "click to open" vs "click outside" conflicts
    // but standard practice is to rely on event bubbling order or checking the trigger.
    // Since we check anchorRef.contains, we don't need the timeout.
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose, anchorRef])

  // =============================================================================
  // Escape Key Handler
  // =============================================================================

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return

      if (event.key === "Escape") {
        onClose()
      }
      // Could add arrow key navigation between items here in the future
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // =============================================================================
  // Position Calculation
  // =============================================================================

  // Position calculation removed in favor of CSS absolute positioning

  // =============================================================================
  // Helper Functions
  // =============================================================================

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // =============================================================================
  // Section Components
  // =============================================================================

  const SectionHeader = ({
    icon: Icon,
    title,
    count,
    onAdd
  }: {
    icon: React.ElementType
    title: string
    count: number
    onAdd?: () => void
  }) => (
    <div className="flex items-center justify-between px-4 pt-3 pb-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" strokeWidth={2} />
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {title}
        </span>
        {count > 0 && (
          <span className="text-xs text-zinc-500">
            ({count})
          </span>
        )}
      </div>
      {onAdd && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAdd()
          }}
          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title={`Add ${title.toLowerCase()}`}
        >
          <Plus className="w-3.5 h-3.5 text-zinc-500" strokeWidth={2} />
        </button>
      )}
    </div>
  )

  const PhotoSection = () => (
    <div>
      <SectionHeader icon={Camera} title="Photos" count={photos.length} onAdd={onAddPhoto} />
      {photos.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-400 dark:hover:scrollbar-thumb-zinc-600">
            {photos.map((photo) => (
              <div key={photo.id} className="relative flex-shrink-0">
                <div
                  className="relative w-20 h-20 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors group"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle photo view/enlarge here - could open in modal
                    window.open(photo.url, '_blank')
                  }}
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {photo.isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-white animate-pulse" />
                    </div>
                  )}
                  <div className="absolute inset-0 group-hover:bg-black/10 transition-colors" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeletePhoto(photo.id)
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                >
                  <X className="w-3 h-3" strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const AudioSection = () => (
    <div>
      <SectionHeader icon={AudioLines} title="Audio" count={audio.length} onAdd={onAddAudio} />
      {audio.length > 0 && (
        <div className="px-4 pb-3 space-y-2">
          {audio.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (playingAudioId === item.id) {
                    // Stop current audio
                    setPlayingAudioId(null)
                  } else {
                    // Play new audio
                    setPlayingAudioId(item.id)
                    const audio = new Audio(item.audioUrl)
                    audio.play().catch(console.error)
                    audio.onended = () => setPlayingAudioId(null)
                  }
                }}
                className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${playingAudioId === item.id
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                  }`}
                title={playingAudioId === item.id ? "Stop audio" : "Play audio"}
              >
                {playingAudioId === item.id ? (
                  <Pause className="w-3 h-3 text-white" strokeWidth={2} />
                ) : (
                  <Play className="w-3 h-3 text-zinc-600 dark:text-zinc-400" strokeWidth={2} />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {item.title}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatDuration(item.duration)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteAudio(item.id)
                }}
                className="p-1 rounded-md text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const VideoSection = () => (
    <div>
      <SectionHeader icon={Video} title="Video" count={video.length} onAdd={onAddVideo} />
      {video.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-400 dark:hover:scrollbar-thumb-zinc-600">
            {video.map((item) => (
              <div key={item.id} className="relative flex-shrink-0">
                <div
                  className="relative w-32 aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle video play/preview here
                    const video = e.currentTarget.querySelector('video') as HTMLVideoElement
                    if (video) {
                      if (video.paused) {
                        video.play()
                      } else {
                        video.pause()
                      }
                    }
                  }}
                >
                  <video
                    src={item.videoUrl}
                    className="w-full h-full object-cover"
                    onClick={(e) => e.stopPropagation()}
                    onPlay={(e) => e.stopPropagation()}
                    onPause={(e) => e.stopPropagation()}
                  />
                  <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/70 transition-colors">
                      <Play className="w-4 h-4 text-white" strokeWidth={2} fill="white" />
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteVideo(item.id)
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                >
                  <X className="w-3 h-3" strokeWidth={2.5} />
                </button>
                {item.caption && (
                  <p className="text-xs text-zinc-500 mt-1 truncate max-w-32">{item.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const MoodSection = () => {
    if (!mood) return null

    return (
      <div>
        <SectionHeader icon={Heart} title="Mood" count={1} onAdd={onAddMood} />
        <div className="px-4 pb-3">
          <div className="relative p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClearMood()
              }}
              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
              <X className="w-3 h-3" strokeWidth={2.5} />
            </button>

            <div>
              <p className="font-semibold capitalize text-sm text-zinc-900 dark:text-zinc-100">
                {mood.emotion}
              </p>

              {/* Intensity Bar */}
              <div className="mt-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                    <div
                      className="bg-zinc-900 dark:bg-zinc-100 rounded-full h-1.5 transition-all duration-300"
                      style={{ width: `${(mood.intensity / 6) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 min-w-[2ch]">
                    {mood.intensity}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {(mood.emotions.length > 1 || mood.triggers.length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {mood.emotions.slice(1).map((emotion, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded-md bg-zinc-200 dark:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      {emotion}
                    </span>
                  ))}
                  {mood.triggers.map((trigger, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-xs text-zinc-600 dark:text-zinc-400"
                    >
                      {trigger}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =============================================================================
  // Empty State
  // =============================================================================

  const totalItems = photos.length + audio.length + video.length + (mood ? 1 : 0)

  if (totalItems === 0) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 z-[100] w-80 max-w-[calc(100vw-2rem)] origin-top-right"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800">
              <div className="p-6 text-center">
                <FileText className="w-8 h-8 text-zinc-400 mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  No attachments yet
                </p>
                <p className="text-xs text-zinc-500">
                  Use the toolbar below to add photos, audio, video, or emotions
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // =============================================================================
  // Main Render
  // =============================================================================

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full right-0 mt-2 z-[100] w-80 max-w-[calc(100vw-2rem)] max-h-[70vh] origin-top-right"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-400 dark:hover:scrollbar-thumb-zinc-600">
              {/* Photos */}
              {photos.length > 0 && <PhotoSection />}

              {/* Audio */}
              {audio.length > 0 && (
                <>
                  {photos.length > 0 && <div className="border-t border-zinc-100 dark:border-zinc-800" />}
                  <AudioSection />
                </>
              )}

              {/* Video */}
              {video.length > 0 && (
                <>
                  {(photos.length > 0 || audio.length > 0) && <div className="border-t border-zinc-100 dark:border-zinc-800" />}
                  <VideoSection />
                </>
              )}

              {/* Mood */}
              {mood && (
                <>
                  {(photos.length > 0 || audio.length > 0 || video.length > 0) && <div className="border-t border-zinc-100 dark:border-zinc-800" />}
                  <MoodSection />
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}