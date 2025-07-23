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
}

export interface SoulWorkExercise {
  id?: string;
  userId: string;
  exerciseType: 'shadow-work' | 'inner-child' | 'values' | 'purpose';
  title: string;
  responses: Record<string, any>;  // Flexible structure for different exercises
  duration: number;        // Minutes spent
  completedAt: Timestamp;
  createdAt: Timestamp;
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

export interface CompassEntry {
  id?: string;
  userId: string;
  direction: 'north' | 'south' | 'east' | 'west';  // Life areas
  goals: string[];
  progress: number;        // 0-100
  notes?: string;
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
  soulWorkStats: {
    exercisesCompleted: number;
    timeSpent: number;
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

/* ---------- EMOTION LOGS CRUD ---------- */
export const addEmotionLog = async (uid: string, data: Omit<EmotionLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  const emotionLogData = {
    ...data,
    userId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  return addDoc(collection(db, "users", uid, "emotionLogs"), emotionLogData);
};

export const getEmotionLogs = async (uid: string, limitCount = 50) => {
  const logsQuery = query(
    collection(db, "users", uid, "emotionLogs"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(logsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmotionLog));
};

export const getEmotionLogsByDateRange = async (uid: string, startDate: Date, endDate: Date) => {
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
  const logRef = doc(db, "users", uid, "emotionLogs", logId);
  return updateDoc(logRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteEmotionLog = async (uid: string, logId: string) => {
  const logRef = doc(db, "users", uid, "emotionLogs", logId);
  return deleteDoc(logRef);
};

/* ---------- JOURNAL ENTRIES CRUD ---------- */
export const addJournalEntry = async (uid: string, data: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  const entryData = {
    ...data,
    userId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  return addDoc(collection(db, "users", uid, "journalEntries"), entryData);
};

export const getJournalEntries = async (uid: string, limitCount = 50) => {
  const entriesQuery = query(
    collection(db, "users", uid, "journalEntries"),
    orderBy("date", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(entriesQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
};

export const getJournalEntry = async (uid: string, entryId: string) => {
  const entryDoc = await getDoc(doc(db, "users", uid, "journalEntries", entryId));
  if (entryDoc.exists()) {
    return { id: entryDoc.id, ...entryDoc.data() } as JournalEntry;
  }
  return null;
};

export const updateJournalEntry = async (uid: string, entryId: string, updates: Partial<JournalEntry>) => {
  const entryRef = doc(db, "users", uid, "journalEntries", entryId);
  return updateDoc(entryRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteJournalEntry = async (uid: string, entryId: string) => {
  const entryRef = doc(db, "users", uid, "journalEntries", entryId);
  return deleteDoc(entryRef);
};

/* ---------- SOUL WORK EXERCISES CRUD ---------- */
export const addSoulWorkExercise = async (uid: string, data: Omit<SoulWorkExercise, 'id' | 'userId' | 'createdAt'>) => {
  const exerciseData = {
    ...data,
    userId: uid,
    createdAt: serverTimestamp(),
  };
  return addDoc(collection(db, "users", uid, "soulWorkExercises"), exerciseData);
};

export const getSoulWorkExercises = async (uid: string, limitCount = 50) => {
  const exercisesQuery = query(
    collection(db, "users", uid, "soulWorkExercises"),
    orderBy("completedAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(exercisesQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SoulWorkExercise));
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

/* ---------- COMPASS ENTRIES CRUD ---------- */
export const saveCompassEntry = async (uid: string, direction: CompassEntry['direction'], data: Omit<CompassEntry, 'id' | 'userId' | 'direction' | 'createdAt' | 'updatedAt'>) => {
  const compassRef = doc(db, "users", uid, "compass", direction);
  return setDoc(compassRef, {
    ...data,
    userId: uid,
    direction,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const getCompassEntries = async (uid: string) => {
  const compassQuery = query(collection(db, "users", uid, "compass"));
  const snapshot = await getDocs(compassQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompassEntry));
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
  
  // Get soul work exercises for the period
  const soulWorkQuery = query(
    collection(db, "users", uid, "soulWorkExercises"),
    where("completedAt", ">=", Timestamp.fromDate(startDate)),
    where("completedAt", "<=", Timestamp.fromDate(now))
  );
  const soulWorkSnapshot = await getDocs(soulWorkQuery);
  const soulWorkExercises = soulWorkSnapshot.docs.map(doc => doc.data() as SoulWorkExercise);
  
  const soulWorkStats = {
    exercisesCompleted: soulWorkExercises.length,
    timeSpent: soulWorkExercises.reduce((sum, exercise) => sum + exercise.duration, 0),
  };
  
  // Save analytics data
  const analyticsData: Omit<AnalyticsData, 'id' | 'createdAt'> = {
    userId: uid,
    period,
    date: Timestamp.fromDate(now),
    emotionStats,
    journalStats,
    soulWorkStats,
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
    const [emotionLogs, journalEntries, userValues, compassEntries, soulWorkExercises, analytics] = await Promise.all([
      getEmotionLogs(uid, 1000),
      getJournalEntries(uid, 1000),
      getUserValues(uid),
      getCompassEntries(uid),
      getSoulWorkExercises(uid, 1000),
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
        compassEntries: compassEntries.map(entry => ({
          ...entry,
          createdAt: entry.createdAt.toDate().toISOString(),
          updatedAt: entry.updatedAt.toDate().toISOString()
        })),
        soulWorkExercises: soulWorkExercises.map(exercise => ({
          ...exercise,
          completedAt: exercise.completedAt.toDate().toISOString(),
          createdAt: exercise.createdAt.toDate().toISOString()
        })),
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
        totalCompassEntries: compassEntries.length,
        totalSoulWorkExercises: soulWorkExercises.length,
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
export const uploadJournalFile = async (uid: string, file: Blob, entryId: string, fileType: 'voice' | 'video'): Promise<string> => {
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
  files?: { voiceBlob?: Blob; videoBlob?: Blob }
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
    
    // Update the entry with attachment URLs if any files were uploaded
    if (attachmentUrls.length > 0) {
      await updateJournalEntry(uid, entryId, { 
        attachments: attachmentUrls 
      });
    }
    
    return entryId;
  } catch (error) {
    console.error('Error saving journal entry with files:', error);
    throw error;
  }
};

// Function to add a goal log - integrates with compass system
export const addGoalLog = async (uid: string, goalData: {
  goalTitle: string;
  goalType: string;  
  whyMatters?: string;
  deadline?: string;
  progress: number;
}) => {
  try {
    // Get existing compass entries
    const compassEntries = await getCompassEntries(uid);
    let goalsEntry = compassEntries.find(entry => entry.direction === 'south');
    
    // Parse existing goals or create empty array
    let existingGoals = [];
    if (goalsEntry && goalsEntry.notes) {
      try {
        existingGoals = JSON.parse(goalsEntry.notes);
      } catch (e) {
        console.warn('Could not parse existing goals data');
      }
    }
    
    // Create new goal object
    const newGoal = {
      id: Date.now().toString(),
      name: goalData.goalTitle,
      description: goalData.whyMatters || '',
      type: goalData.goalType === 'Short-Term' ? 'short-term' : 'long-term',
      progress: goalData.progress,
      priority: 'Medium',
      targetDeadline: goalData.deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      milestones: [],
      category: 'Personal'
    };
    
    // Add to existing goals
    const updatedGoals = [...existingGoals, newGoal];
    
    // Save back to compass entry
    await saveCompassEntry(uid, 'south', {
      goals: [],
      progress: 0,
      notes: JSON.stringify(updatedGoals)
    });
    
    return newGoal.id;
  } catch (error) {
    console.error('Error adding goal log:', error);
    throw error;
  }
};

// Function to add a habit log - integrates with compass system
export const addHabitLog = async (uid: string, habitData: {
  habitTitle: string;
  habitType: string;
  description?: string;
  whyMatters?: string;
  frequency?: string;
  timeOfDay?: string;
  startDate?: string;
  streakGoal?: number;
  triggerPattern?: string;
  whyQuit?: string;
  currentFrequency?: string;
  replacementHabit?: string;
  awarenessNudges?: boolean;
}) => {
  try {
    // Get existing compass entries
    const compassEntries = await getCompassEntries(uid);
    let habitsEntry = compassEntries.find(entry => entry.direction === 'north');
    
    // Parse existing habits or create empty array
    let existingHabits = [];
    if (habitsEntry && habitsEntry.notes) {
      try {
        existingHabits = JSON.parse(habitsEntry.notes);
      } catch (e) {
        console.warn('Could not parse existing habits data');
      }
    }
    
    // Create new habit object
    const newHabit = {
      id: Date.now().toString(),
      name: habitData.habitTitle,
      description: habitData.description || '',
      type: habitData.habitType === 'Build' ? 'build' : 'break',
      recurrence: habitData.frequency || 'Daily',
      streak: 0,
      lastLogged: 'Never',
      progressStatus: 'New',
      weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
      // Additional fields from the detailed habit drawer
      whyMatters: habitData.whyMatters,
      timeOfDay: habitData.timeOfDay,
      startDate: habitData.startDate,
      streakGoal: habitData.streakGoal,
      triggerPattern: habitData.triggerPattern,
      whyQuit: habitData.whyQuit,
      currentFrequency: habitData.currentFrequency,
      replacementHabit: habitData.replacementHabit,
      awarenessNudges: habitData.awarenessNudges
    };
    
    // Add to existing habits
    const updatedHabits = [...existingHabits, newHabit];
    
    // Save back to compass entry
    await saveCompassEntry(uid, 'north', {
      goals: [],
      progress: 0,
      notes: JSON.stringify(updatedHabits)
    });
    
    return newHabit.id;
  } catch (error) {
    console.error('Error adding habit log:', error);
    throw error;
  }
};
