import {
  doc, setDoc, collection, addDoc, getDoc,
  getDocs, query, orderBy, serverTimestamp, where,
  updateDoc, deleteDoc, limit, Timestamp
} from "firebase/firestore";
import { db } from "../../firebase";
import { Moment, Attachment, AIInsight, VectorMetadata } from "../shared/types";
import { isMoment } from "../../utils/typeGuards";

export * from "../shared/types";

/* ---------- HELPER FUNCTIONS ---------- */


/* ---------- MOMENT CRUD OPERATIONS ---------- */

export const createMoment = async (moment: Omit<Moment, 'id' | 'createdAt' | 'updatedAt'>) => {
  const momentData = {
    ...moment,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Create in top-level collection for better server access
  const docRef = await addDoc(collection(db, "moments"), momentData);
  return docRef.id;
};

export const getMoment = async (userId: string, momentId: string): Promise<Moment | null> => {
  // Try top-level collection first
  const momentDoc = await getDoc(doc(db, "moments", momentId));
  if (momentDoc.exists() && momentDoc.data()?.userId === userId) {
    return { id: momentDoc.id, ...momentDoc.data() } as Moment;
  }

  // Fallback to subcollection for backward compatibility
  const subMomentDoc = await getDoc(doc(db, "users", userId, "moments", momentId));
  if (subMomentDoc.exists()) {
    return { id: subMomentDoc.id, ...subMomentDoc.data() } as Moment;
  }

  return null;
};

export const getMoments = async (
  userId: string,
  options: {
    type?: Moment['type'];
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<Moment[]> => {
  // Query top-level collection with userId filter
  let q = query(
    collection(db, "moments"),
    where("userId", "==", userId),
    orderBy("timestamp", "desc")
  );

  if (options.type) {
    q = query(q, where("type", "==", options.type));
  }

  if (options.startDate && options.endDate) {
    q = query(
      q,
      where("timestamp", ">=", Timestamp.fromDate(options.startDate)),
      where("timestamp", "<=", Timestamp.fromDate(options.endDate))
    );
  }

  if (options.limit) {
    q = query(q, limit(options.limit));
  }

  try {
    const snapshot = await getDocs(q);
    const topLevelMoments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Moment));

    // If we found moments in top-level collection, return them
    if (topLevelMoments.length > 0) {
      return topLevelMoments;
    }
  } catch (error) {
    console.warn('Error querying top-level moments collection, trying subcollection:', error);
  }

  // Fallback to subcollection for backward compatibility
  try {
    let fallbackQ = query(
      collection(db, "users", userId, "moments"),
      orderBy("timestamp", "desc")
    );

    if (options.type) {
      fallbackQ = query(fallbackQ, where("type", "==", options.type));
    }

    if (options.startDate && options.endDate) {
      fallbackQ = query(
        fallbackQ,
        where("timestamp", ">=", Timestamp.fromDate(options.startDate)),
        where("timestamp", "<=", Timestamp.fromDate(options.endDate))
      );
    }

    if (options.limit) {
      fallbackQ = query(fallbackQ, limit(options.limit));
    }

    const fallbackSnapshot = await getDocs(fallbackQ);
    return fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Moment));
  } catch (fallbackError) {
    console.error('Error querying subcollection moments as well:', fallbackError);
    return [];
  }
};

