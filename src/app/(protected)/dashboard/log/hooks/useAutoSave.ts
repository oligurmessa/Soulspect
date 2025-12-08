import { useEffect } from "react"
import { JournalState, MetaState } from "../types"
import { createJournalDoc, updateJournalDoc, saveToLocalStorage } from "../utils/persistence"
import { AUTOSAVE_DELAY_MS, LOCALSTORAGE_BACKUP_DELAY_MS } from "@/config/constants"
import type { UseAttachmentsReturn } from "@/hooks/useAttachments"

interface UseAutoSaveParams {
  journal: JournalState
  meta: MetaState
  videoBlob: Blob | null
  userId: string | undefined
  hasMeaningfulContent: boolean
  setJournal: (value: JournalState | ((prev: JournalState) => JournalState)) => void
  setMeta: (value: MetaState | ((prev: MetaState) => MetaState)) => void
  attachments: UseAttachmentsReturn
}

export const useAutoSave = ({
  journal,
  meta,
  videoBlob,
  userId,
  hasMeaningfulContent,
  setJournal,
  setMeta,
  attachments
}: UseAutoSaveParams) => {
  // Autosave effect
  useEffect(() => {
    if (!meta.dirty || meta.isSaving || !hasMeaningfulContent || !userId || meta.loadingState !== "loaded") {
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
          updatedJournal = await createJournalDoc(journal, userId, videoBlob, attachments)
          setJournal(prev => ({ ...prev, id: updatedJournal.id, updatedAt: updatedJournal.updatedAt }))
        } else {
          // Pass true for isAutosave to skip indexing
          updatedJournal = await updateJournalDoc(journal, userId, videoBlob, attachments, true)
          setJournal(prev => ({ ...prev, updatedAt: updatedJournal.updatedAt }))
        }

        setMeta(prev => ({ ...prev, dirty: false, status: "saved", isSaving: false }))
      } catch (error) {
        console.error("Autosave failed:", error)
        setMeta(prev => ({ ...prev, status: "error", isSaving: false }))
      }
    }, AUTOSAVE_DELAY_MS)

    return () => clearTimeout(timeoutId)
  }, [meta.dirty, meta.isSaving, meta.status, meta.loadingState, userId, hasMeaningfulContent, journal, videoBlob, attachments, setJournal, setMeta])

  // LocalStorage backup
  useEffect(() => {
    if (!hasMeaningfulContent) return

    const timeoutId = setTimeout(() => {
      saveToLocalStorage(journal)
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
}