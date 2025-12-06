// Unified timestamp normalization utility for the entire system
import { Timestamp } from 'firebase/firestore';

/**
 * Normalizes any timestamp format to milliseconds (number)
 * Used for consistent timestamp handling across the system
 */
export function normalizeTimestampToMs(timestamp: any): number {
  if (!timestamp) return Date.now();
  if (typeof timestamp === 'number') return timestamp;
  if (timestamp instanceof Date) return timestamp.getTime();
  if (typeof timestamp.toDate === 'function') return timestamp.toDate().getTime();
  if (timestamp.seconds) return timestamp.seconds * 1000;
  return new Date(timestamp).getTime();
}

/**
 * Normalizes any timestamp format to Date object
 * Used for date operations and formatting
 */
export function normalizeTimestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'number') return new Date(timestamp);
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
  return new Date(timestamp);
}

/**
 * Formats a timestamp for Firebase storage (Timestamp object)
 */
export function normalizeTimestampToFirebase(timestamp: any): Timestamp {
  if (timestamp instanceof Timestamp) return timestamp;
  const date = normalizeTimestampToDate(timestamp);
  return Timestamp.fromDate(date);
}

/**
 * Formats a timestamp for ChromaDB storage (milliseconds)
 */
export function normalizeTimestampForChroma(timestamp: any): number {
  return normalizeTimestampToMs(timestamp);
}

/**
 * Formats a timestamp for ISO string representation
 */
export function normalizeTimestampToISO(timestamp: any): string {
  const date = normalizeTimestampToDate(timestamp);
  return date.toISOString();
}

/**
 * Gets time-based context for a timestamp (useful for AI insights)
 */
export function getTimeContext(timestamp: any) {
  const date = normalizeTimestampToDate(timestamp);
  return {
    timestamp: normalizeTimestampToMs(timestamp),
    dayOfWeek: date.getDay(),
    hourOfDay: date.getHours(),
    season: getSeason(date),
  };
}

/**
 * Helper function to determine season from date
 */
function getSeason(date: Date): string {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}