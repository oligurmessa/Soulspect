"use client";

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Heart, Trash2 } from 'lucide-react';
import GenericCarouselGallery, { Item } from '@/components/GenericCarouselGallery';
import { LiquidAudioPlayer } from '@/components/liquid-audio-player';
import EmotionDialogControlled from '@/components/EmotionDialogControlled';
import { CaptionInput } from '@/components/ui/caption-input';

// Define different item types
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
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [audioItems, setAudioItems] = useState<AudioItem[]>([]);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [allItems, setAllItems] = useState<AllItems[]>([]);
  const [showEmotionDialog, setShowEmotionDialog] = useState(false);
  const [selectedEmotionItem, setSelectedEmotionItem] = useState<EmotionItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Add a new audio recording (max 2 audio recordings per log)
  const addAudioRecording = (audioBlob: Blob, transcript?: string, title?: string) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const newAudioItem: AudioItem = {
      id: Date.now() + Math.random(),
      type: 'audio',
      audioBlob,
      audioUrl,
      transcript: title || transcript, // Use custom title if provided, fallback to transcript
      duration: 0, // Will be set by the audio player component
      createdAt: new Date(),
    };

    setAudioItems(prev => {
      const updatedItems = [newAudioItem, ...prev];
      
      // Limit to 2 audio recordings max - remove oldest if we exceed the limit
      if (updatedItems.length > 2) {
        const itemToRemove = updatedItems[updatedItems.length - 1];
        // Clean up the URL of the removed item
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
      
      // Limit to 1 video recording max - remove oldest if we exceed the limit
      if (updatedItems.length > 1) {
        const itemToRemove = updatedItems[updatedItems.length - 1];
        // Clean up the URL of the removed item
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
      audioBlob: new Blob([''], { type: 'audio/webm' }), // Placeholder blob
      audioUrl,
      transcript: transcript || 'Audio Recording',
      duration: duration || 0,
      createdAt: createdAt || new Date(),
    };

    setAudioItems(prev => {
      const updatedItems = [newAudioItem, ...prev];
      
      // Limit to 2 audio recordings max
      if (updatedItems.length > 2) {
        const itemToRemove = updatedItems[updatedItems.length - 1];
        // Don't revoke URL for Firebase Storage URLs (they're not blob URLs)
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
    
    // First, add a placeholder photo with loading state
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      
      // Add photo with local data URL first for immediate feedback
      const newPhoto: PhotoItem = {
        id: photoId,
        type: 'photo',
        url: dataUrl,
        name: file.name,
        isUploading: true,
      };
      setItems(prev => [newPhoto, ...prev]);
      
      // Upload to Firebase if handler is provided
      if (onImageUpload && userId) {
        console.log('Starting image upload...', 'userId:', userId);
        
        // Set a timeout to prevent infinite uploading
        const uploadTimeout = setTimeout(() => {
          console.error('Upload timeout - marking as error');
          setItems(prev => prev.map(item => 
            item.id === photoId 
              ? { ...item, isUploading: false, uploadError: true } as PhotoItem
              : item
          ));
        }, 30000); // 30 second timeout
        
        try {
          const uploadedUrl = await onImageUpload(file);
          clearTimeout(uploadTimeout);
          console.log('Image uploaded successfully:', uploadedUrl);
          
          // Update the photo with the uploaded URL
          setItems(prev => prev.map(item => 
            item.id === photoId 
              ? { ...item, url: uploadedUrl, isUploading: false } as PhotoItem
              : item
          ));
        } catch (error) {
          clearTimeout(uploadTimeout);
          console.error('Error uploading image:', error);
          // Update to show error state
          setItems(prev => prev.map(item => 
            item.id === photoId 
              ? { ...item, isUploading: false, uploadError: true } as PhotoItem
              : item
          ));
        }
      } else {
        console.log('No upload handler or user ID:', { onImageUpload: !!onImageUpload, userId });
        // If no upload handler, just mark as not uploading
        setItems(prev => prev.map(item => 
          item.id === photoId 
            ? { ...item, isUploading: false } as PhotoItem
            : item
        ));
      }
    };
    reader.readAsDataURL(file);
  };

  // Add photo from data URL (for editing)
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

  // Add photo via file input
  const addPhoto = () => {
    fileInputRef.current?.click();
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
    // Debug logging
    console.log('Adding emotion to carousel:', newEmotion);
    setItems(prev => [newEmotion, ...prev]);
  };

  // Update photo caption
  const updatePhotoCaption = (id: string | number, caption: string) => {
    setItems(prev => prev.map(item => 
      item.id === id && item.type === 'photo'
        ? { ...item, caption }
        : item
    ));
  };

  // Remove item
  const removeItem = (id: string | number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    // Remove from carousel items (photos and emotions)
    setItems(prev => prev.filter(item => item.id !== id));
    
    // Remove from video items if it's a video
    setVideoItems(prev => {
      const itemToRemove = prev.find(item => item.id === id);
      if (itemToRemove && itemToRemove.videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(itemToRemove.videoUrl);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  // Remove audio item
  const removeAudioItem = (id: string | number) => {
    setAudioItems(prev => {
      const itemToRemove = prev.find(item => item.id === id);
      if (itemToRemove) {
        // Clean up audio resources (only for blob URLs, not Firebase URLs)
        if (itemToRemove.audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(itemToRemove.audioUrl);
        }
      }
      return prev.filter(item => item.id !== id);
    });
  };


  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        addPhotoFromFile(file);
      }
    });
    event.target.value = '';
  };

  // Render functions for different item types
  const renderItemContent = (item: CarouselItem) => {
    switch (item.type) {
      case 'photo':
        if (item.isUploading) {
          return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <span className="text-gray-500 text-xs">Uploading...</span>
              </div>
            </div>
          );
        }
        if (item.uploadError) {
          return (
            <div className="w-full h-full flex items-center justify-center bg-red-50">
              <span className="text-red-500 text-xs">Upload failed</span>
            </div>
          );
        }
        return item.url ? (
          <img
            src={item.url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 text-sm">Loading...</span>
          </div>
        );
      case 'video':
        return (
          <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
            <video
              src={item.videoUrl}
              className="w-full h-full object-cover"
              controls={false}
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="material-symbols-outlined text-gray-800 text-2xl ml-1">play_arrow</span>
              </div>
            </div>
            <div className="absolute bottom-2 left-2 text-white text-xs bg-black/60 rounded px-2 py-1">
              {Math.floor(item.duration / 60).toString().padStart(2, '0')}:{(item.duration % 60).toString().padStart(2, '0')}
            </div>
          </div>
        );
      case 'emotion':
        return (
          <div 
            className="w-full h-full flex flex-col items-center justify-center p-2 bg-gradient-to-br from-pink-50 to-rose-100 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              // Debug: clicking emotion item
              setSelectedEmotionItem(item as EmotionItem);
              setShowEmotionDialog(true);
            }}
          >
            <Heart className="w-8 h-8 text-rose-600 mb-2" />
            <div className="text-xs text-center">
              <div className="font-medium text-rose-800">{item.emotion}</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderDialogContent = (item: CarouselItem, onRemove: (id: string | number) => void) => {
    switch (item.type) {
      case 'photo':
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
                  onSave={(caption) => updatePhotoCaption(item.id, caption)}
                  onClear={() => updatePhotoCaption(item.id, '')}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onRemove(item.id)}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              </div>
            </div>
          </>
        );
      case 'video':
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
                  onSave={(caption) => {
                    setVideoItems(prev => prev.map(videoItem => 
                      videoItem.id === item.id
                        ? { ...videoItem, caption }
                        : videoItem
                    ));
                  }}
                  onClear={() => {
                    setVideoItems(prev => prev.map(videoItem => 
                      videoItem.id === item.id
                        ? { ...videoItem, caption: '' }
                        : videoItem
                    ));
                  }}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // Remove from video items
                    setVideoItems(prev => {
                      const itemToRemove = prev.find(videoItem => videoItem.id === item.id);
                      if (itemToRemove && itemToRemove.videoUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(itemToRemove.videoUrl);
                      }
                      return prev.filter(videoItem => videoItem.id !== item.id);
                    });
                    onRemove(item.id);
                  }}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              </div>
            </div>
          </>
        );
      case 'emotion':
        return null; // Emotion items use their own dialog
      default:
        return null;
    }
  };

  // Update combined chronological list when items change
  useEffect(() => {
    const combined: AllItems[] = [...items, ...audioItems, ...videoItems];
    combined.sort((a, b) => {
      const aTime = 'createdAt' in a ? a.createdAt.getTime() : 0;
      const bTime = 'createdAt' in b ? b.createdAt.getTime() : 0;
      return bTime - aTime; // Most recent first
    });
    setAllItems(combined);
  }, [items, audioItems, videoItems]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all audio URLs (only blob URLs, not Firebase URLs)
      audioItems.forEach(item => {
        if (item.audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.audioUrl);
        }
      });
      // Clean up all video URLs (only blob URLs, not Firebase URLs)
      videoItems.forEach(item => {
        if (item.videoUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.videoUrl);
        }
      });
    };
  }, []);

  // Expose methods for adding items (to be used by parent components)
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
        // Don't return base64 URLs, only Firebase Storage URLs
        url: photo.url.startsWith('data:') ? '' : photo.url
      })) as PhotoItem[],
      emotions: items.filter(item => item.type === 'emotion') as EmotionItem[],
      audioRecordings: audioItems,
      videoRecordings: videoItems,
    }),
    clearAllItems: () => {
      // Clean up audio URLs (only blob URLs, not Firebase URLs)
      audioItems.forEach(item => {
        if (item.audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.audioUrl);
        }
      });
      // Clean up video URLs (only blob URLs, not Firebase URLs)
      videoItems.forEach(item => {
        if (item.videoUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.videoUrl);
        }
      });
      setItems([]);
      setAudioItems([]);
      setVideoItems([]);
    },
  }));

  // Check if we have any items to display
  const hasItems = (items.length > 0 || videoItems.length > 0 || audioItems.length > 0);

  if (!hasItems) {
    return null; // Don't render anything if no items
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

      {/* Carousel Container - Responsive design with proper height management */}
      <div className={`w-full ${className}`}>
        {/* Desktop: Horizontal layout, Mobile: Compact vertical stack */}
        <div className="lg:hidden">
          {/* Mobile Layout - Compact vertical stack with smart scrolling */}
          <div className="max-h-[35vh] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/30 space-y-2 pr-1">
            {/* Render Carousel for photos, videos and emotions */}
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
            
            {/* Render Audio Player Cards */}
            {audioItems.map((item) => (
              <div key={item.id} className="flex-shrink-0">
                <LiquidAudioPlayer
                  audioUrl={item.audioUrl}
                  title={item.transcript || "Audio Recording"}
                  createdAt={item.createdAt}
                  onDelete={() => removeAudioItem(item.id)}
                  className="w-full"
                />
              </div>
            ))}
            
            {/* Scroll Indicator for mobile */}
            <div className="text-center py-1 opacity-50">
              <div className="text-xs text-muted-foreground">
                {allItems.length > 0 && "Scroll to see more"}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Organized horizontal layout */}
        <div className="hidden lg:block">
          <div className="flex gap-4 max-w-[600px] max-h-[250px] overflow-hidden">
            {/* Visual Content Section (photos, videos, emotions) */}
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
                      <LiquidAudioPlayer
                        key={item.id}
                        audioUrl={item.audioUrl}
                        title={item.transcript || "Audio Recording"}
                        createdAt={item.createdAt}
                        onDelete={() => removeAudioItem(item.id)}
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

// Export the ref type for parent components to use
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