// Server-side database helpers using Firebase Admin SDK
import { adminDb } from '../../firebaseAdmin';
import { EmotionLog, JournalEntry, Moment } from '../shared/types';

/**
 * Get emotion logs for a user using Admin SDK
 */
export async function getEmotionLogsServer(userId: string, limit: number = 50): Promise<EmotionLog[]> {
  try {
    console.log(`[SERVER] Getting emotion logs for user: ${userId}`);

    const snapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('emotionLogs')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const logs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as EmotionLog[];

    console.log(`[SERVER] Found ${logs.length} emotion logs`);
    return logs;
  } catch (error) {
    console.error(`[SERVER] Error getting emotion logs for ${userId}:`, error);
    throw error;
  }
}

/**
 * Get journal entries for a user using Admin SDK
 */
export async function getJournalEntriesServer(userId: string, limit: number = 50): Promise<JournalEntry[]> {
  try {
    console.log(`[SERVER] Getting journal entries for user: ${userId}`);

    const snapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('journalEntries')
      .orderBy('date', 'desc')
      .limit(limit)
      .get();

    const entries = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as JournalEntry[];

    console.log(`[SERVER] Found ${entries.length} journal entries`);
    return entries;
  } catch (error) {
    console.error(`[SERVER] Error getting journal entries for ${userId}:`, error);
    throw error;
  }
}



/**
 * Check if user exists and has data
 */
export async function checkUserDataServer(userId: string): Promise<{
  hasJournals: boolean;
  hasEmotions: boolean;
  hasMoments: boolean;
  totalDocuments: number;
}> {
  try {
    console.log(`[SERVER] Checking data for user: ${userId}`);

    const [journalsSnapshot, emotionsSnapshot, momentsSnapshot] = await Promise.all([
      adminDb.collection('users').doc(userId).collection('journalEntries').limit(1).get(),
      adminDb.collection('users').doc(userId).collection('emotionLogs').limit(1).get(),
      adminDb.collection('moments').where('userId', '==', userId).limit(1).get()
    ]);

    const result = {
      hasJournals: !journalsSnapshot.empty,
      hasEmotions: !emotionsSnapshot.empty,
      hasMoments: !momentsSnapshot.empty,
      totalDocuments: journalsSnapshot.size + emotionsSnapshot.size + momentsSnapshot.size
    };

    console.log(`[SERVER] User ${userId} data check:`, result);
    return result;
  } catch (error) {
    console.error(`[SERVER] Error checking user data:`, error);
    throw error;
  }
}