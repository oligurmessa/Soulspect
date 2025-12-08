import { User, EmotionLog, JournalEntry, Moment } from '@/lib/data/shared/types';

export function isUser(data: any): data is User {
  return (
    data &&
    (typeof data.uid === 'string' || typeof data.id === 'string') &&
    typeof data.email === 'string'
  );
}

export function isMoment(data: any): data is Moment {
  return (
    data &&
    typeof data.userId === 'string' &&
    typeof data.type === 'string' &&
    ['journal', 'emotion', 'voice', 'photo', 'video', 'chat'].includes(data.type)
  );
}

export function isEmotionLog(data: any): data is EmotionLog {
  return (
    data &&
    typeof data.mood === 'number' &&
    Array.isArray(data.emotions)
  );
}

export function isJournalEntry(data: any): data is JournalEntry {
  return (
    data &&
    typeof data.content === 'string' &&
    data.date !== undefined
  );
}