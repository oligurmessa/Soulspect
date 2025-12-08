"use client"

// =============================================================================
// JOURNAL PAGE - Notion-inspired minimal journaling experience
// =============================================================================
// A beautifully designed journaling interface with seamless text/video modes
//
// Architecture:
// - Clean state management with minimal re-renders
// - Automatic cloud persistence with visual feedback
// - Responsive design that adapts to content type
// - Graceful loading and error states
//
// Features:
// - Text editor with AI-powered reflections
// - Video journaling with professional controls
// - Rich media attachments (images, audio, emotions)
// - Real-time autosave with conflict resolution
// - LocalStorage backup for offline resilience
// =============================================================================

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Timestamp } from "firebase/firestore"
import { toast } from "sonner"
import { Save, Check, Loader2, AlertCircle } from "lucide-react"
import { PageLoader } from "@/components/shared/PageLoader"
import { motion, AnimatePresence } from "framer-motion"

// Components
import { Actionbar } from "@/components/features/journal/ActionBar"
import { DatePicker } from "@/components/ui/date-picker"
import MobileNavDropdown from "@/components/MobileNavDropdown"
import { BlockEditor } from "@/components/features/journal/BlockEditor"
import { VideoRecorder } from "@/components/features/journal/VideoRecorder"
import { AttachmentTrigger } from "@/components/features/journal/AttachmentTrigger"
import { AttachmentPanel } from "@/components/features/journal/AttachmentPanel"
import Button03 from "@/components/AIButton"
import FloatingChatPane from "@/components/features/chat/FloatingChatPane"

// Services & Utilities
import { reflectionService } from "@/lib/reflectionService"
import { useAuth } from "@/context/AuthContext"
import { uploadImageFile, uploadJournalFile } from "@/lib/data/legacy/dbHelpers"
import { MomentClient, updateUnifiedMoment } from "@/lib/data/client/moments"
import { Moment } from "@/lib/data/shared/types"
import { useAttachments } from "@/hooks/useAttachments"
import { cn } from "@/lib/utils"
import { AUTOSAVE_DELAY_MS, LOCALSTORAGE_BACKUP_DELAY_MS } from "@/config/constants"

