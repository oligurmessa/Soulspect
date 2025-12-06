"use client"

import { useState, useCallback } from "react"

// =============================================================================
// Types
// =============================================================================

export interface PhotoItem {
  id: string
  url: string
  name: string
  caption?: string
  isUploading?: boolean
}

export interface AudioItem {
  id: string
  audioUrl: string
  title: string
  duration: number
  createdAt: Date
}

export interface VideoItem {
  id: string
  videoUrl: string
  duration: number
  caption?: string
  createdAt: Date
}

export interface MoodItem {
  emotion: string
  intensity: number
  emotions: string[]
  triggers: string[]
}

interface AttachmentState {
  photos: PhotoItem[]
  audio: AudioItem[]
  video: VideoItem[]
  mood: MoodItem | null
}

interface MomentLike {
  attachments?: string[]
  emotions?: string[]
  triggers?: string[]
  mood?: number
  timestamp?: { toDate?: () => Date }
}

export interface UseAttachmentsReturn {
  photos: PhotoItem[]
  audio: AudioItem[]
  video: VideoItem[]
  mood: MoodItem | null
  totalCount: number
  
  addPhoto: (file: File, uploadFn?: (file: File) => Promise<string>) => void
  addPhotoFromUrl: (url: string, name: string, caption?: string) => void
  deletePhoto: (id: string) => void
  
  addAudio: (url: string, title: string, duration: number) => void
  deleteAudio: (id: string) => void
  
  addVideo: (url: string, duration: number, caption?: string) => void
  deleteVideo: (id: string) => void
  
  setMood: (mood: MoodItem) => void
  clearMood: () => void
  
  clearAll: () => void
  loadFromMoment: (moment: MomentLike | null | undefined) => void
}

// =============================================================================
// Hook
// =============================================================================

