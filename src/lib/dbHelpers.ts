import {
  doc, setDoc, collection, addDoc, getDoc,
  getDocs, query, orderBy, serverTimestamp, where,
  updateDoc, deleteDoc, limit, Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";

/* ---------- TYPES ---------- */
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  preferences: {
    timezone?: string;
    notifications?: boolean;
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    startWeekOn?: boolean;
    autoTimezone?: boolean;
    emailNotifications?: boolean;
    soundEnabled?: boolean;
    volume?: number;
    fontSize?: string;
    reducedMotion?: boolean;
    highContrast?: boolean;
    twoFactor?: boolean;
    dataCollection?: boolean;
    autoBackup?: boolean;
    timeFormat24?: boolean;
    compactMode?: boolean;
    autoSave?: boolean;
    spellCheck?: boolean;
    appPassword?: string;
    lockFeatureEnabled?: boolean;
  };
}

export interface EmotionLog {
  id?: string;
  userId: string;
  mood: number;            // 0-6 (matching EmotionVisualizer scale)
  emotions: string[];      // Selected emotions from EmotionSelector
  triggers?: string[];     // Triggers like "Work", "Family", etc.
  context?: string;        // Additional context/notes
  intensity?: number;      // 1-10 intensity scale
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface JournalEntry {
  id?: string;
  userId: string;
  title: string;
  content: string;
  entryType: 'text' | 'voice' | 'video';  // Based on the three tabs
  prompt?: string;
  mood?: number;
  emotions?: string[];
  attachments?: string[];  // File URLs
  isDraft: boolean;
  date: Timestamp;         // Entry date (can be different from created)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  carouselContent?: {
    photos: {
      id: string | number;
      name: string;
      caption: string;
      url: string;
      createdAt: string;
    }[];
    emotions: {
      id: string | number;
      emotion: string;
      intensity: number;
      note: string;
      emotions: string[];
      triggers: string[];
      createdAt: string;
    }[];
    audioRecordings: {
      id: string | number;
      transcript: string;
      duration: number;
      createdAt: string;
      audioUrl?: string;
    }[];
  };
}

