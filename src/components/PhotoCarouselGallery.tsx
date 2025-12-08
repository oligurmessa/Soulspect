import React, { useState } from "react";
import { X, Image } from "lucide-react";
import BaseCarousel from '@/components/carousel/BaseCarousel';

// --- Types ---
export interface Item {
  id: string | number;
  [key: string]: any;
}

interface Photo extends Item {
  url: string;
  name: string;
}

interface PhotoCarouselGalleryProps {
  photos: Photo[];
  onRemovePhoto: (id: string | number, event?: React.MouseEvent) => void;
  title?: string;
  className?: string;
}

// --- Photo Carousel Gallery Component (Refactored with BaseCarousel) ---
const PhotoCarouselGallery: React.FC<PhotoCarouselGalleryProps> = ({ 
  photos = [], 
  onRemovePhoto,
  title = "Photos",
  className = ""
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedPhoto(null);
  };

  const renderPhotoItem = (photo: Photo, index: number) => (
    <div 
      className="relative cursor-pointer group"
      onClick={() => openDialog(photo)}
    >
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={photo.url}
          alt={photo.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      </div>
      
      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemovePhoto(photo.id, e);
        }}
        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        aria-label="Remove photo"
      >
        <X className="w-3 h-3" />
      </button>
      
      {/* Photo name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 rounded-b-lg">
        <p className="text-xs truncate">{photo.name}</p>
      </div>
    </div>
  );

  if (photos.length === 0) {
    return null;
  }

  return (
    <>
      {/* Photo Carousel */}
      <div className={`space-y-4 ${className}`}>
        {title && (
          <div className="flex items-center space-x-2">
            <Image className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <span className="text-sm text-gray-500">({photos.length})</span>
          </div>
        )}
        
        <BaseCarousel
          items={photos}
          renderItem={renderPhotoItem}
          onItemChange={(index) => {
            // Optional: handle item change
          }}
          onItemDelete={(index) => {
            if (photos[index]) {
              onRemovePhoto(photos[index].id);
            }
          }}
          className="w-full"
          showControls={photos.length > 1}
        />
      </div>

      {/* Full-screen photo dialog */}
      {isDialogOpen && selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
            {/* Close button */}
            <button
              onClick={closeDialog}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 text-gray-900 rounded-full flex items-center justify-center hover:bg-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Photo */}
            <div className="bg-black flex items-center justify-center min-h-[60vh]">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.name}
                className="w-full max-h-[80vh] object-contain"
              />
            </div>
            
            {/* Photo details */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 truncate">{selectedPhoto.name}</h3>
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => {
                    onRemovePhoto(selectedPhoto.id);
                    closeDialog();
                  }}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={closeDialog}
                  className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoCarouselGallery;