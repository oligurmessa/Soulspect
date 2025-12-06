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
import { PageLoader } from "@/components/PageLoader"
import { motion, AnimatePresence } from "framer-motion"

// Components
import { Actionbar } from "@/components/actionbar"
import { DatePicker } from "@/components/ui/date-picker"
import { BlockEditor } from "@/components/BlockEditor"
import { VideoRecorder } from "@/components/VideoRecorder"
import { AttachmentTrigger } from "@/components/AttachmentTrigger"
import { AttachmentPanel } from "@/components/AttachmentPanel"
import Button03 from "@/components/AIButton"
import FloatingChatPane from "@/components/FloatingChatPane"

// Services & Utilities
import { reflectionService } from "@/lib/reflectionService"
import { useAuth } from "@/context/AuthContext"
import { uploadImageFile, uploadJournalFile } from "@/lib/dbHelpers"
import { MomentClient, updateUnifiedMoment } from "@/lib/momentClient"
import { Moment } from "@/lib/moments"
import { useAttachments } from "@/hooks/useAttachments"
import { cn } from "@/lib/utils"

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface JournalState {
  id?: string
  title: string
  content: string
  date: Date
  mode: "text" | "video"
  attachments: string[]
  emotions: string[]
  triggers: string[]
  videoUrl?: string
  isDraft: boolean
  updatedAt?: Date
  mood?: number
}

interface MetaState {
  status: "idle" | "editing" | "saving" | "saved" | "error"
  dirty: boolean
  loadingState: "idle" | "loading" | "loaded" | "error"
  loadingError?: string
  isSaving: boolean
}


// =============================================================================
// CONSTANTS
// =============================================================================

const AUTOSAVE_DELAY_MS = 1500
const LOCALSTORAGE_BACKUP_DELAY_MS = 2000

const INITIAL_JOURNAL_STATE: JournalState = {
  title: "",
  content: "",
  date: new Date(),
  mode: "text",
  attachments: [],
  emotions: [],
  triggers: [],
  isDraft: true,
}

const INITIAL_META_STATE: MetaState = {
  status: "idle",
  dirty: false,
  loadingState: "idle",
  isSaving: false,
}

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
  const [journal, setJournal] = useState<JournalState>(INITIAL_JOURNAL_STATE)
  const [meta, setMeta] = useState<MetaState>(INITIAL_META_STATE)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [hasReflections, setHasReflections] = useState(false)
  const [areReflectionsCollapsed, setAreReflectionsCollapsed] = useState(false)
  const [isAttachmentPanelOpen, setIsAttachmentPanelOpen] = useState(false)

  // Attachment management
  const attachments = useAttachments()

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------

  const hasMeaningfulContent = useMemo(() => {
    return (
      journal.title.trim().length > 0 ||
      journal.content.trim().length > 0 ||
      journal.attachments.length > 0 ||
      journal.emotions.length > 0 ||
      videoBlob !== null
    )
  }, [journal.title, journal.content, journal.attachments, journal.emotions, videoBlob])

  const isEditing = useMemo(() => Boolean(journal.id), [journal.id])

  // ---------------------------------------------------------------------------
  // State Update Helpers
  // ---------------------------------------------------------------------------

  const updateJournal = useCallback((updates: Partial<JournalState>) => {
    setJournal(prev => ({ ...prev, ...updates }))
    setMeta(prev => ({
      ...prev,
      dirty: !prev.isSaving,
      status: prev.isSaving ? prev.status : "editing",
    }))
  }, [])


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
  // Persistence Functions
  // ---------------------------------------------------------------------------

  const createJournalDoc = async (journalState: JournalState): Promise<JournalState> => {
    if (!user) throw new Error("User not authenticated")

    // Collect all attachments from the attachments hook
    const allAttachments = [
      ...attachments.photos.filter(p => !p.url.startsWith('blob:')).map(p => p.url),
      ...attachments.audio.map(a => a.audioUrl),
      ...attachments.video.map(v => v.videoUrl),
    ]

    const hasVideo = videoBlob || allAttachments.some(
      url => url.includes("video_") || /\.(mp4|webm|mov|avi)$/.test(url)
    )

    const momentData: Omit<Moment, "id" | "createdAt" | "updatedAt"> = {
      userId: user.uid,
      type: "journal",
      title: journalState.title || "Untitled",
      content: journalState.content || "",
      timestamp: Timestamp.fromDate(journalState.date),
      mood: attachments.mood?.intensity,
      emotions: attachments.mood?.emotions,
      triggers: attachments.mood?.triggers,
      attachments: allAttachments.length > 0 ? allAttachments : undefined,
      journalData: {
        entryType: hasVideo ? "video" : "text",
        isDraft: journalState.isDraft,
      },
    }

    if (videoBlob) {
      const tempId = `temp_${Date.now()}`
      const videoUrl = await uploadJournalFile(user.uid, videoBlob, tempId, "video")
      momentData.attachments = [...(momentData.attachments || []), videoUrl]
      // Add video to attachments hook for future reference
      attachments.addVideo(videoUrl, 0, "Video recording")
    }

    const momentId = await MomentClient.createMoment(momentData, !journalState.isDraft)

    return {
      ...journalState,
      id: momentId,
      updatedAt: new Date(),
    }
  }

  const updateJournalDoc = async (journalState: JournalState, isAutosave = false): Promise<JournalState> => {
    if (!user || !journalState.id) {
      throw new Error("User not authenticated or missing journal ID")
    }

    // Collect all attachments from the attachments hook
    const allAttachments = [
      ...attachments.photos.filter(p => !p.url.startsWith('blob:')).map(p => p.url),
      ...attachments.audio.map(a => a.audioUrl),
      ...attachments.video.map(v => v.videoUrl),
    ]

    const hasVideo = videoBlob || allAttachments.some(
      url => url.includes("video_") || /\.(mp4|webm|mov|avi)$/.test(url)
    )

    const momentData: Omit<Moment, "id" | "createdAt" | "updatedAt"> = {
      userId: user.uid,
      type: "journal",
      title: journalState.title || "Untitled",
      content: journalState.content || "",
      timestamp: Timestamp.fromDate(journalState.date),
      mood: attachments.mood?.intensity,
      emotions: attachments.mood?.emotions,
      triggers: attachments.mood?.triggers,
      attachments: allAttachments.length > 0 ? allAttachments : undefined,
      journalData: {
        entryType: hasVideo ? "video" : "text",
        isDraft: journalState.isDraft,
      },
    }

    if (videoBlob && !allAttachments.some(url => url.includes("video_"))) {
      const videoUrl = await uploadJournalFile(user.uid, videoBlob, journalState.id, "video")
      momentData.attachments = [...(momentData.attachments || []), videoUrl]
      // Add video to attachments hook for future reference
      attachments.addVideo(videoUrl, 0, "Video recording")
    }

    // OPTIMIZATION: Never index on autosave. Only index on manual save/update if not draft.
    const shouldIndex = isAutosave ? false : !journalState.isDraft;
    await updateUnifiedMoment(journalState.id, user.uid, momentData, shouldIndex)

    return {
      ...journalState,
      updatedAt: new Date(),
    }
  }

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

      const moment = await MomentClient.getMoment(entryId, user.uid)

      if (!moment) {
        setMeta(prev => ({ ...prev, loadingError: "Entry not found", loadingState: "error" }))
        toast.error("Entry not found")
        return
      }

      const loadedJournal: JournalState = {
        id: moment.id!,
        title: moment.title || "",
        content: moment.content || "",
        date: moment.timestamp?.toDate?.() || new Date(),
        mode: moment.journalData?.entryType === "video" ? "video" : "text",
        attachments: moment.attachments || [],
        emotions: moment.emotions || [],
        triggers: moment.triggers || [],
        videoUrl: moment.attachments?.find((url: string) => url.includes("video_")),
        isDraft: moment.journalData?.isDraft !== false,
        updatedAt: moment.updatedAt?.toDate?.() || new Date(),
        mood: moment.mood,
      }

      setJournal(loadedJournal)

      // Load attachments into the hook
      attachments.loadFromMoment(moment)

      if (loadedJournal.mode === "video" && loadedJournal.videoUrl) {
        try {
          const response = await fetch(loadedJournal.videoUrl)
          const blob = await response.blob()
          setVideoBlob(blob)
        } catch (error) {
          console.error("Error loading video file:", error)
        }
      }

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


  // Autosave effect
  useEffect(() => {
    if (!meta.dirty || meta.isSaving || !hasMeaningfulContent || !user || meta.loadingState !== "loaded") {
      return
    }

    if (meta.status === "idle" || meta.status === "saved") {
      setMeta(prev => ({ ...prev, status: "editing" }))
    }

    const timeoutId = setTimeout(async () => {
      try {
        setMeta(prev => ({ ...prev, status: "saving", isSaving: true }))

        let updatedJournal: JournalState

        if (!journal.id) {
          updatedJournal = await createJournalDoc(journal)
          setJournal(prev => ({ ...prev, id: updatedJournal.id, updatedAt: updatedJournal.updatedAt }))
        } else {
          // Pass true for isAutosave to skip indexing
          updatedJournal = await updateJournalDoc(journal, true)
          setJournal(prev => ({ ...prev, updatedAt: updatedJournal.updatedAt }))
        }

        setMeta(prev => ({ ...prev, dirty: false, status: "saved", isSaving: false }))
      } catch (error) {
        console.error("Autosave failed:", error)
        setMeta(prev => ({ ...prev, status: "error", isSaving: false }))
      }
    }, AUTOSAVE_DELAY_MS)

    return () => clearTimeout(timeoutId)
  }, [meta.dirty, meta.isSaving, meta.status, meta.loadingState, user, hasMeaningfulContent, journal.id])

  // LocalStorage backup
  useEffect(() => {
    if (!hasMeaningfulContent) return

    const timeoutId = setTimeout(() => {
      try {
        const key = journal.id ? `journal:${journal.id}` : "journal:new"
        localStorage.setItem(key, JSON.stringify({ ...journal, backedUpAt: new Date().toISOString() }))
      } catch (error) {
        console.error("Failed to backup to localStorage:", error)
      }
    }, LOCALSTORAGE_BACKUP_DELAY_MS)

    return () => clearTimeout(timeoutId)
  }, [journal, hasMeaningfulContent])

  // Navigation safety
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (meta.dirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [meta.dirty])

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
        savedJournal = await createJournalDoc(journalToSave)
      } else {
        savedJournal = await updateJournalDoc(journalToSave)
      }

      setJournal(savedJournal)

      const key = savedJournal.id ? `journal:${savedJournal.id}` : "journal:new"
      localStorage.removeItem(key)

      setMeta(prev => ({ ...prev, dirty: false, status: "saved", isSaving: false }))
      toast.success(asDraft ? "Draft saved!" : "Entry published!")

      if (!asDraft) {
        setJournal(INITIAL_JOURNAL_STATE)
        setVideoBlob(null)
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
  // UI Components
  // ---------------------------------------------------------------------------

  /** Status indicator - Minimal, stable, and smart */
  const StatusIndicator = () => {
    // We render a fixed-width container to prevent layout shifts
    return (
      <div className="flex items-center justify-center w-6 h-6 mr-1">
        <AnimatePresence mode="wait">
          {meta.status === "saving" && (
            <motion.div
              key="saving"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
            </motion.div>
          )}

          {meta.status === "editing" && (
            <motion.div
              key="editing"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                  boxShadow: [
                    "0 0 8px rgba(251,191,36,0.5)",
                    "0 0 16px rgba(251,191,36,0.8)",
                    "0 0 8px rgba(251,191,36,0.5)"
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          )}

          {meta.status === "saved" && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { delay: 2 } }} // Fade out after 2s
              onAnimationComplete={() => {
                // Optional: We could set status to idle here if we had access to the setter in a clean way,
                // but visual fade out is sufficient for the user's request.
              }}
            >
              <Check className="w-4 h-4 text-emerald-500/80" strokeWidth={2.5} />
            </motion.div>
          )}

          {meta.status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <AlertCircle className="w-4 h-4 text-red-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
  /** Compact + UI-consistent Save/Update button */
  const SaveButton = () => {
    const isLoading = meta.status === "saving";
    const buttonText = isEditing ? "Update" : "Done";

    return (
      <motion.button
        whileHover={{ scale: isLoading ? 1 : 1.015 }}
        whileTap={{ scale: isLoading ? 1 : 0.985 }}
        onClick={() => handleSave(false)}
        disabled={isLoading || !hasMeaningfulContent}
        className={cn(
          "inline-flex items-center gap-1.5",
          "px-3 py-1.5",
          "rounded-md",
          "text-sm font-medium",
          "transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700",

          isLoading || !hasMeaningfulContent
            ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
            : "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-sm"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <Save className="w-3.5 h-3.5" strokeWidth={2} />
            <span>{buttonText}</span>
          </>
        )}
      </motion.button>
    );
  };

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (meta.loadingState === "loading") {
    return (
      <div className="flex flex-col h-full bg-zinc-50 dark:bg-[#191919]">
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
      <div className="flex flex-col h-full bg-zinc-50 dark:bg-[#191919]">
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
    <div className="relative flex flex-col h-full bg-zinc-50 dark:bg-[#191919]">
      {/* ===================================================================
          HEADER - Clean navigation and actions
          =================================================================== */}
      <header className="flex-shrink-0 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 w-full">
            {/* Title */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Untitled"
                value={journal.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 
                           bg-transparent border-none outline-none placeholder:text-neutral-400 
                           dark:placeholder:text-neutral-600"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <StatusIndicator />
              <DatePicker value={journal.date} onChange={handleDateChange} />

              {/* Attachment Panel */}
              <div className="relative">
                <AttachmentTrigger
                  ref={attachmentTriggerRef}
                  count={attachments.totalCount}
                  isOpen={isAttachmentPanelOpen}
                  onClick={() => setIsAttachmentPanelOpen(!isAttachmentPanelOpen)}
                />
                <AttachmentPanel
                  isOpen={isAttachmentPanelOpen}
                  onClose={() => setIsAttachmentPanelOpen(false)}
                  anchorRef={attachmentTriggerRef}
                  photos={attachments.photos}
                  audio={attachments.audio}
                  video={attachments.video}
                  mood={attachments.mood}
                  onDeletePhoto={attachments.deletePhoto}
                  onDeleteAudio={attachments.deleteAudio}
                  onDeleteVideo={attachments.deleteVideo}
                  onClearMood={attachments.clearMood}
                />
              </div>

              <SaveButton />
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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-48">
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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-48">
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
          <div className="fixed bottom-6 right-4 sm:right-6 z-40">
            <Button03 onToggleChat={() => setIsChatOpen(true)} />
          </div>
        )}

        {/* Bottom Toolbar */}
        <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none">
          <div className="p-3 sm:p-4 max-w-7xl mx-auto">
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