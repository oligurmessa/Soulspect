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
  FileText,
  Maximize2,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { PhotoItem, AudioItem, VideoItem, MoodItem } from "@/hooks/useAttachments"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog"

// =============================================================================
// Types
// =============================================================================

interface AttachmentPanelProps {
  isOpen: boolean
  onClose: () => void

  // Data
  photos: PhotoItem[]
  audio: AudioItem[]
  video: VideoItem[]
  mood: MoodItem | null

  // Handlers
  onDeletePhoto: (id: string) => void
  onDeleteAudio: (id: string) => void
  onDeleteVideo: (id: string) => void
  onClearMood: () => void

  // Add handlers
  onAddPhoto?: () => void
  onAddAudio?: () => void
  onAddVideo?: () => void
  onAddMood?: () => void

  children?: React.ReactNode
}

// =============================================================================
// Component
// =============================================================================

export function AttachmentPanel({
  isOpen,
  onClose,
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
  children,
}: AttachmentPanelProps) {
  const [playingAudioId, setPlayingAudioId] = React.useState<string | null>(null)
  const [previewMedia, setPreviewMedia] = React.useState<{ type: 'photo' | 'video', url: string } | null>(null)
  const [isMobile, setIsMobile] = React.useState(false)

  // Detect mobile
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // =============================================================================
  // Sub-Components (Sections)
  // =============================================================================

  const SectionHeader = ({ icon: Icon, title, count, onAdd }: any) => (
    <div className="flex items-center justify-between px-1 py-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-zinc-500" />
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
        {count > 0 && <span className="text-xs text-zinc-400">({count})</span>}
      </div>
      {onAdd && (
        <button
          onClick={(e) => { e.stopPropagation(); onAdd() }}
          className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  )

  const Content = () => (
    <div className="space-y-6 pb-6">
      {/* Photos */}
      <div className="space-y-2">
        <SectionHeader icon={Camera} title="Photos" count={photos.length} onAdd={onAddPhoto} />
        {photos.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <img
                  src={photo.url}
                  alt="Attachment"
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setPreviewMedia({ type: 'photo', url: photo.url })}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); onDeletePhoto(photo.id) }}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
            <p className="text-xs text-zinc-400">No photos added</p>
          </div>
        )}
      </div>

      {/* Video */}
      <div className="space-y-2">
        <SectionHeader icon={Video} title="Video" count={video.length} onAdd={onAddVideo} />
        {video.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {video.map((item) => (
              <div key={item.id} className="group relative aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <video src={item.videoUrl} className="w-full h-full object-cover" />
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer hover:bg-black/30 transition-colors"
                  onClick={() => setPreviewMedia({ type: 'video', url: item.videoUrl })}
                >
                  <Play className="w-8 h-8 text-white opacity-80" fill="currentColor" />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteVideo(item.id) }}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
            <p className="text-xs text-zinc-400">No videos added</p>
          </div>
        )}
      </div>

      {/* Audio */}
      <div className="space-y-2">
        <SectionHeader icon={AudioLines} title="Audio" count={audio.length} onAdd={onAddAudio} />
        {audio.length > 0 ? (
          <div className="space-y-2">
            {audio.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => {
                    if (playingAudioId === item.id) {
                      setPlayingAudioId(null)
                    } else {
                      setPlayingAudioId(item.id)
                      const a = new Audio(item.audioUrl)
                      a.play()
                      a.onended = () => setPlayingAudioId(null)
                    }
                  }}
                  className="p-2 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-blue-500 hover:text-white transition-colors"
                >
                  {playingAudioId === item.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">{item.title}</p>
                  <p className="text-xs text-zinc-500">{formatDuration(item.duration)}</p>
                </div>
                <button onClick={() => onDeleteAudio(item.id)} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
            <p className="text-xs text-zinc-400">No audio added</p>
          </div>
        )}
      </div>

      {/* Mood - Always Visible */}
      <div className="space-y-2">
        {/* Show 'Add' button in header if no mood is set */}
        <SectionHeader icon={Heart} title="Mood" count={mood ? 1 : 0} onAdd={!mood ? onAddMood : undefined} />
        {mood ? (
          <div className="relative p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={onClearMood}
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
        ) : (
          <div className="p-4 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
            <p className="text-xs text-zinc-400">No mood logged</p>
          </div>
        )}
      </div>
    </div>
  )

  // =============================================================================
  // Preview Dialog
  // =============================================================================

  const PreviewDialog = () => (
    <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
      <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none text-white">
        <DialogTitle className="sr-only">Attachment Preview</DialogTitle>
        <div className="relative w-full h-full flex items-center justify-center">
          <button
            onClick={() => setPreviewMedia(null)}
            className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          {previewMedia?.type === 'photo' ? (
            <img src={previewMedia.url} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
          ) : (
            <video src={previewMedia?.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )

  // =============================================================================
  // Render
  // =============================================================================

  if (isMobile) {
    return (
      <>
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <DrawerTrigger asChild>
            {children}
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-zinc-200 dark:border-zinc-800">
            <DrawerHeader>
              <DrawerTitle>Attachments</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 overflow-y-auto">
              {/* Reset handlers to closures for rendering content */}
              <Content />
            </div>
          </DrawerContent>
        </Drawer>
        <PreviewDialog />
      </>
    )
  }

  return (
    <>
      <Popover open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent
          className="w-[24rem] p-4 max-h-[70vh] overflow-y-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 shadow-2xl"
          align="end"
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Content />
        </PopoverContent>
      </Popover>
      <PreviewDialog />
    </>
  )
}