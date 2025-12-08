export const AUTOSAVE_DELAY_MS = 1500;
export const LOCALSTORAGE_BACKUP_DELAY_MS = 2000;

export const MOOD_SCALE = {
  MIN: 0,
  MAX: 6
} as const;

export const INTENSITY_SCALE = {
  MIN: 1,
  MAX: 10
} as const;

export const MOMENT_TYPES = [
  'journal',
  'emotion',
  'voice',
  'photo',
  'video',
  'chat'
] as const;

export type MomentType = typeof MOMENT_TYPES[number];

export const DEFAULT_LIMITS = {
  EMOTION_LOGS: 50,
  JOURNAL_ENTRIES: 100,
  MOMENTS: 200
} as const;