export const updateMoment = async (userId: string, momentId: string, updates: Partial<Moment>) => {
  // Try top-level collection first
  try {
    const topLevelRef = doc(db, "moments", momentId);
    const topLevelDoc = await getDoc(topLevelRef);

    if (topLevelDoc.exists() && topLevelDoc.data()?.userId === userId) {
      return updateDoc(topLevelRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.warn('Error updating top-level moment, trying subcollection:', error);
  }

  // Fallback to subcollection
  const momentRef = doc(db, "users", userId, "moments", momentId);
  return updateDoc(momentRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteMoment = async (userId: string, momentId: string) => {
  // Try top-level collection first
  try {
    const topLevelRef = doc(db, "moments", momentId);
    const topLevelDoc = await getDoc(topLevelRef);

    if (topLevelDoc.exists() && topLevelDoc.data()?.userId === userId) {
      return deleteDoc(topLevelRef);
    }
  } catch (error) {
    console.warn('Error deleting top-level moment, trying subcollection:', error);
  }

  // Fallback to subcollection
  const momentRef = doc(db, "users", userId, "moments", momentId);
  return deleteDoc(momentRef);
};

/* ---------- ATTACHMENT OPERATIONS ---------- */

export const createAttachment = async (attachment: Omit<Attachment, 'id' | 'uploadedAt'>) => {
  const attachmentData = {
    ...attachment,
    uploadedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "users", attachment.userId, "attachments"), attachmentData);
  return docRef.id;
};

export const getAttachments = async (userId: string, momentId: string): Promise<Attachment[]> => {
  const q = query(
    collection(db, "users", userId, "attachments"),
    where("momentId", "==", momentId),
    orderBy("uploadedAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attachment));
};

export const deleteAttachment = async (userId: string, attachmentId: string) => {
  const attachmentRef = doc(db, "users", userId, "attachments", attachmentId);
  return deleteDoc(attachmentRef);
};

/* ---------- AI INSIGHTS OPERATIONS ---------- */

export const createInsight = async (insight: Omit<AIInsight, 'id' | 'createdAt'>) => {
  const insightData = {
    ...insight,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "users", insight.userId, "insights"), insightData);
  return docRef.id;
};

export const getInsights = async (userId: string, type?: AIInsight['type'], limitCount = 20): Promise<AIInsight[]> => {
  let q = query(
    collection(db, "users", userId, "insights"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  if (type) {
    q = query(q, where("type", "==", type));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIInsight));
};

/* ---------- VECTOR METADATA OPERATIONS ---------- */

export const createVectorMetadata = async (metadata: Omit<VectorMetadata, 'id' | 'lastUpdated'>) => {
  const metadataData = {
    ...metadata,
    lastUpdated: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "users", metadata.userId, "vectorMetadata"), metadataData);
  return docRef.id;
};

export const getVectorMetadata = async (userId: string, momentId: string): Promise<VectorMetadata | null> => {
  const q = query(
    collection(db, "users", userId, "vectorMetadata"),
    where("momentId", "==", momentId),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as VectorMetadata;
  }
  return null;
};

export const updateVectorMetadata = async (
  userId: string,
  metadataId: string,
  updates: Partial<VectorMetadata>
) => {
  const metadataRef = doc(db, "users", userId, "vectorMetadata", metadataId);
  return updateDoc(metadataRef, {
    ...updates,
    lastUpdated: serverTimestamp(),
  });
};

/* ---------- HELPER FUNCTIONS ---------- */

export const getMomentsByType = async (userId: string, type: Moment['type'], limitCount = 50): Promise<Moment[]> => {
  return getMoments(userId, { type, limit: limitCount });
};

export const getRecentMoments = async (userId: string, days = 30, limitCount = 100): Promise<Moment[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return getMoments(userId, {
    startDate,
    endDate: new Date(),
    limit: limitCount
  });
};

export const searchMoments = async (
  userId: string,
  searchTerm: string,
  options: {
    type?: Moment['type'];
    emotions?: string[];
    dateRange?: { start: Date; end: Date };
    limit?: number;
  } = {}
): Promise<Moment[]> => {
  // This is a basic text search - for semantic search, use the vector service
  let q = query(
    collection(db, "users", userId, "moments"),
    orderBy("timestamp", "desc")
  );

  if (options.type) {
    q = query(q, where("type", "==", options.type));
  }

  if (options.dateRange) {
    q = query(
      q,
      where("timestamp", ">=", Timestamp.fromDate(options.dateRange.start)),
      where("timestamp", "<=", Timestamp.fromDate(options.dateRange.end))
    );
  }

  if (options.limit) {
    q = query(q, limit(options.limit));
  }

  const snapshot = await getDocs(q);
  const moments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Moment));

  // Client-side filtering for search term and emotions
  return moments.filter(moment => {
    const contentMatch = moment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      moment.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const emotionMatch = !options.emotions ||
      options.emotions.some(emotion => moment.emotions?.includes(emotion));

    return contentMatch && emotionMatch;
  });
};

export const getMoodTrend = async (userId: string, days = 30): Promise<{
  average: number;
  trend: 'improving' | 'declining' | 'stable';
  data: { date: Date; mood: number }[];
}> => {
  const moments = await getRecentMoments(userId, days);
  const moodMoments = moments.filter(m => typeof m.mood === 'number');

  if (moodMoments.length === 0) {
    return { average: 0, trend: 'stable', data: [] };
  }

  const data = moodMoments.map(m => ({
    date: m.timestamp.toDate(),
    mood: m.mood!
  }));

  const average = data.reduce((sum, d) => sum + d.mood, 0) / data.length;

  // Calculate trend (recent half vs older half)
  const midPoint = Math.floor(data.length / 2);
  const recentMoods = data.slice(0, midPoint);
  const olderMoods = data.slice(midPoint);

  const recentAvg = recentMoods.reduce((sum, d) => sum + d.mood, 0) / recentMoods.length;
  const olderAvg = olderMoods.reduce((sum, d) => sum + d.mood, 0) / olderMoods.length;

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (recentAvg > olderAvg + 0.5) trend = 'improving';
  else if (recentAvg < olderAvg - 0.5) trend = 'declining';

  return { average, trend, data };
};