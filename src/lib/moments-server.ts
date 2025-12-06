/**
 * SERVER-SIDE MOMENTS SERVICE
 * Uses Firebase Admin SDK for server-side operations
 */

import { FieldValue, Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { adminDb } from './firebaseAdmin';
import { Moment, VectorMetadata } from './types';


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

/* ---------- SERVER-SIDE VECTOR METADATA OPERATIONS ---------- */

export async function getVectorMetadataServer(userId: string, momentId: string): Promise<VectorMetadata | null> {
  if (!adminDb) {
    throw new Error('Firebase Admin not available');
  }

  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('vectorMetadata')
    .where('momentId', '==', momentId)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data
    } as VectorMetadata;
  }
  return null;
}

export async function createVectorMetadataServer(
  metadata: Omit<VectorMetadata, 'id' | 'lastUpdated'>
): Promise<string> {
  if (!adminDb) {
    throw new Error('Firebase Admin not available');
  }

  // Convert client Timestamp to Admin Timestamp if needed
  const convertTimestamp = (ts: any): any => {
    if (!ts) return FieldValue.serverTimestamp();
    if (ts.toDate) {
      // It's a client Timestamp, convert to Admin Timestamp
      return AdminTimestamp.fromDate(ts.toDate());
    }
    if (ts instanceof AdminTimestamp) {
      return ts;
    }
    // If it's already a Firestore Timestamp-like object, use it
    return ts;
  };

  const metadataData: any = {
    ...metadata,
    lastUpdated: FieldValue.serverTimestamp(),
    indexedAt: metadata.indexedAt ? convertTimestamp(metadata.indexedAt) : FieldValue.serverTimestamp(),
  };

  // Only include emotionContext if it's defined and not empty
  if (metadata.emotionContext) {
    metadataData.emotionContext = metadata.emotionContext;
  }

  if (metadata.timeContext) {
    metadataData.timeContext = {
      ...metadata.timeContext,
      timestamp: convertTimestamp(metadata.timeContext.timestamp)
    };
  }

  // Remove undefined values
  Object.keys(metadataData).forEach(key => {
    if (metadataData[key] === undefined) {
      delete metadataData[key];
    }
  });

  const docRef = await adminDb
    .collection('users')
    .doc(metadata.userId)
    .collection('vectorMetadata')
    .add(metadataData);

  return docRef.id;
}

export async function updateVectorMetadataServer(
  userId: string,
  metadataId: string,
  updates: Partial<VectorMetadata>
): Promise<void> {
  if (!adminDb) {
    throw new Error('Firebase Admin not available');
  }

  const metadataRef = adminDb
    .collection('users')
    .doc(userId)
    .collection('vectorMetadata')
    .doc(metadataId);

  // Convert client Timestamp to Admin Timestamp if needed
  const convertTimestamp = (ts: any): any => {
    if (!ts) return FieldValue.serverTimestamp();
    if (ts.toDate) {
      // It's a client Timestamp, convert to Admin Timestamp
      return AdminTimestamp.fromDate(ts.toDate());
    }
    if (ts instanceof AdminTimestamp) {
      return ts;
    }
    // If it's already a Firestore Timestamp-like object, use it
    return ts;
  };

  const updateData: any = {
    ...updates,
    lastUpdated: FieldValue.serverTimestamp(),
  };

  // Convert client Timestamps to Admin Timestamps if present
  if (updates.indexedAt) {
    updateData.indexedAt = convertTimestamp(updates.indexedAt);
  }

  // Only include emotionContext if it's defined
  if (updates.emotionContext !== undefined) {
    updateData.emotionContext = updates.emotionContext;
  }

  if (updates.timeContext) {
    updateData.timeContext = {
      ...updates.timeContext,
      timestamp: convertTimestamp(updates.timeContext.timestamp)
    };
  }

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  await metadataRef.update(updateData);
}