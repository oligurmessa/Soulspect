"use client";

import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import GenericCarouselGallery, { Item } from '@/components/GenericCarouselGallery';
import EmotionDialogControlled from '@/components/features/emotion/EmotionDialogControlled';
import { useCarouselState } from './hooks/useCarouselState';
import { PhotoCarouselItem } from './items/PhotoCarouselItem';
import { AudioCarouselItem } from './items/AudioCarouselItem';
import { VideoCarouselItem } from './items/VideoCarouselItem';
import { EmotionCarouselItem } from './items/EmotionCarouselItem';

// Re-export types for backward compatibility
export interface PhotoItem extends Item {
  type: 'photo';
  url: string;
  name: string;
  caption?: string;
  isUploading?: boolean;
  uploadError?: boolean;
}

export interface AudioItem {
  id: string | number;
  type: 'audio';
  audioBlob: Blob;
  audioUrl: string;
  transcript?: string;
  duration: number;
  createdAt: Date;
}

export interface VideoItem {
  id: string | number;
  type: 'video';
  videoBlob?: Blob;
  videoUrl: string;
  duration: number;
  createdAt: Date;
  caption?: string;
}

export interface EmotionItem extends Item {
  type: 'emotion';
  emotion: string;
  intensity: number;
  note?: string;
  emotions?: string[];
  triggers?: string[];
  createdAt: Date;
}

export type CarouselItem = PhotoItem | EmotionItem | VideoItem;
export type AllItems = PhotoItem | AudioItem | VideoItem | EmotionItem;

interface ItemCarouselProps {
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
  userId?: string;
  entryId?: string | null;
}

