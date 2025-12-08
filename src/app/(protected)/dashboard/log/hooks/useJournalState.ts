import { useState, useCallback, useMemo } from "react"
import { JournalState, MetaState, INITIAL_JOURNAL_STATE, INITIAL_META_STATE } from "../types"

export const useJournalState = () => {
  const [journal, setJournal] = useState<JournalState>(INITIAL_JOURNAL_STATE)
  const [meta, setMeta] = useState<MetaState>(INITIAL_META_STATE)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)

  const updateJournal = useCallback((updates: Partial<JournalState>) => {
    setJournal(prev => ({ ...prev, ...updates }))
    setMeta(prev => ({
      ...prev,
      dirty: !prev.isSaving,
      status: prev.isSaving ? prev.status : "editing",
    }))
  }, [])

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

  const resetJournal = useCallback(() => {
    setJournal(INITIAL_JOURNAL_STATE)
    setVideoBlob(null)
  }, [])

  return {
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
  }
}