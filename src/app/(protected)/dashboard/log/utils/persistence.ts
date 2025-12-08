import { Timestamp } from "firebase/firestore"
import { uploadJournalFile, uploadImageFile } from "@/lib/data/legacy/dbHelpers"
import { MomentClient, updateUnifiedMoment } from "@/lib/data/client/moments"
import { Moment } from "@/lib/data/shared/types"
import { JournalState } from "../types"
import { toast } from "sonner"

// =============================================================================
// PERSISTENCE FUNCTIONS
// =============================================================================

import type { UseAttachmentsReturn } from "@/hooks/useAttachments"

type AttachmentsData = UseAttachmentsReturn

export const createJournalDoc = async (
  journalState: JournalState,
  userId: string,
  videoBlob: Blob | null,
  attachments: UseAttachmentsReturn
): Promise<JournalState> => {
  if (!userId) throw new Error("User not authenticated")

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
    userId: userId,
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
    const videoUrl = await uploadJournalFile(userId, videoBlob, tempId, "video")
    momentData.attachments = [...(momentData.attachments || []), videoUrl]
  }

  const momentId = await MomentClient.createMoment(momentData, !journalState.isDraft)

  return {
    ...journalState,
    id: momentId,
    updatedAt: new Date(),
  }
}

export const updateJournalDoc = async (
  journalState: JournalState,
  userId: string,
  videoBlob: Blob | null,
  attachments: UseAttachmentsReturn,
  isAutosave = false
): Promise<JournalState> => {
  if (!userId || !journalState.id) {
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
    userId: userId,
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
    const videoUrl = await uploadJournalFile(userId, videoBlob, journalState.id, "video")
    momentData.attachments = [...(momentData.attachments || []), videoUrl]
  }

  // OPTIMIZATION: Never index on autosave. Only index on manual save/update if not draft.
  const shouldIndex = isAutosave ? false : !journalState.isDraft
  await updateUnifiedMoment(journalState.id, userId, momentData, shouldIndex)

  return {
    ...journalState,
    updatedAt: new Date(),
  }
}

export const loadEntry = async (
  entryId: string,
  userId: string
): Promise<{ journal: JournalState; videoBlob: Blob | null; moment: Moment }> => {
  if (!userId) {
    throw new Error("User not authenticated")
  }

  const moment = await MomentClient.getMoment(entryId, userId)

  if (!moment) {
    throw new Error("Entry not found")
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

  let videoBlob: Blob | null = null
  if (loadedJournal.mode === "video" && loadedJournal.videoUrl) {
    try {
      const response = await fetch(loadedJournal.videoUrl)
      videoBlob = await response.blob()
    } catch (error) {
      console.error("Error loading video file:", error)
    }
  }

  return { journal: loadedJournal, videoBlob, moment }
}

// LocalStorage utilities
export const saveToLocalStorage = (journal: JournalState): void => {
  try {
    const key = journal.id ? `journal:${journal.id}` : "journal:new"
    localStorage.setItem(key, JSON.stringify({ ...journal, backedUpAt: new Date().toISOString() }))
  } catch (error) {
    console.error("Failed to backup to localStorage:", error)
  }
}

export const clearFromLocalStorage = (journal: JournalState): void => {
  const key = journal.id ? `journal:${journal.id}` : "journal:new"
  localStorage.removeItem(key)
}