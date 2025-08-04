/**
 * SERVER-SIDE MOMENTS SERVICE
 * Uses Firebase Admin SDK for server-side operations
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { Moment } from './moments';

// Initialize Firebase Admin if not already done
let adminDb: any = null;

try {
  if (!getApps().length) {
    // Check if we have the required credentials
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      adminDb = getFirestore();
    } else {
      console.warn('Firebase Admin credentials not available, server-side operations will be limited');
    }
  } else {
    adminDb = getFirestore();
  }
} catch (error) {
  console.warn('Failed to initialize Firebase Admin:', error);
}


/* ---------- SERVER-SIDE MOMENT OPERATIONS ---------- */

export async function createMomentServer(momentData: Omit<Moment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (!adminDb) {
    throw new Error('Firebase Admin not available - server-side operations require proper credentials');
  }
  
  const momentsRef = adminDb.collection('moments');
  const now = FieldValue.serverTimestamp();
  
  const docRef = await momentsRef.add({
    ...momentData,
    timestamp: momentData.timestamp || now,
    createdAt: now,
    updatedAt: now,
  });
  
  return docRef.id;
}

export async function getMomentsServer(
  userId: string,
  options: {
    type?: Moment['type'];
    limit?: number;
  } = {}
): Promise<Moment[]> {
  if (!adminDb) {
    throw new Error('Firebase Admin not available');
  }
  
  let query = adminDb.collection('users')
    .doc(userId)
    .collection('moments')
    .orderBy('timestamp', 'desc');
  
  if (options.type) {
    query = query.where('type', '==', options.type);
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  const snapshot = await query.get();
  
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  })) as Moment[];
}

export async function getMomentServer(userId: string, momentId: string): Promise<Moment | null> {
  if (!adminDb) {
    throw new Error('Firebase Admin not available');
  }
  
  const docRef = adminDb.collection('users').doc(userId).collection('moments').doc(momentId);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    return null;
  }
  
  const data = doc.data() as Moment;
  
  return {
    id: doc.id,
    ...data,
  };
}

export async function updateMomentServer(
  userId: string,
  momentId: string,
  updates: Partial<Moment>
): Promise<void> {
  const docRef = adminDb.collection('moments').doc(momentId);
  
  // First verify the document exists and user owns it
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error('Moment not found');
  }
  
  const data = doc.data() as Moment;
  if (data.userId !== userId) {
    throw new Error('Unauthorized access to moment');
  }
  
  await docRef.update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteMomentServer(userId: string, momentId: string): Promise<void> {
  const docRef = adminDb.collection('moments').doc(momentId);
  
  // First verify the document exists and user owns it
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error('Moment not found');
  }
  
  const data = doc.data() as Moment;
  if (data.userId !== userId) {
    throw new Error('Unauthorized access to moment');
  }
  
  await docRef.delete();
}

/* ---------- LEGACY DATA ACCESS (for migration/compatibility) ---------- */

export async function getLegacyEmotionLogsServer(userId: string, limit = 100): Promise<any[]> {
  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('emotionLogs')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function getLegacyJournalEntriesServer(userId: string, limit = 100): Promise<any[]> {
  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('journalEntries')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }));
}