export function useAttachments(): UseAttachmentsReturn {
  const [state, setState] = useState<AttachmentState>({
    photos: [],
    audio: [],
    video: [],
    mood: null,
  })

  // =============================================================================
  // Photo Management
  // =============================================================================

  const addPhoto = useCallback(async (file: File, uploadFn?: (file: File) => Promise<string>) => {
    const id = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create temporary photo with data URL for immediate display
    const tempPhoto: PhotoItem = {
      id,
      url: URL.createObjectURL(file),
      name: file.name,
      isUploading: true,
    }

    setState(prev => ({
      ...prev,
      photos: [...prev.photos, tempPhoto],
    }))

    // Upload if function provided
    if (uploadFn) {
      try {
        const uploadedUrl = await uploadFn(file)
        setState(prev => ({
          ...prev,
          photos: prev.photos.map(photo =>
            photo.id === id
              ? { ...photo, url: uploadedUrl, isUploading: false }
              : photo
          ),
        }))
      } catch (error) {
        console.error("Error uploading photo:", error)
        // Remove failed upload
        setState(prev => ({
          ...prev,
          photos: prev.photos.filter(photo => photo.id !== id),
        }))
      }
    } else {
      // No upload function, just remove uploading state
      setState(prev => ({
        ...prev,
        photos: prev.photos.map(photo =>
          photo.id === id
            ? { ...photo, isUploading: false }
            : photo
        ),
      }))
    }
  }, [])

  const addPhotoFromUrl = useCallback((url: string, name: string, caption?: string) => {
    const photo: PhotoItem = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      name,
      caption,
      isUploading: false,
    }

    setState(prev => ({
      ...prev,
      photos: [...prev.photos, photo],
    }))
  }, [])

  const deletePhoto = useCallback((id: string) => {
    setState(prev => {
      const photo = prev.photos.find(p => p.id === id)
      if (photo && photo.url.startsWith('blob:')) {
        URL.revokeObjectURL(photo.url)
      }
      return {
        ...prev,
        photos: prev.photos.filter(photo => photo.id !== id),
      }
    })
  }, [])

  // =============================================================================
  // Audio Management
  // =============================================================================

  const addAudio = useCallback((url: string, title: string, duration: number) => {
    const audio: AudioItem = {
      id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      audioUrl: url,
      title,
      duration,
      createdAt: new Date(),
    }

    setState(prev => ({
      ...prev,
      audio: [...prev.audio, audio],
    }))
  }, [])

  const deleteAudio = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      audio: prev.audio.filter(audio => audio.id !== id),
    }))
  }, [])

  // =============================================================================
  // Video Management
  // =============================================================================

  const addVideo = useCallback((url: string, duration: number, caption?: string) => {
    const video: VideoItem = {
      id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      videoUrl: url,
      duration,
      caption,
      createdAt: new Date(),
    }

    setState(prev => ({
      ...prev,
      video: [...prev.video, video],
    }))
  }, [])

  const deleteVideo = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      video: prev.video.filter(video => video.id !== id),
    }))
  }, [])

  // =============================================================================
  // Mood Management
  // =============================================================================

  const setMood = useCallback((mood: MoodItem) => {
    setState(prev => ({
      ...prev,
      mood,
    }))
  }, [])

  const clearMood = useCallback(() => {
    setState(prev => ({
      ...prev,
      mood: null,
    }))
  }, [])

  // =============================================================================
  // Bulk Operations
  // =============================================================================

  const clearAll = useCallback(() => {
    setState(prev => {
      // Clean up blob URLs from current state
      prev.photos.forEach(photo => {
        if (photo.url.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url)
        }
      })
      
      return {
        photos: [],
        audio: [],
        video: [],
        mood: null,
      }
    })
  }, [])

  const loadFromMoment = useCallback((moment: MomentLike | null | undefined) => {
    setState(prev => {
      // Clean up previous blob URLs
      prev.photos.forEach(photo => {
        if (photo.url.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url)
        }
      })
      
      if (!moment) {
        return {
          photos: [],
          audio: [],
          video: [],
          mood: null,
        }
      }

      const newState: AttachmentState = {
        photos: [],
        audio: [],
        video: [],
        mood: null,
      }

      // Load attachments
      if (Array.isArray(moment.attachments) && moment.attachments.length > 0) {
        moment.attachments.forEach((url: string) => {
          if (url.includes("image_") || /\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
            newState.photos.push({
              id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              url,
              name: `Image_${Date.now()}`,
              isUploading: false,
            })
          } else if (url.includes("audio_") || url.includes("voice_") || /\.(mp3|wav|m4a|aac|ogg)$/i.test(url)) {
            newState.audio.push({
              id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              audioUrl: url,
              title: "Audio Recording",
              duration: 0,
              createdAt: moment.timestamp?.toDate?.() || new Date(),
            })
          } else if (url.includes("video_") || /\.(mp4|webm|mov|avi)$/i.test(url)) {
            newState.video.push({
              id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              videoUrl: url,
              duration: 0,
              createdAt: moment.timestamp?.toDate?.() || new Date(),
            })
          }
        })
      }

      // Load mood/emotions
      if (moment.emotions && moment.emotions.length > 0) {
        newState.mood = {
          emotion: moment.emotions[0],
          intensity: moment.mood || 5,
          emotions: moment.emotions,
          triggers: moment.triggers || [],
        }
      }

      return newState
    })
  }, [])

  // =============================================================================
  // Computed Values
  // =============================================================================

  const totalCount = state.photos.length + state.audio.length + state.video.length + (state.mood ? 1 : 0)

  return {
    photos: state.photos,
    audio: state.audio,
    video: state.video,
    mood: state.mood,
    totalCount,
    
    addPhoto,
    addPhotoFromUrl,
    deletePhoto,
    
    addAudio,
    deleteAudio,
    
    addVideo,
    deleteVideo,
    
    setMood,
    clearMood,
    
    clearAll,
    loadFromMoment,
  }
}