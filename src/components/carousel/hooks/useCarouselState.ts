import { useState, useEffect, useCallback } from "react"
import { 
  PhotoItem, 
  AudioItem, 
  VideoItem, 
  EmotionItem, 
  CarouselItem, 
  AllItems 
} from "../ItemCarousel"

export const useCarouselState = (onChange?: (items: AllItems[]) => void) => {
  const [items, setItems] = useState<CarouselItem[]>([])
  const [audioItems, setAudioItems] = useState<AudioItem[]>([])
  const [videoItems, setVideoItems] = useState<VideoItem[]>([])
  const [allItems, setAllItems] = useState<AllItems[]>([])
  const [showEmotionDialog, setShowEmotionDialog] = useState(false)
  const [selectedEmotionItem, setSelectedEmotionItem] = useState<EmotionItem | null>(null)

  // Update combined chronological list when items change
  useEffect(() => {
    const combined: AllItems[] = [...items, ...audioItems, ...videoItems]
    combined.sort((a, b) => {
      const aTime = 'createdAt' in a ? a.createdAt.getTime() : 0
      const bTime = 'createdAt' in b ? b.createdAt.getTime() : 0
      return bTime - aTime // Most recent first
    })
    setAllItems(combined)
    
    if (onChange) {
      onChange(combined)
    }
  }, [items, audioItems, videoItems, onChange])

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      // Clean up all audio URLs (only blob URLs, not Firebase URLs)
      audioItems.forEach(item => {
        if (item.audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.audioUrl)
        }
      })
      // Clean up all video URLs (only blob URLs, not Firebase URLs)
      videoItems.forEach(item => {
        if (item.videoUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.videoUrl)
        }
      })
    }
  }, [audioItems, videoItems])

  const clearAllItems = useCallback(() => {
    // Clean up audio URLs (only blob URLs, not Firebase URLs)
    audioItems.forEach(item => {
      if (item.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.audioUrl)
      }
    })
    // Clean up video URLs (only blob URLs, not Firebase URLs)
    videoItems.forEach(item => {
      if (item.videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.videoUrl)
      }
    })
    setItems([])
    setAudioItems([])
    setVideoItems([])
  }, [audioItems, videoItems])

  const removeItem = useCallback((id: string | number) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const removeAudioItem = useCallback((id: string | number) => {
    setAudioItems(prev => {
      const itemToRemove = prev.find(item => item.id === id)
      if (itemToRemove && itemToRemove.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(itemToRemove.audioUrl)
      }
      return prev.filter(item => item.id !== id)
    })
  }, [])

  const removeVideoItem = useCallback((id: string | number) => {
    setVideoItems(prev => {
      const itemToRemove = prev.find(item => item.id === id)
      if (itemToRemove && itemToRemove.videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(itemToRemove.videoUrl)
      }
      return prev.filter(item => item.id !== id)
    })
  }, [])

  return {
    // State
    items,
    setItems,
    audioItems,
    setAudioItems,
    videoItems,
    setVideoItems,
    allItems,
    showEmotionDialog,
    setShowEmotionDialog,
    selectedEmotionItem,
    setSelectedEmotionItem,
    
    // Computed
    hasItems: items.length > 0 || videoItems.length > 0 || audioItems.length > 0,
    
    // Actions
    clearAllItems,
    removeItem,
    removeAudioItem,
    removeVideoItem,
  }
}