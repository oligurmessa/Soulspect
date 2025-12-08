import React from "react"
import { EmotionItem } from "../ItemCarousel"

interface EmotionCarouselItemProps {
  item: EmotionItem
  onUpdate?: (id: string | number, updates: Partial<EmotionItem>) => void
  onDelete: (id: string | number) => void
}

export const EmotionCarouselItem: React.FC<EmotionCarouselItemProps> = ({ 
  item, 
  onDelete 
}) => {
  // Emotion items use their own dialog - return null for direct rendering
  // The emotion display is handled by EmotionDialogControlled
  return null
}