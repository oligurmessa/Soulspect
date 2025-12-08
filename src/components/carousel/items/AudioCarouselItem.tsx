import React from "react"
import { LiquidAudioPlayer } from "@/components/liquid-audio-player"
import { AudioItem } from "../ItemCarousel"

interface AudioCarouselItemProps {
  item: AudioItem
  onUpdate?: (id: string | number, updates: Partial<AudioItem>) => void
  onDelete: (id: string | number) => void
  className?: string
}

export const AudioCarouselItem: React.FC<AudioCarouselItemProps> = ({ 
  item, 
  onDelete,
  className 
}) => {
  return (
    <LiquidAudioPlayer
      audioUrl={item.audioUrl}
      title={item.transcript || "Audio Recording"}
      createdAt={item.createdAt}
      onDelete={() => onDelete(item.id)}
      className={className}
    />
  )
}