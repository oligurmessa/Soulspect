import React from "react"
import { Trash2 } from "lucide-react"
import { CaptionInput } from "@/components/ui/caption-input"
import { VideoItem } from "../ItemCarousel"

interface VideoCarouselItemProps {
  item: VideoItem
  onUpdate: (id: string | number, updates: Partial<VideoItem>) => void
  onDelete: (id: string | number) => void
  onRemove?: (id: string | number) => void
}

export const VideoCarouselItem: React.FC<VideoCarouselItemProps> = ({ 
  item, 
  onUpdate, 
  onDelete,
  onRemove 
}) => {
  const updateCaption = (caption: string) => {
    onUpdate(item.id, { caption })
  }

  const handleDelete = () => {
    // Clean up blob URL if it's a local blob
    if (item.videoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(item.videoUrl)
    }
    onDelete(item.id)
    if (onRemove) {
      onRemove(item.id)
    }
  }

  return (
    <>
      <div className="relative">
        <video
          src={item.videoUrl}
          className="w-full max-h-[80vh] object-contain"
          controls
          playsInline
        />
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="mb-3">
          <CaptionInput
            value={item.caption || ''}
            placeholder="Add a caption..."
            onSave={updateCaption}
            onClear={() => updateCaption('')}
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleDelete}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Remove
          </button>
        </div>
      </div>
    </>
  )
}