// Type imports
import { JournalState, MetaState, INITIAL_JOURNAL_STATE, INITIAL_META_STATE } from "./types"
import { useJournalState } from "./hooks/useJournalState"
import { useAutoSave } from "./hooks/useAutoSave"
import { StatusIndicator } from "./components/StatusIndicator"
import { SaveButton } from "./components/SaveButton"
import { createJournalDoc, updateJournalDoc, loadEntry as loadEntryUtil, saveToLocalStorage, clearFromLocalStorage } from "./utils/persistence"

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function JournalPage() {
  // ---------------------------------------------------------------------------
  // Hooks & Context
  // ---------------------------------------------------------------------------
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const attachmentTriggerRef = useRef<HTMLButtonElement>(null)
  const blockEditorRef = useRef<{
    addReflection: () => void
    toggleCollapseAll: () => void
  } | null>(null)

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const {
    journal,
    setJournal,
    meta,
    setMeta,
    videoBlob,
    setVideoBlob,
    updateJournal,
    hasMeaningfulContent,
    isEditing,
    resetJournal,
  } = useJournalState()

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [hasReflections, setHasReflections] = useState(false)
  const [areReflectionsCollapsed, setAreReflectionsCollapsed] = useState(false)
  const [isAttachmentPanelOpen, setIsAttachmentPanelOpen] = useState(false)

  // Attachment management
  const attachments = useAttachments()


  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  const handleTitleChange = useCallback((title: string) => {
    updateJournal({ title })
  }, [updateJournal])

  const handleContentChange = useCallback((content: string) => {
    updateJournal({ content })
  }, [updateJournal])

  const handleDateChange = useCallback((date: Date) => {
    updateJournal({ date })
  }, [updateJournal])

  const handleModeChange = useCallback((mode: string) => {
    const normalizedMode = mode === "Type" ? "text" : mode === "Video" ? "video" : mode.toLowerCase()
    if (normalizedMode === "text" || normalizedMode === "video") {
      setJournal(prev => ({ ...prev, mode: normalizedMode }))
    }
  }, [])

  const handleEmotionsChange = useCallback((
    emotions: string[],
    triggers?: string[],
    mood?: number
  ) => {
    updateJournal({
      emotions,
      triggers: triggers || journal.triggers,
      mood: mood !== undefined ? mood : journal.mood,
    })
  }, [updateJournal, journal.triggers, journal.mood])


  // ---------------------------------------------------------------------------
  // Entry Loading
  // ---------------------------------------------------------------------------

  const loadEntry = async (entryId: string) => {
    if (!user) {
      setMeta(prev => ({ ...prev, loadingError: "User not authenticated", loadingState: "error" }))
      return
    }

    try {
      setMeta(prev => ({ ...prev, loadingState: "loading", loadingError: undefined }))

      const { journal: loadedJournal, videoBlob: loadedVideoBlob, moment } = await loadEntryUtil(entryId, user.uid)

      setJournal(loadedJournal)
      setVideoBlob(loadedVideoBlob)

      // Load attachments into the hook
      attachments.loadFromMoment(moment)

      setMeta(prev => ({
        ...prev,
        loadingState: "loaded",
        status: "saved",
        dirty: false,
        isSaving: false,
      }))
    } catch (error) {
      console.error("Error loading moment:", error)
      setMeta(prev => ({ ...prev, loadingError: "Failed to load entry", loadingState: "error" }))
      toast.error("Error loading entry")
    }
  }

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const editParam = searchParams.get("edit")

    if (editParam && user) {
      loadEntry(editParam)
    } else {
      setMeta(prev => ({ ...prev, loadingState: "loaded", status: "idle", dirty: false, isSaving: false }))
      setJournal(INITIAL_JOURNAL_STATE)
    }
  }, [searchParams, user])

  useEffect(() => {
    sessionStorage.removeItem("carouselToLoad")
    localStorage.removeItem("editingEntry")

    const editParam = searchParams.get("edit")
    if (!editParam) {
      localStorage.removeItem("journal:new")
    }
  }, [searchParams])


  // Use the autosave hook
  useAutoSave({
    journal,
    meta,
    videoBlob,
    userId: user?.uid,
    hasMeaningfulContent,
    setJournal,
    setMeta,
    attachments
  })

  // Cleanup
  useEffect(() => {
    return () => {
      attachments.clearAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  const handleVideoRecording = useCallback((blob: Blob) => {
    setVideoBlob(blob)
    // Video will be uploaded and added to attachments during save
    setMeta(prev => ({ ...prev, dirty: true, status: "editing" }))
  }, [])

  const handleImageAttach = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith("image/")) {
        attachments.addPhoto(file, handleImageUpload)
      }
    })
    setIsAttachmentPanelOpen(true) // Auto-open
    setMeta(prev => ({ ...prev, dirty: true, status: "editing" }))
  }, [attachments])

  const handleAudioRecorded = useCallback(async (audioBlob: Blob, transcript?: string) => {
    if (!user) return

    try {
      let entryId = journal.id

      if (!entryId) {
        const momentData: Omit<Moment, "id" | "createdAt" | "updatedAt"> = {
          userId: user.uid,
          type: "journal",
          title: journal.title.trim() || "Untitled",
          content: journal.content.trim(),
          timestamp: Timestamp.fromDate(journal.date),
          journalData: { entryType: journal.mode, isDraft: true },
        }

        entryId = await MomentClient.createMoment(momentData, false)
        updateJournal({ id: entryId })
      }

      if (entryId) {
        const audioUrl = await uploadJournalFile(user.uid, audioBlob, entryId, "voice")
        updateJournal({ attachments: [...journal.attachments, audioUrl] })
        attachments.addAudio(audioUrl, transcript || "Audio Recording", 0)
        setIsAttachmentPanelOpen(true) // Auto-open
      }
    } catch (error) {
      console.error("Error uploading audio:", error)
      setMeta(prev => ({ ...prev, dirty: true, status: "editing" }))
    }
  }, [user, journal.id, journal.title, journal.content, journal.date, journal.mode, journal.attachments, updateJournal])

  const handleEmotionLogged = useCallback((
    emotion: string,
    intensity: number,
    note?: string,
    emotions?: string[],
    triggers?: string[]
  ) => {
    handleEmotionsChange(emotions || [emotion], triggers || [], intensity)
    attachments.setMood({
      emotion,
      intensity,
      emotions: emotions || [emotion],
      triggers: triggers || []
    })
    setIsAttachmentPanelOpen(true) // Auto-open
  }, [handleEmotionsChange, attachments])

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    if (!user) throw new Error("User not authenticated")
    if (meta.loadingState !== "loaded") throw new Error("Page still loading")

    try {
      let entryId = journal.id

      if (!entryId) {
        const momentData: Omit<Moment, "id" | "createdAt" | "updatedAt"> = {
          userId: user.uid,
          type: "journal",
          title: journal.title.trim() || "Untitled",
          content: journal.content.trim(),
          timestamp: Timestamp.fromDate(journal.date),
          journalData: { entryType: journal.mode, isDraft: true },
        }

        entryId = await MomentClient.createMoment(momentData, false)
        updateJournal({ id: entryId })
      }

      if (!entryId) throw new Error("Failed to create entry for image upload")

      const uploadedUrl = await uploadImageFile(user.uid, file, entryId)

      setJournal(prev => ({ ...prev, attachments: [...prev.attachments, uploadedUrl] }))
      if (!meta.isSaving) {
        setMeta(prev => ({ ...prev, dirty: true, status: "editing" }))
      }

      return uploadedUrl
    } catch (error) {
      console.error("Error in handleImageUpload:", error)
      throw error instanceof Error ? error : new Error("Image upload failed")
    }
  }, [user, meta.loadingState, meta.isSaving, journal.id, journal.title, journal.content, journal.date, journal.mode, updateJournal])

  const handleSave = useCallback(async (asDraft = false) => {
    if (!user) {
      toast.error("You must be logged in to save")
      return
    }

    if (!hasMeaningfulContent) {
      toast.error("Please add some content before saving")
      return
    }

    try {
      setMeta(prev => ({ ...prev, status: "saving", isSaving: true }))

      const journalToSave = { ...journal, isDraft: asDraft }
      let savedJournal: JournalState

      if (!journal.id) {
        savedJournal = await createJournalDoc(journalToSave, user.uid, videoBlob, attachments)
      } else {
        savedJournal = await updateJournalDoc(journalToSave, user.uid, videoBlob, attachments, false)
      }

      setJournal(savedJournal)

      clearFromLocalStorage(savedJournal)

      setMeta(prev => ({ ...prev, dirty: false, status: "saved", isSaving: false }))
      toast.success(asDraft ? "Draft saved!" : "Entry published!")

      if (!asDraft) {
        resetJournal()
        attachments.clearAll()
        router.replace("/dashboard/journal")
      }
    } catch (error) {
      console.error("Error saving:", error)
      setMeta(prev => ({ ...prev, status: "error", isSaving: false }))
      toast.error("Failed to save. Please try again.")
    }
  }, [user, hasMeaningfulContent, journal, router])


  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (meta.loadingState === "loading") {
    return (
      <div className="flex flex-col h-dvh bg-zinc-50 dark:bg-[#191919]">
        <div className="flex-shrink-0 px-4 sm:px-8 py-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
              <div className="h-9 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        <PageLoader message="Loading your entry..." />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  if (meta.loadingState === "error") {
    return (
      <div className="flex flex-col h-dvh bg-zinc-50 dark:bg-[#191919]">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Unable to Load Entry
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">
              {meta.loadingError || "Something went wrong. Please try again."}
            </p>
            <button
              onClick={() => router.push("/dashboard/journal")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Back to Journal
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------

  return (
    <div className="relative flex flex-col h-dvh overflow-hidden bg-zinc-50 dark:bg-[#191919]">
      {/* ===================================================================
          HEADER - Clean navigation and actions
          =================================================================== */}
      <header className="flex-shrink-0 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm z-20">
        <div className="px-3 py-3 sm:px-6 lg:px-8 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4 w-full">
            {/* Mobile Nav Trigger */}
            <div className="lg:hidden flex-shrink-0">
              <MobileNavDropdown currentPage="log" />
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Untitled"
                value={journal.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full text-lg sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 
                           bg-transparent border-none outline-none placeholder:text-neutral-400 
                           dark:placeholder:text-neutral-600 truncate"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <StatusIndicator meta={meta} />
              <DatePicker value={journal.date} onChange={handleDateChange} />

              {/* Attachment Panel Wrapper */}
              <div className="relative">
                <AttachmentPanel
                  isOpen={isAttachmentPanelOpen}
                  onClose={() => setIsAttachmentPanelOpen(false)}
                  photos={attachments.photos}
                  audio={attachments.audio}
                  video={attachments.video}
                  mood={attachments.mood}
                  onDeletePhoto={attachments.deletePhoto}
                  onDeleteAudio={attachments.deleteAudio}
                  onDeleteVideo={attachments.deleteVideo}
                  onClearMood={attachments.clearMood}
                  onAddPhoto={() => document.getElementById('photo-upload')?.click()}
                  onAddVideo={() => document.getElementById('video-upload')?.click()}
                  // Audio usually requires a recorder interface, omitting for now or adding later
                  onAddAudio={() => console.log("Add audio clicked")}
                  onAddMood={() => console.log("Add mood clicked")}
                >
                  <AttachmentTrigger
                    count={attachments.totalCount}
                    isOpen={isAttachmentPanelOpen}
                    onClick={() => setIsAttachmentPanelOpen(!isAttachmentPanelOpen)}
                  />
                </AttachmentPanel>
              </div>

              {/* Hidden Inputs for Attachments */}
              <input
                type="file"
                id="photo-upload"
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files?.length) {
                    Array.from(e.target.files).forEach(file => attachments.addPhoto(file));
                    e.target.value = ''; // Reset
                  }
                }}
              />
              <input
                type="file"
                id="video-upload"
                className="hidden"
                accept="video/*"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    const file = e.target.files[0];
                    const url = URL.createObjectURL(file);
                    // Video duration usually needs metadata loading, passing 0 for now or handling async
                    attachments.addVideo(url, 0, file.name);
                    e.target.value = '';
                  }
                }}
              />

              <SaveButton
                isEditing={isEditing}
                meta={meta}
                hasMeaningfulContent={hasMeaningfulContent}
                onClick={() => handleSave(false)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ===================================================================
          CONTENT AREA
          =================================================================== */}
      <main className="flex-1 relative overflow-hidden">
        {/* Text Mode */}
        {journal.mode === "text" && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-48">
              <BlockEditor
                value={journal.content}
                onChange={handleContentChange}
                placeholder="Start writing your thoughts..."
                generateReflection={async (context) => {
                  return await reflectionService.generateReflection(context, user?.uid)
                }}
                editorRef={blockEditorRef}
                onReflectionStateChange={(has, collapsed) => {
                  setHasReflections(has)
                  setAreReflectionsCollapsed(collapsed)
                }}
              />
            </div>
          </div>
        )}

        {/* Video Mode - Contained Layout */}
        {journal.mode === "video" && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-48">
              {/* Video recorder container */}
              <div className="aspect-video w-full max-w-3xl mx-auto rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
                <VideoRecorder
                  key={`video-recorder-${journal.mode}`}
                  onRecordingComplete={handleVideoRecording}
                  onDone={() => {
                    setJournal(prev => ({ ...prev, mode: "text" }))
                    setVideoBlob(null)
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            FLOATING ELEMENTS - Always visible
            =================================================================== */}
        {/* AI Chat Button */}
        {!isChatOpen && (
          <div className="absolute bottom-24 sm:bottom-6 right-4 sm:right-6 z-40">
            <Button03 onToggleChat={() => setIsChatOpen(true)} />
          </div>
        )}

        {/* Bottom Toolbar */}
        <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
          {/* Gradient backdrop for better readability over content */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-50 via-zinc-50/90 to-transparent dark:from-[#191919] dark:via-[#191919]/90 pointer-events-none" />

          <div className="relative p-3 sm:p-4 max-w-7xl mx-auto">
            {/* Actionbar */}
            <div className="flex justify-center pointer-events-auto">
              <Actionbar
                selectedMode={journal.mode === "text" ? "Type" : "Video"}
                onModeChange={handleModeChange}
                onToolbarClick={() => { }}
                onImageAttach={handleImageAttach}
                onAudioRecorded={handleAudioRecorded}
                onEmotionLogged={handleEmotionLogged}
                alwaysShowAllButtons={true}
                onPromptClick={() => blockEditorRef.current?.addReflection()}
                isReflectionsCollapsed={areReflectionsCollapsed}
                onToggleReflectionsCollapse={() => blockEditorRef.current?.toggleCollapseAll()}
                hasReflections={hasReflections}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ===================================================================
          FLOATING CHAT PANE
          =================================================================== */}
      <FloatingChatPane isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}