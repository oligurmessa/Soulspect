// Server-side helpers that use client SDK to avoid admin SDK issues
import {
  getEmotionLogs as getEmotionLogsClient,
  getJournalEntries as getJournalEntriesClient,
  EmotionLog,
  JournalEntry
} from "../legacy/dbHelpers";

/* ---------- SERVER-SIDE FUNCTIONS (Using Client SDK) ---------- */

// For now, we'll use the client SDK functions on the server
// This avoids Firebase Admin SDK authentication issues
export const getEmotionLogsAdmin = getEmotionLogsClient;
export const getJournalEntriesAdmin = getJournalEntriesClient;