export interface UserValues {
  id?: string;
  userId: string;
  values: {
    name: string;
    description?: string;
    importance: number;     // 1-10
    alignment: number;      // 1-10 how well they're living it
  }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


export interface SoulspaceItem {
  id?: string;
  userId: string;
  type: 'note' | 'image' | 'audio' | 'video' | 'link';
  title: string;
  content: string;
  url?: string;           // For attachments
  tags?: string[];
  isPrivate: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AnalyticsData {
  id?: string;
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Timestamp;
  emotionStats: {
    averageMood: number;
    emotionCounts: Record<string, number>;
    triggerCounts: Record<string, number>;
  };
  journalStats: {
    entriesCount: number;
    wordsWritten: number;
    voiceMinutes: number;
    videoMinutes: number;
  };
  createdAt: Timestamp;
}

/* ---------- USER CRUD ---------- */
export const createUser = async (userData: Omit<User, 'createdAt' | 'updatedAt'>) => {
  const userRef = doc(db, "users", userData.uid);
  return setDoc(userRef, {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getUser = async (uid: string) => {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as unknown as User;
  }
  return null;
};

export const updateUser = async (uid: string, updates: Partial<User>) => {
  const userRef = doc(db, "users", uid);
  return updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/* ---------- LEGACY EMOTION LOGS (DEPRECATED - USE MOMENTS) ---------- */
// NOTE: These functions are deprecated. New entries should use the unified Moment system.
// Keeping for backward compatibility and data migration only.

export const addEmotionLog = async (uid: string, data: Omit<EmotionLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  console.warn('[DEPRECATED] addEmotionLog - Use createMoment with type="emotion" instead');
  const emotionLogData = {
    ...data,
    userId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  return addDoc(collection(db, "users", uid, "emotionLogs"), emotionLogData);
};

export const getEmotionLogs = async (uid: string, limitCount = 50) => {
  console.warn('[DEPRECATED] getEmotionLogs - Use getMoments with type="emotion" instead');
  const logsQuery = query(
    collection(db, "users", uid, "emotionLogs"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(logsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmotionLog));
};

export const getEmotionLogsByDateRange = async (uid: string, startDate: Date, endDate: Date) => {
  console.warn('[DEPRECATED] getEmotionLogsByDateRange - Use getMoments with date filters instead');
  const logsQuery = query(
    collection(db, "users", uid, "emotionLogs"),
    where("createdAt", ">=", Timestamp.fromDate(startDate)),
    where("createdAt", "<=", Timestamp.fromDate(endDate)),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(logsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmotionLog));
};

export const updateEmotionLog = async (uid: string, logId: string, updates: Partial<EmotionLog>) => {
  console.warn('[DEPRECATED] updateEmotionLog - Use updateMoment instead');
  const logRef = doc(db, "users", uid, "emotionLogs", logId);
  return updateDoc(logRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteEmotionLog = async (uid: string, logId: string) => {
  console.warn('[DEPRECATED] deleteEmotionLog - Use deleteMoment instead');
  const logRef = doc(db, "users", uid, "emotionLogs", logId);
  return deleteDoc(logRef);
};

/* ---------- LEGACY JOURNAL ENTRIES (DEPRECATED - USE MOMENTS) ---------- */
// NOTE: These functions are deprecated. New entries should use the unified Moment system.
// Keeping for backward compatibility and data migration only.

export const addJournalEntry = async (uid: string, data: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  console.warn('[DEPRECATED] addJournalEntry - Use createMoment with type="journal" instead');
  const entryData = {
    ...data,
    userId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  return addDoc(collection(db, "users", uid, "journalEntries"), entryData);
};

export const getJournalEntries = async (uid: string, limitCount = 50) => {
  console.warn('[DEPRECATED] getJournalEntries - Use getMoments with type="journal" instead');
  const entriesQuery = query(
    collection(db, "users", uid, "journalEntries"),
    orderBy("date", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(entriesQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
};

export const getJournalEntry = async (uid: string, entryId: string) => {
  console.warn('[DEPRECATED] getJournalEntry - Use getMoment instead');
  const entryDoc = await getDoc(doc(db, "users", uid, "journalEntries", entryId));
  if (entryDoc.exists()) {
    return { id: entryDoc.id, ...entryDoc.data() } as JournalEntry;
  }
  return null;
};

export const updateJournalEntry = async (uid: string, entryId: string, updates: Partial<JournalEntry>) => {
  console.warn('[DEPRECATED] updateJournalEntry - Use updateMoment instead');
  const entryRef = doc(db, "users", uid, "journalEntries", entryId);
  return updateDoc(entryRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteJournalEntry = async (uid: string, entryId: string) => {
  console.warn('[DEPRECATED] deleteJournalEntry - Use deleteMoment instead');
  const entryRef = doc(db, "users", uid, "journalEntries", entryId);
  return deleteDoc(entryRef);
};

/* ---------- USER VALUES CRUD ---------- */
export const saveUserValues = async (uid: string, values: UserValues['values']) => {
  const valuesRef = doc(db, "users", uid, "values", "current");
  return setDoc(valuesRef, {
    userId: uid,
    values,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getUserValues = async (uid: string) => {
  const valuesDoc = await getDoc(doc(db, "users", uid, "values", "current"));
  if (valuesDoc.exists()) {
    return { id: valuesDoc.id, ...valuesDoc.data() } as UserValues;
  }
  return null;
};


/* ---------- SOULSPACE ITEMS CRUD ---------- */
export const addSoulspaceItem = async (uid: string, data: Omit<SoulspaceItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  const itemData = {
    ...data,
    userId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  return addDoc(collection(db, "users", uid, "soulspaceItems"), itemData);
};

export const getSoulspaceItems = async (uid: string, limitCount = 50) => {
  const itemsQuery = query(
    collection(db, "users", uid, "soulspaceItems"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(itemsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SoulspaceItem));
};

export const updateSoulspaceItem = async (uid: string, itemId: string, updates: Partial<SoulspaceItem>) => {
  const itemRef = doc(db, "users", uid, "soulspaceItems", itemId);
  return updateDoc(itemRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteSoulspaceItem = async (uid: string, itemId: string) => {
  const itemRef = doc(db, "users", uid, "soulspaceItems", itemId);
  return deleteDoc(itemRef);
};

/* ---------- ANALYTICS HELPERS ---------- */
export const generateAnalytics = async (uid: string, period: 'daily' | 'weekly' | 'monthly') => {
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }
  
  // Get emotion logs for the period
  const emotionLogs = await getEmotionLogsByDateRange(uid, startDate, now);
  
  // Calculate emotion stats
  const emotionStats = {
    averageMood: emotionLogs.reduce((sum, log) => sum + log.mood, 0) / emotionLogs.length || 0,
    emotionCounts: emotionLogs.reduce((counts, log) => {
      log.emotions.forEach(emotion => {
        counts[emotion] = (counts[emotion] || 0) + 1;
      });
      return counts;
    }, {} as Record<string, number>),
    triggerCounts: emotionLogs.reduce((counts, log) => {
      (log.triggers || []).forEach(trigger => {
        counts[trigger] = (counts[trigger] || 0) + 1;
      });
      return counts;
    }, {} as Record<string, number>),
  };
  
  // Get journal entries for the period
  const journalQuery = query(
    collection(db, "users", uid, "journalEntries"),
    where("date", ">=", Timestamp.fromDate(startDate)),
    where("date", "<=", Timestamp.fromDate(now))
  );
  const journalSnapshot = await getDocs(journalQuery);
  const journalEntries = journalSnapshot.docs.map(doc => doc.data() as JournalEntry);
  
  const journalStats = {
    entriesCount: journalEntries.length,
    wordsWritten: journalEntries.reduce((sum, entry) => sum + (entry.content?.split(' ').length || 0), 0),
    voiceMinutes: journalEntries.filter(e => e.entryType === 'voice').length * 5, // Estimate
    videoMinutes: journalEntries.filter(e => e.entryType === 'video').length * 5, // Estimate
  };
  
  // Save analytics data
  const analyticsData: Omit<AnalyticsData, 'id' | 'createdAt'> = {
    userId: uid,
    period,
    date: Timestamp.fromDate(now),
    emotionStats,
    journalStats,
  };
  
  const analyticsRef = doc(db, "users", uid, "analytics", `${period}-${now.toISOString().split('T')[0]}`);
  await setDoc(analyticsRef, {
    ...analyticsData,
    createdAt: serverTimestamp(),
  });
  
  return analyticsData;
};

export const getAnalytics = async (uid: string, period: 'daily' | 'weekly' | 'monthly', limitCount = 30) => {
  const analyticsQuery = query(
    collection(db, "users", uid, "analytics"),
    where("period", "==", period),
    orderBy("date", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(analyticsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalyticsData));
};

/* ---------- DATA EXPORT HELPERS ---------- */
export const exportUserData = async (uid: string, format: 'json' | 'csv' = 'json') => {
  try {
    // Get all user data
    const [emotionLogs, journalEntries, userValues, analytics] = await Promise.all([
      getEmotionLogs(uid, 1000),
      getJournalEntries(uid, 1000),
      getUserValues(uid),
      getAnalytics(uid, 'weekly', 100)
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      userId: uid,
      data: {
        emotionLogs: emotionLogs.map(log => ({
          ...log,
          createdAt: log.createdAt.toDate().toISOString(),
          updatedAt: log.updatedAt.toDate().toISOString()
        })),
        journalEntries: journalEntries.map(entry => ({
          ...entry,
          date: entry.date.toDate().toISOString(),
          createdAt: entry.createdAt.toDate().toISOString(),
          updatedAt: entry.updatedAt.toDate().toISOString()
        })),
        userValues: userValues ? {
          ...userValues,
          createdAt: userValues.createdAt.toDate().toISOString(),
          updatedAt: userValues.updatedAt.toDate().toISOString()
        } : null,
        analytics: analytics.map(analytic => ({
          ...analytic,
          date: analytic.date.toDate().toISOString(),
          createdAt: analytic.createdAt.toDate().toISOString()
        }))
      },
      summary: {
        totalEmotionLogs: emotionLogs.length,
        totalJournalEntries: journalEntries.length,
        totalValues: userValues?.values?.length || 0,
        totalAnalytics: analytics.length
      }
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else {
      // Simple CSV export for emotion logs (most requested format)
      const csvHeader = 'Date,Mood,Emotions,Triggers,Context,Intensity\n';
      const csvRows = emotionLogs.map(log => {
        const date = log.createdAt.toDate().toISOString().split('T')[0];
        const emotions = log.emotions.join(';');
        const triggers = (log.triggers || []).join(';');
        const context = (log.context || '').replace(/,/g, ';').replace(/\n/g, ' ');
        return `${date},${log.mood},"${emotions}","${triggers}","${context}",${log.intensity || ''}`;
      }).join('\n');
      
      return csvHeader + csvRows;
    }
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw error;
  }
};

export const downloadExportData = (data: string, filename: string, format: 'json' | 'csv') => {
  const mimeType = format === 'json' ? 'application/json' : 'text/csv';
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/* ---------- FILE UPLOAD HELPERS ---------- */
export const uploadJournalFile = async (uid: string, file: Blob, entryId: string, fileType: 'voice' | 'video' | string): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileExtension = fileType === 'voice' ? 'webm' : 'webm';
    const filePath = `users/${uid}/journals/${entryId}/${fileType}_${timestamp}.${fileExtension}`;
    
    const storageRef = ref(storage, filePath);
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const uploadJournalImage = async (uid: string, imageDataUrl: string, entryId: string, imageName: string): Promise<string> => {
  try {
    // Convert data URL to blob
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    
    const timestamp = Date.now();
    const fileExtension = imageName.split('.').pop() || 'jpg';
    const filePath = `users/${uid}/journals/${entryId}/image_${timestamp}.${fileExtension}`;
    
    const storageRef = ref(storage, filePath);
    const uploadResult = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const uploadImageFile = async (uid: string, file: File, entryId: string): Promise<string> => {
  try {
    console.log('uploadImageFile called with:', { uid, fileName: file.name, fileSize: file.size, entryId });
    
    // Use the same pattern as uploadJournalFile which works for voice uploads
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filePath = `users/${uid}/journals/${entryId}/image_${timestamp}.${fileExtension}`;
    console.log('Storage path:', filePath);
    
    const storageRef = ref(storage, filePath);
    console.log('Uploading to Firebase Storage...');
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log('Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading image file:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      serverResponse: error.serverResponse
    });
    throw error;
  }
};

export const deleteJournalFile = async (fileUrl: string): Promise<void> => {
  try {
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/* ---------- ENHANCED JOURNAL ENTRY CRUD WITH FILE SUPPORT ---------- */
export const saveJournalEntryWithFiles = async (
  uid: string, 
  entryData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  files?: { voiceBlob?: Blob; videoBlob?: Blob; audioBlobs?: { id: string | number; blob: Blob }[] }
): Promise<string> => {
  try {
    // First create the journal entry to get an ID
    const docRef = await addJournalEntry(uid, entryData);
    const entryId = docRef.id;
    
    // Upload files if provided
    const attachmentUrls: string[] = [];
    
    if (files?.voiceBlob) {
      const voiceUrl = await uploadJournalFile(uid, files.voiceBlob, entryId, 'voice');
      attachmentUrls.push(voiceUrl);
    }
    
    if (files?.videoBlob) {
      const videoUrl = await uploadJournalFile(uid, files.videoBlob, entryId, 'video');
      attachmentUrls.push(videoUrl);
    }
    
    // Upload audio recordings from carousel
    if (files?.audioBlobs && files.audioBlobs.length > 0) {
      for (const audioFile of files.audioBlobs) {
        const audioUrl = await uploadJournalFile(uid, audioFile.blob, entryId, `audio_${audioFile.id}`);
        attachmentUrls.push(audioUrl);
        
        // Update the carousel content with the uploaded URL
        if (entryData.carouselContent?.audioRecordings) {
          const audioIndex = entryData.carouselContent.audioRecordings.findIndex(
            audio => audio.id === audioFile.id
          );
          if (audioIndex !== -1) {
            entryData.carouselContent.audioRecordings[audioIndex].audioUrl = audioUrl;
          }
        }
      }
    }
    
    // Update the entry with attachment URLs and carousel content if any files were uploaded
    const updateData: any = {};
    if (attachmentUrls.length > 0) {
      updateData.attachments = attachmentUrls;
    }
    if (entryData.carouselContent) {
      updateData.carouselContent = entryData.carouselContent;
    }
    
    if (Object.keys(updateData).length > 0) {
      await updateJournalEntry(uid, entryId, updateData);
    }
    
    return entryId;
  } catch (error) {
    console.error('Error saving journal entry with files:', error);
    throw error;
  }
};


/* ---------- LEGACY DRAFT SYSTEM (DEPRECATED - USE MOMENTS) ---------- */
// NOTE: These functions are deprecated. New drafts should use the unified Moment system.
// Keeping for backward compatibility only.

// Create initial draft entry when user starts typing/adding content
export const createDraftEntry = async (userId: string, initialData: Partial<JournalEntry> = {}) => {
  console.warn('[DEPRECATED] createDraftEntry - Use MomentClient.createMoment with journalData.isDraft=true instead');
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'journalEntries'), {
      userId,
      title: initialData.title || "",
      content: initialData.content || "",
      entryType: initialData.entryType || 'text',
      isDraft: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      date: initialData.date || serverTimestamp(),
      attachments: [],
      carouselContent: {
        photos: [],
        emotions: [],
        audioRecordings: []
      },
      ...initialData
    });
    
    console.log('Legacy draft entry created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating legacy draft entry:', error);
    throw error;
  }
};

// Auto-save changes to existing draft
export const autosaveEntry = async (userId: string, entryId: string, updates: Partial<JournalEntry>) => {
  console.warn('[DEPRECATED] autosaveEntry - Use moment update API instead');
  try {
    const docRef = doc(db, 'users', userId, 'journalEntries', entryId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('Legacy entry autosaved:', entryId);
  } catch (error) {
    console.error('Error autosaving legacy entry:', error);
    throw error;
  }
};

// Finalize draft (mark as published)
export const finalizeDraft = async (userId: string, entryId: string) => {
  console.warn('[DEPRECATED] finalizeDraft - Use moment update API instead');
  try {
    const docRef = doc(db, 'users', userId, 'journalEntries', entryId);
    await updateDoc(docRef, {
      isDraft: false,
      updatedAt: serverTimestamp()
    });
    
    console.log('Legacy draft finalized:', entryId);
  } catch (error) {
    console.error('Error finalizing legacy draft:', error);
    throw error;
  }
};

// Load entry for editing (works for both drafts and published entries)
export const loadEntryForEdit = async (userId: string, entryId: string): Promise<JournalEntry | null> => {
  console.warn('[DEPRECATED] loadEntryForEdit - Use getMoment instead');
  try {
    const docRef = doc(db, 'users', userId, 'journalEntries', entryId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.warn('Legacy entry not found:', entryId);
      return null;
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
    } as JournalEntry;
  } catch (error) {
    console.error('Error loading legacy entry for edit:', error);
    throw error;
  }
};
