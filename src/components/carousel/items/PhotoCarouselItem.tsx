import React from "react"
import { Trash2 } from "lucide-react"
import { CaptionInput } from "@/components/ui/caption-input"
import { PhotoItem } from "../ItemCarousel"

interface PhotoCarouselItemProps {
  item: PhotoItem
  onUpdate: (id: string | number, updates: Partial<PhotoItem>) => void
  onDelete: (id: string | number) => void
}

export const PhotoCarouselItem: React.FC<PhotoCarouselItemProps> = ({ item, onUpdate, onDelete }) => {
  const updateCaption = (caption: string) => {
    onUpdate(item.id, { caption })
  }

  return (
    <>
      <div className="relative">
        {item.url ? (
          <img
            src={item.url}
            alt={item.name}
            className="w-full max-h-[80vh] object-contain"
          />
        ) : (
          <div className="w-full h-[400px] flex items-center justify-center bg-gray-100">
            <span className="text-gray-400">Image loading...</span>
          </div>
        )}
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
            onClick={() => onDelete(item.id)}
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