const ItemCarousel = forwardRef<ItemCarouselRef, ItemCarouselProps>(({ className, onImageUpload, userId }, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const carouselState = useCarouselState();

  const {
    items,
    setItems,
    audioItems,
    setAudioItems,
    videoItems,
    setVideoItems,
    allItems,
    hasItems,
    showEmotionDialog,
    setShowEmotionDialog,
    selectedEmotionItem,
    setSelectedEmotionItem,
    clearAllItems,
    removeItem,
    removeAudioItem,
    removeVideoItem,
  } = carouselState;

  // Add a new audio recording (max 2 audio recordings per log)
  const addAudioRecording = (audioBlob: Blob, transcript?: string, title?: string) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const newAudioItem: AudioItem = {
      id: Date.now() + Math.random(),
      type: 'audio',
      audioBlob,
      audioUrl,
      transcript: title || transcript,
      duration: 0,
      createdAt: new Date(),
    };

    setAudioItems(prev => {
      const updatedItems = [newAudioItem, ...prev];
      
      if (updatedItems.length > 2) {
        const itemToRemove = updatedItems[updatedItems.length - 1];
        URL.revokeObjectURL(itemToRemove.audioUrl);
        return updatedItems.slice(0, 2);
      }
      
      return updatedItems;
    });
  };

  // Add a new video recording
  const addVideoRecording = (videoBlob: Blob, duration: number, caption?: string) => {
    const videoUrl = URL.createObjectURL(videoBlob);
    const newVideoItem: VideoItem = {
      id: Date.now() + Math.random(),
      type: 'video',
      videoBlob,
      videoUrl,
      duration,
      caption: caption || '',
      createdAt: new Date(),
    };
    
    setVideoItems(prev => {
      const updatedItems = [newVideoItem, ...prev];
      
      if (updatedItems.length > 1) {
        const itemToRemove = updatedItems[updatedItems.length - 1];
        URL.revokeObjectURL(itemToRemove.videoUrl);
        return updatedItems.slice(0, 1);
      }
      
      return updatedItems;
    });
  };

  // Add video recording from existing URL (for edit mode)
  const addVideoFromUrl = (videoUrl: string, duration?: number, caption?: string, createdAt?: Date) => {
    const newVideoItem: VideoItem = {
      id: Date.now() + Math.random(),
      type: 'video',
      videoUrl,
      duration: duration || 0,
      caption: caption || '',
      createdAt: createdAt || new Date(),
    };
    
    setVideoItems(prev => [...prev, newVideoItem]);
  };

  // Add audio recording from existing URL (for edit mode)
  const addAudioFromUrl = (audioUrl: string, transcript?: string, duration?: number, createdAt?: Date) => {
    const newAudioItem: AudioItem = {
      id: Date.now() + Math.random(),
      type: 'audio',
      audioBlob: new Blob([''], { type: 'audio/webm' }),
      audioUrl,
      transcript: transcript || 'Audio Recording',
      duration: duration || 0,
      createdAt: createdAt || new Date(),
    };

    setAudioItems(prev => {
      const updatedItems = [newAudioItem, ...prev];
      
      if (updatedItems.length > 2) {
        const itemToRemove = updatedItems[updatedItems.length - 1];
        if (itemToRemove.audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(itemToRemove.audioUrl);
        }
        return updatedItems.slice(0, 2);
      }
      
      return updatedItems;
    });
  };

  // Add photo from file
  const addPhotoFromFile = async (file: File) => {
    const photoId = Date.now() + Math.random();
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      
      const newPhoto: PhotoItem = {
        id: photoId,
        type: 'photo',
        url: dataUrl,
        name: file.name,
        isUploading: true,
      };
      setItems(prev => [newPhoto, ...prev]);
      
      if (onImageUpload && userId) {
        const uploadTimeout = setTimeout(() => {
          setItems(prev => prev.map(item => 
            item.id === photoId 
              ? { ...item, isUploading: false, uploadError: true } as PhotoItem
              : item
          ));
        }, 30000);

        try {
          const uploadedUrl = await onImageUpload(file);
          clearTimeout(uploadTimeout);
          
          setItems(prev => prev.map(item => 
            item.id === photoId 
              ? { ...item, url: uploadedUrl, isUploading: false, uploadError: false } as PhotoItem
              : item
          ));
        } catch (error) {
          clearTimeout(uploadTimeout);
          setItems(prev => prev.map(item => 
            item.id === photoId 
              ? { ...item, isUploading: false, uploadError: true } as PhotoItem
              : item
          ));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Add emotion
  const addEmotion = (emotion: string, intensity: number, note?: string, emotions?: string[], triggers?: string[]) => {
    const newEmotion: EmotionItem = {
      id: Date.now() + Math.random(),
      type: 'emotion',
      emotion,
      intensity,
      note,
      emotions,
      triggers,
      createdAt: new Date(),
    };
    setItems(prev => [newEmotion, ...prev]);
  };

  // Add photo (trigger file input)
  const addPhoto = () => {
    fileInputRef.current?.click();
  };

  // Add photo from data URL
  const addPhotoFromDataUrl = (url: string, name: string, caption?: string) => {
    const newPhoto: PhotoItem = {
      id: Date.now() + Math.random(),
      type: 'photo',
      url,
      name,
      caption,
    };
    setItems(prev => [newPhoto, ...prev]);
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(addPhotoFromFile);
    }
  };

  // Update photo caption
  const updatePhotoCaption = (id: string | number, caption: string) => {
    setItems(prev => prev.map(item => 
      item.id === id && item.type === 'photo' 
        ? { ...item, caption } as PhotoItem
        : item
    ));
  };

  // Render item content for GenericCarouselGallery
  const renderItemContent = (item: CarouselItem | VideoItem) => {
    switch (item.type) {
      case 'photo':
        return (
          <PhotoCarouselItem
            item={item as PhotoItem}
            onUpdate={(id, updates) => {
              setItems(prev => prev.map(i => 
                i.id === id ? { ...i, ...updates } as CarouselItem : i
              ));
            }}
            onDelete={(id) => removeItem(id)}
          />
        );
      case 'video':
        return (
          <VideoCarouselItem
            item={item as VideoItem}
            onUpdate={(id, updates) => {
              setVideoItems(prev => prev.map(i => 
                i.id === id ? { ...i, ...updates } as VideoItem : i
              ));
            }}
            onDelete={removeVideoItem}
            onRemove={(id) => removeItem(id)}
          />
        );
      case 'emotion':
        return <EmotionCarouselItem item={item as EmotionItem} onDelete={(id) => removeItem(id)} />;
      default:
        return null;
    }
  };

  // Render dialog content for emotions
  const renderDialogContent = (item: CarouselItem | VideoItem, onRemove: (id: string | number) => void) => {
    if (item.type === 'emotion') {
      setSelectedEmotionItem(item as EmotionItem);
      setShowEmotionDialog(true);
      return null;
    }
    return null;
  };

  // Expose methods for adding items
  useImperativeHandle(ref, () => ({
    addAudioRecording,
    addAudioFromUrl,
    addVideoRecording,
    addVideoFromUrl,
    addEmotion,
    addPhoto,
    addPhotoFromFile,
    addPhotoFromDataUrl,
    getAudioCount: () => audioItems.length,
    getVideoCount: () => videoItems.length,
    getAllItems: () => ({
      photos: items.filter(item => item.type === 'photo').map(photo => ({
        ...photo,
        url: photo.url.startsWith('data:') ? '' : photo.url
      })) as PhotoItem[],
      emotions: items.filter(item => item.type === 'emotion') as EmotionItem[],
      audioRecordings: audioItems,
      videoRecordings: videoItems,
    }),
    clearAllItems,
  }));

  if (!hasItems) {
    return null;
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Carousel Container */}
      <div className={`w-full ${className}`}>
        {/* Mobile Layout */}
        <div className="lg:hidden">
          <div className="max-h-[35vh] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/30 space-y-2 pr-1">
            {/* Visual Content */}
            {(items.length > 0 || videoItems.length > 0) && (
              <div className="flex-shrink-0">
                <GenericCarouselGallery
                  items={[...items, ...videoItems]}
                  onRemoveItem={removeItem}
                  renderItemContent={renderItemContent}
                  renderDialogContent={renderDialogContent}
                  title=""
                  className="w-full"
                />
              </div>
            )}
            
            {/* Audio Items */}
            {audioItems.map((item) => (
              <div key={item.id} className="flex-shrink-0">
                <AudioCarouselItem
                  item={item}
                  onDelete={removeAudioItem}
                  className="w-full"
                />
              </div>
            ))}
            
            {/* Scroll Indicator */}
            <div className="text-center py-1 opacity-50">
              <div className="text-xs text-muted-foreground">
                {allItems.length > 0 && "Scroll to see more"}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="flex gap-4 max-w-[600px] max-h-[250px] overflow-hidden">
            {/* Visual Content Section */}
            {(items.length > 0 || videoItems.length > 0) && (
              <div className="flex-shrink-0 w-[280px]">
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/30 pr-2">
                  <GenericCarouselGallery
                    items={[...items, ...videoItems]}
                    onRemoveItem={removeItem}
                    renderItemContent={renderItemContent}
                    renderDialogContent={renderDialogContent}
                    title=""
                    className="w-full"
                  />
                </div>
              </div>
            )}
            
            {/* Audio Content Section */}
            {audioItems.length > 0 && (
              <div className="flex-1 min-w-[200px] max-w-[300px]">
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/30 pr-2">
                  <div className="space-y-2">
                    {audioItems.map((item) => (
                      <AudioCarouselItem
                        key={item.id}
                        item={item}
                        onDelete={removeAudioItem}
                        className="w-full"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Emotion Dialog */}
      <EmotionDialogControlled 
        open={showEmotionDialog}
        onOpenChange={setShowEmotionDialog}
        emotionItem={selectedEmotionItem || undefined}
        onDelete={() => {
          if (selectedEmotionItem) {
            removeItem(selectedEmotionItem.id);
            setSelectedEmotionItem(null);
          }
        }}
      />
    </>
  );
});

ItemCarousel.displayName = "ItemCarousel";

// Export the ref type for parent components
export interface ItemCarouselRef {
  addAudioRecording: (audioBlob: Blob, transcript?: string, title?: string) => void;
  addAudioFromUrl: (audioUrl: string, transcript?: string, duration?: number, createdAt?: Date) => void;
  addVideoRecording: (videoBlob: Blob, duration: number, caption?: string) => void;
  addVideoFromUrl: (videoUrl: string, duration?: number, caption?: string, createdAt?: Date) => void;
  addEmotion: (emotion: string, intensity: number, note?: string, emotions?: string[], triggers?: string[]) => void;
  addPhoto: () => void;
  addPhotoFromFile: (file: File) => void;
  addPhotoFromDataUrl: (url: string, name: string, caption?: string) => void;
  getAudioCount: () => number;
  getVideoCount: () => number;
  getAllItems: () => {
    photos: PhotoItem[];
    emotions: EmotionItem[];
    audioRecordings: AudioItem[];
    videoRecordings: VideoItem[];
  };
  clearAllItems: () => void;
}

export default ItemCarousel;