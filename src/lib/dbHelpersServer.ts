// Server-side database helpers using Firebase Admin SDK
import { adminDb } from './firebaseAdmin';
import { EmotionLog, JournalEntry } from './dbHelpers';
import { Moment } from './moments';

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
 * Get moments using Admin SDK (from top-level collection)
 */
export async function getMomentsServer(userId: string, limit: number = 100): Promise<Moment[]> {
  try {
    console.log(`[SERVER] Getting moments for user: ${userId}`);
    
    const snapshot = await adminDb
      .collection('moments')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const moments = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as Moment[];

    console.log(`[SERVER] Found ${moments.length} moments`);
    return moments;
  } catch (error) {
    console.error(`[SERVER] Error getting moments for ${userId}:`, error);
    throw error;
  }
}

/**
 * Create a moment using Admin SDK (in top-level collection)
 */
export async function createMomentServer(momentData: Omit<Moment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    console.log(`[SERVER] Creating moment for user: ${momentData.userId}`);
    
    const docRef = await adminDb.collection('moments').add({
      ...momentData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`[SERVER] Created moment with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`[SERVER] Error creating moment:`, error);
    throw error;
  }
}

/**
 * Get a specific moment using Admin SDK
 */
export async function getMomentServer(userId: string, momentId: string): Promise<Moment | null> {
  try {
    console.log(`[SERVER] Getting moment ${momentId} for user: ${userId}`);
    
    // Try top-level collection first
    const doc = await adminDb.collection('moments').doc(momentId).get();
    
    if (doc.exists && doc.data()?.userId === userId) {
      return { id: doc.id, ...doc.data() } as Moment;
    }

    console.log(`[SERVER] Moment ${momentId} not found for user ${userId}`);
    return null;
  } catch (error) {
    console.error(`[SERVER] Error getting moment:`, error);
    throw error;
  }
}

/**
 * Update a moment using Admin SDK
 */
export async function updateMomentServer(userId: string, momentId: string, updates: Partial<Moment>): Promise<void> {
  try {
    console.log(`[SERVER] Updating moment ${momentId} for user: ${userId}`);
    
    // Try top-level collection first
    const momentRef = adminDb.collection('moments').doc(momentId);
    const momentDoc = await momentRef.get();
    
    if (momentDoc.exists && momentDoc.data()?.userId === userId) {
      await momentRef.update({
        ...updates,
        updatedAt: new Date()
      });
      console.log(`[SERVER] Updated moment in top-level collection: ${momentId}`);
      return;
    }

    throw new Error(`Moment ${momentId} not found for user ${userId}`);
  } catch (error) {
    console.error(`[SERVER] Error updating moment:`, error);
    throw error;
  }
}

/**
 * Delete a moment using Admin SDK
 */
export async function deleteMomentServer(userId: string, momentId: string): Promise<void> {
  try {
    console.log(`[SERVER] Deleting moment ${momentId} for user: ${userId}`);
    
    // Try top-level collection first
    const momentRef = adminDb.collection('moments').doc(momentId);
    const momentDoc = await momentRef.get();
    
    if (momentDoc.exists && momentDoc.data()?.userId === userId) {
      await momentRef.delete();
      console.log(`[SERVER] Deleted moment from top-level collection: ${momentId}`);
      return;
    }

    throw new Error(`Moment ${momentId} not found for user ${userId}`);
  } catch (error) {
    console.error(`[SERVER] Error deleting moment:`, error);
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