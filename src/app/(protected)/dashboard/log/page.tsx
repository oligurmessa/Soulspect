"use client"
import { Actionbar } from "@/components/actionbar"
import { useState, useRef, useEffect } from "react"
import { DatePicker } from "@/components/ui/date-picker"
import { TextEditorWrapper as MinimalTextEditor } from "@/components/text_editor"
import { VideoRecorder } from "@/components/VideoRecorder"
import ItemCarousel, { type ItemCarouselRef } from "@/components/ItemCarousel"
import { useAuth } from "@/context/AuthContext"
import { uploadJournalImage, uploadImageFile, uploadJournalFile, loadEntryForEdit } from "@/lib/dbHelpers"
import { MomentClient, createUnifiedMoment, updateUnifiedMoment } from "@/lib/momentClient"
import { Moment } from "@/lib/moments"
import { Timestamp } from "firebase/firestore"
import { toast } from "sonner"
import { useSearchParams, useRouter } from "next/navigation"
import Button03 from "@/components/AIButton"
import MotionButton03 from "@/components/MotionButton03"
import ThreeDotsMenu from "@/components/ThreeDotsMenu"
import FloatingChatPane from "@/components/FloatingChatPane"

export default function JournalPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const itemCarouselRef = useRef<ItemCarouselRef>(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const [title, setTitle] = useState("untitled")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedMode, setSelectedMode] = useState<string>("Type")
  const [content, setContent] = useState<string>("")
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [initialState, setInitialState] = useState({
    title: "untitled",
    content: "",
    videoBlob: null as Blob | null
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [isAutosaving, setIsAutosaving] = useState(false)
  
  // Unified loading state
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [loadingError, setLoadingError] = useState<string | null>(null)
  
  // Store carousel data to load after component mounts
  const [pendingCarouselData, setPendingCarouselData] = useState<any>(null)
  
  // Chat pane state
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Unified entry loading function
  const loadEntryData = async (entryId: string) => {
    if (!user) {
      setLoadingError('User not authenticated');
      setLoadingState('error');
      return;
    }

    try {
      setLoadingState('loading');
      setLoadingError(null);
      
      console.log('Loading entry for edit:', entryId);
      const entry = await loadEntryForEdit(user.uid, entryId);
      
      if (!entry) {
        setLoadingError('Entry not found');
        setLoadingState('error');
        toast.error("Entry not found");
        return;
      }

      // Set basic form data
      setTitle(entry.title || "untitled");
      setContent(entry.content || "");
      setSelectedDate(entry.date instanceof Date ? entry.date : entry.date?.toDate?.() || new Date());
      setSelectedMode(entry.entryType === 'video' ? 'Video' : 'Type');
      setIsEditing(true);
      setEditingEntryId(entry.id!);
      setCurrentEntryId(entry.id!);
      
      // Update initial state
      setInitialState({
        title: entry.title || "untitled",
        content: entry.content || "",
        videoBlob: null
      });

      // Store carousel content to load after component is ready
      if (entry.carouselContent) {
        setPendingCarouselData(entry.carouselContent);
      }
      
      // Handle video file if present
      if (entry.entryType === 'video' && entry.attachments && entry.attachments.length > 0) {
        const videoUrl = entry.attachments.find((url: string) => url.includes('video_'));
        if (videoUrl) {
          try {
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            setVideoBlob(blob);
            console.log('Video blob loaded for editing');
          } catch (error) {
            console.error('Error loading video file:', error);
          }
        }
      }
      
      setLoadingState('loaded');
      console.log('Entry loaded successfully');
      
    } catch (error) {
      console.error('Error loading entry for edit:', error);
      setLoadingError('Failed to load entry');
      setLoadingState('error');
      toast.error("Error loading entry for editing");
    }
  };

  // Load editing data when component mounts
  useEffect(() => {
    const editParam = searchParams.get('edit');
    
    if (editParam && user) {
      loadEntryData(editParam);
    } else {
      // No edit parameter - set up for new entry
      setLoadingState('loaded');
      setIsEditing(false);
      setEditingEntryId(null);
      setCurrentEntryId(null);
    }
  }, [searchParams, user])

  // Cleanup sessionStorage on mount (remove legacy storage)
  useEffect(() => {
    sessionStorage.removeItem('carouselToLoad');
    localStorage.removeItem('editingEntry');
  }, [])

  // Load carousel content when component is ready
  useEffect(() => {
    if (!pendingCarouselData || !itemCarouselRef.current || !isEditing) return;

    console.log('Loading pending carousel data:', pendingCarouselData);

    // Load photos
    if (pendingCarouselData.photos?.length > 0) {
      console.log('Loading photos:', pendingCarouselData.photos);
      pendingCarouselData.photos.forEach((photo: any) => {
        itemCarouselRef.current?.addPhotoFromDataUrl(
          photo.url, 
          photo.name, 
          photo.caption
        );
      });
    }

    // Load emotions
    if (pendingCarouselData.emotions?.length > 0) {
      console.log('Loading emotions:', pendingCarouselData.emotions);
      pendingCarouselData.emotions.forEach((emotion: any) => {
        itemCarouselRef.current?.addEmotion(
          emotion.emotion,
          emotion.intensity,
          emotion.note,
          emotion.emotions,
          emotion.triggers
        );
      });
    }

    // Load audio recordings
    if (pendingCarouselData.audioRecordings?.length > 0) {
      console.log('Loading audio recordings:', pendingCarouselData.audioRecordings);
      pendingCarouselData.audioRecordings.forEach((audio: any) => {
        itemCarouselRef.current?.addAudioFromUrl(
          audio.audioUrl || '',
          audio.transcript || 'Audio Recording',
          audio.duration,
          new Date(audio.createdAt)
        );
      });
    }

    // Clear pending data after loading
    setPendingCarouselData(null);
    console.log('Carousel data loaded successfully');
  }, [pendingCarouselData, isEditing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear carousel items to prevent memory leaks
      itemCarouselRef.current?.clearAllItems();
    };
  }, [])

  const handleVideoRecording = (videoBlob: Blob, duration: number) => {
    setVideoBlob(videoBlob)
    console.log("Video recorded:", videoBlob, duration)
  }

  // Optimized change tracking - separate effects to prevent cross-dependencies
  useEffect(() => {
    const titleChanged = title !== initialState.title
    const contentChanged = content !== initialState.content
    const videoChanged = videoBlob !== initialState.videoBlob
    const hasChanges = titleChanged || contentChanged || videoChanged
    
    setHasUnsavedChanges(hasChanges)
  }, [title, initialState.title, content, initialState.content, videoBlob, initialState.videoBlob])


  // Draft creation system - only for new entries (not editing) - CREATE MOMENTS
  useEffect(() => {
    if (!user || loadingState !== 'loaded') return;
    
    // STRICT: Don't autosave if we're editing an existing entry OR already have an entry ID
    if (isEditing || currentEntryId) return;
    
    // Don't create draft for just default "untitled" - need actual content
    const hasMeaningfulContent = (title.trim() && title.trim() !== "untitled") || content.trim() || videoBlob;
    if (!hasMeaningfulContent) return;
    
    // Only create draft if we truly have no entry ID and are not editing
    const createDraft = async () => {
      try {
        setIsAutosaving(true);
        
        // Create moment instead of journal entry
        const momentData: Omit<Moment, 'id' | 'createdAt' | 'updatedAt'> = {
          userId: user.uid,
          type: 'journal',
          title: title.trim(),
          content: content.trim(),
          timestamp: Timestamp.fromDate(selectedDate),
          journalData: {
            entryType: selectedMode.toLowerCase() as 'text' | 'video',
            isDraft: true
          }
        };
        
        const momentId = await MomentClient.createMoment(momentData, false); // Don't index draft yet
        setCurrentEntryId(momentId);
        console.log('Draft moment created:', momentId);
      } catch (error) {
        console.error('Error creating draft moment:', error);
      } finally {
        setIsAutosaving(false);
      }
    };
    
    createDraft();
  }, [user, title, content, videoBlob, selectedMode, selectedDate, currentEntryId, isEditing, loadingState])

  // Separate autosave for title changes only - UPDATE MOMENTS
  useEffect(() => {
    if (!user || !currentEntryId || loadingState !== 'loaded') return;
    if (isEditing) return; // Don't autosave when editing existing entries
    
    const timeoutId = setTimeout(async () => {
      try {
        setIsAutosaving(true);
        await updateUnifiedMoment(currentEntryId, user.uid, {
          title: title.trim()
        }, false); // Don't re-index for title changes
        console.log('Autosaved title for moment:', currentEntryId);
      } catch (error) {
        console.error('Error autosaving title:', error);
      } finally {
        setIsAutosaving(false);
      }
    }, 1000); // Shorter debounce for title only
    
    return () => clearTimeout(timeoutId);
  }, [user, title, currentEntryId, isEditing, loadingState])

  // Separate autosave for content changes only - UPDATE MOMENTS
  useEffect(() => {
    if (!user || !currentEntryId || loadingState !== 'loaded') return;
    if (isEditing) return; // Don't autosave when editing existing entries
    
    const timeoutId = setTimeout(async () => {
      try {
        setIsAutosaving(true);
        await updateUnifiedMoment(currentEntryId, user.uid, {
          content: content.trim()
        }, false); // Don't re-index for content changes alone
        console.log('Autosaved content for moment:', currentEntryId);
      } catch (error) {
        console.error('Error autosaving content:', error);
      } finally {
        setIsAutosaving(false);
      }
    }, 1500); // Medium debounce for content
    
    return () => clearTimeout(timeoutId);
  }, [user, content, currentEntryId, isEditing, loadingState])

  // Separate autosave for other changes (mode, date, video) - UPDATE MOMENTS
  useEffect(() => {
    if (!user || !currentEntryId || loadingState !== 'loaded') return;
    if (isEditing) return; // Don't autosave when editing existing entries
    
    const timeoutId = setTimeout(async () => {
      try {
        setIsAutosaving(true);
        
        // Get carousel items for autosave
        const carouselItems = itemCarouselRef.current?.getAllItems() || {
          photos: [],
          emotions: [],
          audioRecordings: []
        };
        
        // Extract emotions and metadata for moment
        const emotions = carouselItems.emotions.map(e => e.emotion);
        const triggers = carouselItems.emotions.flatMap(e => e.triggers || []);
        const moodValues = carouselItems.emotions.map(e => e.intensity);
        const averageMood = moodValues.length > 0 ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length : undefined;
        
        // Prepare attachments (photos and audio URLs)
        const attachments = [
          ...carouselItems.photos.map(p => p.url).filter(url => !url.startsWith('data:')),
          ...carouselItems.audioRecordings.map(a => a.audioUrl).filter(Boolean)
        ];
        
        await updateUnifiedMoment(currentEntryId, user.uid, {
          timestamp: { toDate: () => selectedDate } as any,
          mood: averageMood,
          emotions: emotions.length > 0 ? emotions : undefined,
          triggers: triggers.length > 0 ? [...new Set(triggers)] : undefined,
          attachments: attachments.length > 0 ? attachments : undefined,
          journalData: {
            entryType: selectedMode.toLowerCase() as 'text' | 'video',
            isDraft: true
          }
        }, false); // Don't re-index during autosave
        
        console.log('Autosaved metadata for moment:', currentEntryId);
      } catch (error) {
        console.error('Error autosaving metadata:', error);
      } finally {
        setIsAutosaving(false);
      }
    }, 2000); // Longer debounce for carousel/metadata
    
    return () => clearTimeout(timeoutId);
  }, [user, videoBlob, selectedMode, selectedDate, currentEntryId, isEditing, loadingState])

  const handleSaveJournal = async (saveAsDraft = false) => {
    if (!user) {
      toast.error("You must be logged in to save journal entries")
      return
    }

    // Check if there's any content to save
    const carouselItems = itemCarouselRef.current?.getAllItems() || {
      photos: [],
      emotions: [],
      audioRecordings: []
    }
    
    const hasContent = title.trim() || 
                      content.trim() || 
                      videoBlob || 
                      carouselItems.photos.length > 0 ||
                      carouselItems.emotions.length > 0 ||
                      carouselItems.audioRecordings.length > 0

    if (!hasContent) {
      toast.error("Please add some content before saving")
      return
    }

    setIsSaving(true)
    try {
      // Create/update moment in unified system
      if (currentEntryId || editingEntryId) {
        const momentId = currentEntryId || editingEntryId!;
        
        // Extract emotions from carousel for moment metadata
        const emotions = carouselItems.emotions.map(e => e.emotion);
        const triggers = carouselItems.emotions.flatMap(e => e.triggers || []);
        const moodValues = carouselItems.emotions.map(e => e.intensity);
        const averageMood = moodValues.length > 0 ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length : undefined;
        
        // Prepare attachments
        let attachments: string[] = [];
        if (videoBlob) {
          const videoUrl = await uploadJournalFile(user.uid, videoBlob, momentId, 'video');
          attachments.push(videoUrl);
        }
        
        // Add photo URLs to attachments
        attachments.push(...carouselItems.photos.map(p => p.url).filter(url => !url.startsWith('data:')));
        
        // Add audio URLs to attachments
        attachments.push(...carouselItems.audioRecordings.map(a => a.audioUrl).filter(Boolean));
        
        // Create comprehensive moment data
        const momentData: Omit<Moment, 'id' | 'createdAt' | 'updatedAt'> = {
          userId: user.uid,
          type: 'journal',
          title: title.trim() || "Untitled Entry",
          content: content || "",
          timestamp: Timestamp.fromDate(selectedDate),
          mood: averageMood,
          emotions: emotions.length > 0 ? emotions : undefined,
          triggers: triggers.length > 0 ? [...new Set(triggers)] : undefined, // Remove duplicates
          attachments: attachments.length > 0 ? attachments : undefined,
          journalData: {
            entryType: selectedMode.toLowerCase() as 'text' | 'video',
            isDraft: saveAsDraft
          }
        };
        
        // Update existing moment or create new if finalizing
        if (!saveAsDraft) {
          try {
            // Update the existing moment and mark as published
            await updateUnifiedMoment(momentId, user.uid, {
              ...momentData,
              journalData: {
                ...momentData.journalData!,
                isDraft: false
              }
            }, true); // Index for search when published
            console.log('Moment published and indexed');
          } catch (error) {
            console.error('Error updating/publishing moment:', error);
            throw error;
          }
        } else {
          // Just update as draft
          await updateUnifiedMoment(momentId, user.uid, momentData, false);
        }
        
        toast.success(isEditing ? 
          (saveAsDraft ? "Draft updated!" : "Entry updated!") : 
          (saveAsDraft ? "Draft saved!" : "Entry published!"));
      } else {
        // Fallback - create new moment directly
        console.log('Creating new moment directly');
        
        // Extract emotion data
        const emotions = carouselItems.emotions.map(e => e.emotion);
        const triggers = carouselItems.emotions.flatMap(e => e.triggers || []);
        const moodValues = carouselItems.emotions.map(e => e.intensity);
        const averageMood = moodValues.length > 0 ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length : undefined;
        
        // Prepare attachments
        let attachments: string[] = [];
        if (videoBlob) {
          // Create temporary entry ID for file upload
          const tempId = `temp_${Date.now()}`;
          const videoUrl = await uploadJournalFile(user.uid, videoBlob, tempId, 'video');
          attachments.push(videoUrl);
        }
        
        // Add photo and audio URLs
        attachments.push(...carouselItems.photos.map(p => p.url).filter(url => !url.startsWith('data:')));
        attachments.push(...carouselItems.audioRecordings.map(a => a.audioUrl).filter(Boolean));
        
        const momentData: Omit<Moment, 'id' | 'createdAt' | 'updatedAt'> = {
          userId: user.uid,
          type: 'journal',
          title: title.trim() || "Untitled Entry",
          content: content || "",
          timestamp: Timestamp.fromDate(selectedDate),
          mood: averageMood,
          emotions: emotions.length > 0 ? emotions : undefined,
          triggers: triggers.length > 0 ? [...new Set(triggers)] : undefined,
          attachments: attachments.length > 0 ? attachments : undefined,
          journalData: {
            entryType: selectedMode.toLowerCase() as 'text' | 'video',
            isDraft: saveAsDraft
          }
        };
        
        await MomentClient.createMoment(momentData, !saveAsDraft); // Only index published moments
        toast.success(saveAsDraft ? "Draft saved!" : "Entry published!");
      }
      
      // Reset form for new entry (only if not saving as draft)
      if (!saveAsDraft) {
        const newInitialState = {
          title: "untitled",
          content: "",
          videoBlob: null as Blob | null
        }
        setTitle(newInitialState.title)
        setContent(newInitialState.content)
        setVideoBlob(newInitialState.videoBlob)
        setSelectedDate(new Date())
        setInitialState(newInitialState)
        setHasUnsavedChanges(false)
        setIsEditing(false)
        setEditingEntryId(null)
        setCurrentEntryId(null)
        
        // Clear all carousel items
        itemCarouselRef.current?.clearAllItems()
        
        // Navigate to journals page after successful save
        // Use router.replace to prevent back button issues
        router.replace('/dashboard/journal')
      }
      
    } catch (error) {
      console.error("Error saving journal entry:", error)
      toast.error("Failed to save journal entry. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleModeChange = (mode: string) => {
    setSelectedMode(mode)
  }


  const handleImageAttach = (files: FileList) => {
    // Add images to the carousel
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/') && itemCarouselRef.current) {
        itemCarouselRef.current.addPhotoFromFile(file)
      }
    })
    
    // Mark as having changes since content was added
    if (files.length > 0) {
      setHasUnsavedChanges(true)
    }
  }

  const handleAudioRecorded = async (audioBlob: Blob, transcript?: string) => {
    if (!user) return;

    try {
      // Upload audio immediately like images
      let entryId = currentEntryId || editingEntryId;
      
      // Create moment if needed (for new entries)
      if (!entryId && !isEditing) {
        const momentData: Omit<Moment, 'id' | 'createdAt' | 'updatedAt'> = {
          userId: user.uid,
          type: 'journal',
          title: title.trim() || "untitled",
          content: content.trim(),
          timestamp: Timestamp.fromDate(selectedDate),
          journalData: {
            entryType: selectedMode.toLowerCase() as 'text' | 'video',
            isDraft: true
          }
        };
        
        entryId = await MomentClient.createMoment(momentData, false);
        setCurrentEntryId(entryId);
      }
      
      if (entryId) {
        // Upload audio to Firebase Storage immediately
        const audioUrl = await uploadJournalFile(user.uid, audioBlob, entryId, 'voice');
        
        // Add to carousel with URL (not blob)
        if (itemCarouselRef.current) {
          itemCarouselRef.current.addAudioFromUrl(audioUrl, transcript || 'Audio Recording', 0, new Date());
        }
      } else {
        // Fallback to local blob if no entry ID
        if (itemCarouselRef.current) {
          itemCarouselRef.current.addAudioRecording(audioBlob, transcript);
        }
      }
      
      // Mark as having changes
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error uploading audio:', error);
      // Fallback to local blob if upload fails
      if (itemCarouselRef.current) {
        itemCarouselRef.current.addAudioRecording(audioBlob, transcript);
      }
      setHasUnsavedChanges(true);
    }
  }

  const handleEmotionLogged = (emotion: string, intensity: number, note?: string, emotions?: string[], triggers?: string[]) => {
    // Add the emotion to the carousel
    if (itemCarouselRef.current) {
      itemCarouselRef.current.addEmotion(emotion, intensity, note, emotions, triggers)
    }
    
    // Mark as having changes since content was added
    setHasUnsavedChanges(true)
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    console.log('handleImageUpload called with file:', file.name);
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (loadingState !== 'loaded') {
      throw new Error('Page still loading, please wait');
    }
    
    try {
      // If no current entry exists, create a draft moment first
      let entryId = currentEntryId || editingEntryId;
      console.log('Current entry ID:', entryId, 'isEditing:', isEditing);
      
      if (!entryId && !isEditing) {
        console.log('Creating new draft moment for image upload...');
        
        const momentData: Omit<Moment, 'id' | 'createdAt' | 'updatedAt'> = {
          userId: user.uid,
          type: 'journal',
          title: title.trim() || "untitled",
          content: content.trim(),
          timestamp: Timestamp.fromDate(selectedDate),
          journalData: {
            entryType: selectedMode.toLowerCase() as 'text' | 'video',
            isDraft: true
          }
        };
        
        entryId = await MomentClient.createMoment(momentData, false); // Don't index draft
        console.log('Created draft moment:', entryId);
        setCurrentEntryId(entryId);
      }
      
      if (!entryId) {
        throw new Error('Failed to create or get entry ID for image upload');
      }
      
      console.log('Uploading image to Firebase Storage...');
      const uploadedUrl = await uploadImageFile(user.uid, file, entryId);
      console.log('Upload complete:', uploadedUrl);
      return uploadedUrl;
    } catch (error) {
      console.error('Error in handleImageUpload:', error);
      // Re-throw with more context if needed
      if (error instanceof Error) {
        throw new Error(`Image upload failed: ${error.message}`);
      }
      throw new Error('Image upload failed: Unknown error');
    }
  }

  // Navigation safety - warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Show loading state
  if (loadingState === 'loading') {
    return (
      <div className="relative flex flex-col h-full">
        <div className="flex-shrink-0 px-6 py-4 border-b border-border">
          <div className="flex justify-between items-center w-full">
            <div className="flex-1 mr-6">
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading entry...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (loadingState === 'error') {
    return (
      <div className="relative flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Entry</h2>
            <p className="text-gray-500 mb-4">{loadingError}</p>
            <button
              onClick={() => router.push('/dashboard/journal')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Back to Journal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* Header with Title, Calendar, and Save Actions */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex justify-between items-center w-full">
          {/* Left side - Title input taking most space */}
          <div className="flex-1 mr-6">
            <input
              type="text"
              placeholder="untitled"
              className="text-2xl font-bold text-foreground bg-transparent border-none focus:outline-none w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {isEditing && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md font-medium">
                Editing
              </span>
            )}
            <DatePicker value={selectedDate} onChange={setSelectedDate} />
            <ThreeDotsMenu 
              onMenuItemClick={(action) => {
                switch (action) {
                  case "export":
                    toast.info("Export functionality coming soon");
                    break;
                  case "duplicate":
                    toast.info("Duplicate functionality coming soon");
                    break;
                  case "delete":
                    toast.info("Delete functionality coming soon");
                    break;
                }
              }}
            />
            <MotionButton03
              key={isEditing ? "editing" : "new"}
              initialState={
                isEditing 
                  ? "update"
                  : "done"
              }
              onLoad={async () => {
                await handleSaveJournal(false);
              }}
              loadingDuration={1500}
            >
              {isEditing ? "Update" : "Done"}
            </MotionButton03>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="p-6">
          {selectedMode === "Type" && (() => {
            console.log('Rendering TextEditor with content:', content);
            console.log('Content type:', typeof content);
            console.log('Content length:', content?.length);
            console.log('Is editing mode:', isEditing);
            return (
              <div className="w-full max-w-3xl mx-auto">
                <MinimalTextEditor content={content} onContentChange={setContent} />
              </div>
            );
          })()}
          
          
          {selectedMode === "Video" && (
            <div className="w-full max-w-3xl mx-auto">
              <VideoRecorder onRecordingComplete={handleVideoRecording} />
            </div>
          )}
        </div>
              <div className="fixed bottom-8 right-8 z-50">
        <Button03 onToggleChat={() => setIsChatOpen(!isChatOpen)} />
      </div>
      </div>

      {/* Actionbar */}
      <Actionbar 
        selectedMode={selectedMode}
        onModeChange={handleModeChange}
        onToolbarClick={() => setShowToolbar(!showToolbar)}
        onImageAttach={handleImageAttach}
        onAudioRecorded={handleAudioRecorded}
        onEmotionLogged={handleEmotionLogged}
        itemCarouselRef={itemCarouselRef}
      />

      {/* Item Carousel - positioned in bottom-left corner */}
      <ItemCarousel 
        ref={itemCarouselRef} 
        onImageUpload={handleImageUpload}
        userId={user?.uid}
        entryId={currentEntryId || editingEntryId}
      />

      {/* Floating Chat Pane */}
      <FloatingChatPane 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </div>
  )
}