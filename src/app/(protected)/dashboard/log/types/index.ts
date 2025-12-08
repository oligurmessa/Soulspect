// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface JournalState {
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

export interface MetaState {
  status: "idle" | "editing" | "saving" | "saved" | "error"
  dirty: boolean
  loadingState: "idle" | "loading" | "loaded" | "error"
  loadingError?: string
  isSaving: boolean
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const INITIAL_JOURNAL_STATE: JournalState = {
  title: "",
  content: "",
  date: new Date(),
  mode: "text",
  attachments: [],
  emotions: [],
  triggers: [],
  isDraft: true,
}

export const INITIAL_META_STATE: MetaState = {
  status: "idle",
  dirty: false,
  loadingState: "idle",
  isSaving: false,
}