"use client";

import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import BaseCarousel from '@/components/carousel/BaseCarousel';
import { cn } from '@/lib/utils';

// --- Types ---

// Define a generic Item interface to allow various data types
export interface Item {
  id: string | number;
  [key: string]: any;
}

// Props interface for GenericCarouselGallery
interface GenericCarouselGalleryProps<T extends Item> {
  items: T[];
  onRemoveItem: (id: string | number, event?: React.MouseEvent) => void;
  renderItemContent: (item: T) => React.ReactNode;
  renderDialogContent: (item: T, onRemove: (id: string | number) => void) => React.ReactNode;
  title: string;
  className?: string;
}

// --- Generic Carousel Gallery Component (Refactored with BaseCarousel) ---
const GenericCarouselGallery = <T extends Item>({
  items = [],
  onRemoveItem,
  renderItemContent,
  renderDialogContent,
  title,
  className
}: GenericCarouselGalleryProps<T>) => {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog = (item: T) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedItem(null);
  };

  const renderCarouselItem = (item: T, index: number) => (
    <div className="pl-2">
      <div 
        className="relative group cursor-pointer"
        onClick={() => openDialog(item)}
      >
        <div className="space-y-2">
          {renderItemContent(item)}
        </div>
        
        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveItem(item.id, e);
          }}
          className="absolute top-0.5 right-0.5 bg-red-500/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          aria-label="Remove item"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  // If there are no items, render nothing for this carousel instance
  if (items.length === 0) {
    return null;
  }

  return (
    <>
      {/* Main container for displaying the carousel and its header */}
      <div className={cn("space-y-4", className)}>
        {/* Title section */}
        {title && (
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        )}

        {/* Carousel using BaseCarousel */}
        <BaseCarousel
          items={items}
          renderItem={renderCarouselItem}
          onItemChange={(index) => {
            // Optional: handle item change
          }}
          onItemDelete={(index) => {
            if (items[index]) {
              onRemoveItem(items[index].id);
            }
          }}
          className="w-full"
          showControls={items.length > 1}
          opts={{
            align: 'start',
            slidesToScroll: 1,
          }}
        />
      </div>

      {/* Item dialog for viewing selected item */}
      {isDialogOpen && selectedItem && (
        <div
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={closeDialog}
        >
          <div
            className="relative max-w-lg w-full max-h-[90vh] bg-white rounded-lg shadow-lg overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeDialog}
              className="absolute top-4 right-4 z-10 w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Dialog content */}
            <div className="flex flex-col">
              {renderDialogContent(selectedItem, onRemoveItem)}
            </div>
          </div>
        </div>
      )}

      {/* Adding keyframe animations for dialog */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
      `}</style>
    </>
  );
};

export default GenericCarouselGallery;