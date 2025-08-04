/**
 * UNIFIED DATA SYNC SERVICE
 * 
 * This service ensures seamless data flow between:
 * 1. Legacy Firestore collections (journalEntries, emotionLogs)
 * 2. Unified moments collection
 * 3. Vector Database (Pinecone)
 * 4. AI systems
 */

import { 
  JournalEntry, 
  EmotionLog, 
  addJournalEntry, 
  addEmotionLog,
  getJournalEntries,
  getEmotionLogs
} from './dbHelpers';
import { 
  createMoment, 
  getMoments,
  Moment, 
  createVectorMetadata,
  getVectorMetadata,
  updateVectorMetadata 
} from './moments';
import { Timestamp } from 'firebase/firestore';

export interface SyncResult {
  success: boolean;
  operation: string;
  itemId: string;
  errors?: string[];
  vectorIndexed?: boolean;
}

export interface SyncBatchResult {
  successful: number;
  failed: number;
  vectorIndexed: number;
  errors: string[];
  results: SyncResult[];
}

export class UnifiedDataSync {
  
  /**
   * Save journal entry with automatic moment creation and vector indexing
   */
  static async saveJournalEntry(
    userId: string,
    entryData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    options: {
      createMoment?: boolean;
      indexVector?: boolean;
      files?: { voiceBlob?: Blob; videoBlob?: Blob; audioBlobs?: { id: string | number; blob: Blob }[] };
    } = {}
  ): Promise<SyncResult> {
    const { createMoment: shouldCreateMoment = true, indexVector = true } = options;
    
    try {
      // 1. Save to legacy journalEntries collection
      const { saveJournalEntryWithFiles } = await import('./dbHelpers');
      const entryId = await saveJournalEntryWithFiles(userId, entryData, options.files);
      
      let vectorIndexed = false;
      
      if (shouldCreateMoment) {
        // 2. Create unified moment
        const momentData = this.convertJournalToMoment(entryData, userId, entryId);
        const momentId = await createMoment(momentData);
        
        if (indexVector && momentId) {
          // 3. Index in vector database
          try {
            const response = await fetch('/api/vector-system/index', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                moment: { ...momentData, id: momentId },
                force: false 
              }),
            });
            
            const result = await response.json();
            vectorIndexed = result.success;
            
            if (!result.success) {
              console.warn('Vector indexing failed:', result.error);
            }
          } catch (error) {
            console.error('Vector indexing error:', error);
          }
        }
      }
      
      return {
        success: true,
        operation: 'saveJournalEntry',
        itemId: entryId,
        vectorIndexed,
      };
      
    } catch (error) {
      console.error('Error in unified journal entry save:', error);
      return {
        success: false,
        operation: 'saveJournalEntry',
        itemId: '',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
  
  /**
   * Save emotion log with automatic moment creation and vector indexing
   */
  static async saveEmotionLog(
    userId: string,
    logData: Omit<EmotionLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    options: {
      createMoment?: boolean;
      indexVector?: boolean;
    } = {}
  ): Promise<SyncResult> {
    const { createMoment: shouldCreateMoment = true, indexVector = true } = options;
    
    try {
      // 1. Save to legacy emotionLogs collection
      const docRef = await addEmotionLog(userId, logData);
      const logId = docRef.id;
      
      let vectorIndexed = false;
      
      if (shouldCreateMoment) {
        // 2. Create unified moment
        const momentData = this.convertEmotionToMoment(logData, userId, logId);
        const momentId = await createMoment(momentData);
        
        if (indexVector && momentId) {
          // 3. Index in vector database
          try {
            const response = await fetch('/api/vector-system/index', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                moment: { ...momentData, id: momentId },
                force: false 
              }),
            });
            
            const result = await response.json();
            vectorIndexed = result.success;
            
            if (!result.success) {
              console.warn('Vector indexing failed:', result.error);
            }
          } catch (error) {
            console.error('Vector indexing error:', error);
          }
        }
      }
      
      return {
        success: true,
        operation: 'saveEmotionLog',
        itemId: logId,
        vectorIndexed,
      };
      
    } catch (error) {
      console.error('Error in unified emotion log save:', error);
      return {
        success: false,
        operation: 'saveEmotionLog',
        itemId: '',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
  
  /**
   * Create a moment directly with vector indexing
   */
  static async createMomentWithVectorIndex(
    momentData: Omit<Moment, 'id' | 'createdAt' | 'updatedAt'>,
    options: {
      indexVector?: boolean;
    } = {}
  ): Promise<SyncResult> {
    const { indexVector = true } = options;
    
    try {
      // 1. Create moment
      const momentId = await createMoment(momentData);
      
      let vectorIndexed = false;
      
      if (indexVector && momentId) {
        // 2. Index in vector database
        try {
          const response = await fetch('/api/vector-system/index', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              moment: { ...momentData, id: momentId },
              force: false 
            }),
          });
          
          const result = await response.json();
          vectorIndexed = result.success;
          
          if (!result.success) {
            console.warn('Vector indexing failed:', result.error);
          }
        } catch (error) {
          console.error('Vector indexing error:', error);
        }
      }
      
      return {
        success: true,
        operation: 'createMoment',
        itemId: momentId,
        vectorIndexed,
      };
      
    } catch (error) {
      console.error('Error creating moment:', error);
      return {
        success: false,
        operation: 'createMoment',
        itemId: '',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
  
  /**
   * Migrate existing data to unified moments collection
   */
  static async migrateUserDataToMoments(
    userId: string,
    options: {
      batchSize?: number;
      includeVectorIndexing?: boolean;
      onProgress?: (progress: { completed: number; total: number; currentType: string }) => void;
    } = {}
  ): Promise<SyncBatchResult> {
    const { batchSize = 50, includeVectorIndexing = true, onProgress } = options;
    const results: SyncResult[] = [];
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;
    let vectorIndexed = 0;
    
    try {
      // Get all existing data
      const [journalEntries, emotionLogs] = await Promise.all([
        getJournalEntries(userId, 1000),
        getEmotionLogs(userId, 1000),
      ]);
      
      const totalItems = journalEntries.length + emotionLogs.length;
      let completed = 0;
      
      // Migrate journal entries
      onProgress?.({ completed, total: totalItems, currentType: 'journal entries' });
      
      for (const entry of journalEntries) {
        try {
          if (!entry.id) continue;
          
          const momentData = this.convertJournalToMoment(entry, userId, entry.id);
          const result = await this.createMomentWithVectorIndex(momentData, { 
            indexVector: includeVectorIndexing 
          });
          
          results.push(result);
          if (result.success) {
            successful++;
            if (result.vectorIndexed) vectorIndexed++;
          } else {
            failed++;
            if (result.errors) errors.push(...result.errors);
          }
          
          completed++;
          onProgress?.({ completed, total: totalItems, currentType: 'journal entries' });
          
        } catch (error) {
          failed++;
          errors.push(`Journal entry ${entry.id}: ${error}`);
          completed++;
        }
      }
      
      // Migrate emotion logs
      onProgress?.({ completed, total: totalItems, currentType: 'emotion logs' });
      
      for (const log of emotionLogs) {
        try {
          if (!log.id) continue;
          
          const momentData = this.convertEmotionToMoment(log, userId, log.id);
          const result = await this.createMomentWithVectorIndex(momentData, { 
            indexVector: includeVectorIndexing 
          });
          
          results.push(result);
          if (result.success) {
            successful++;
            if (result.vectorIndexed) vectorIndexed++;
          } else {
            failed++;
            if (result.errors) errors.push(...result.errors);
          }
          
          completed++;
          onProgress?.({ completed, total: totalItems, currentType: 'emotion logs' });
          
        } catch (error) {
          failed++;
          errors.push(`Emotion log ${log.id}: ${error}`);
          completed++;
        }
      }
      
      console.log(`Migration completed: ${successful} successful, ${failed} failed, ${vectorIndexed} vector indexed`);
      
      return {
        successful,
        failed,
        vectorIndexed,
        errors,
        results,
      };
      
    } catch (error) {
      console.error('Migration failed:', error);
      return {
        successful,
        failed,
        vectorIndexed,
        errors: [...errors, `Migration failed: ${error}`],
        results,
      };
    }
  }
  
  /**
   * Re-index all moments for vector search
   */
  static async reindexUserVectors(userId: string): Promise<SyncBatchResult> {
    const results: SyncResult[] = [];
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;
    let vectorIndexed = 0;
    
    try {
      // Get all moments
      const moments = await getMoments(userId, { limit: 1000 });
      
      // Batch index them
      const response = await fetch('/api/vector-system/batch-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moments }),
      });
      
      const batchResult = await response.json();
      
      if (batchResult.success) {
        successful = batchResult.batchResult?.successful || 0;
        failed = batchResult.batchResult?.failed || 0;
        vectorIndexed = successful; // All successful operations were vector indexed
        
        // Create results array
        moments.forEach((moment, index) => {
          const isSuccessful = index < successful;
          results.push({
            success: isSuccessful,
            operation: 'reindexVector',
            itemId: moment.id || '',
            vectorIndexed: isSuccessful,
          });
        });
      } else {
        failed = moments.length;
        errors.push('Batch reindexing failed');
      }
      
      return {
        successful,
        failed,
        vectorIndexed,
        errors,
        results,
      };
      
    } catch (error) {
      console.error('Vector reindexing failed:', error);
      return {
        successful,
        failed,
        vectorIndexed,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        results,
      };
    }
  }
  
  /**
   * Get sync status for a user
   */
  static async getSyncStatus(userId: string): Promise<{
    totalJournalEntries: number;
    totalEmotionLogs: number;
    totalMoments: number;
    vectorIndexed: number;
    needsMigration: boolean;
    needsReindexing: boolean;
  }> {
    try {
      const [journalEntries, emotionLogs, moments] = await Promise.all([
        getJournalEntries(userId, 1000),
        getEmotionLogs(userId, 1000),
        getMoments(userId, { limit: 1000 }),
      ]);
      
      // Get vector system status
      let vectorIndexed = 0;
      try {
        const response = await fetch(`/api/vector-system/status?userId=${userId}`);
        const statusResult = await response.json();
        vectorIndexed = statusResult.status?.indexed || 0;
      } catch (error) {
        console.warn('Could not get vector status:', error);
      }
      
      const totalLegacyItems = journalEntries.length + emotionLogs.length;
      const needsMigration = totalLegacyItems > moments.length;
      const needsReindexing = moments.length > vectorIndexed;
      
      return {
        totalJournalEntries: journalEntries.length,
        totalEmotionLogs: emotionLogs.length,
        totalMoments: moments.length,
        vectorIndexed,
        needsMigration,
        needsReindexing,
      };
      
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        totalJournalEntries: 0,
        totalEmotionLogs: 0,
        totalMoments: 0,
        vectorIndexed: 0,
        needsMigration: false,
        needsReindexing: false,
      };
    }
  }
  
  // Helper methods for data conversion
  private static convertJournalToMoment(
    entry: JournalEntry | Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    userId: string,
    entryId: string
  ): Omit<Moment, 'id' | 'createdAt' | 'updatedAt'> {
    const content = entry.title ? `${entry.title}\n\n${entry.content}` : entry.content;
    
    return {
      userId,
      type: 'journal',
      title: entry.title,
      content,
      timestamp: entry.date || Timestamp.now(),
      mood: entry.mood,
      emotions: entry.emotions,
      attachments: entry.attachments,
      journalData: {
        entryType: entry.entryType,
        prompt: entry.prompt,
        isDraft: entry.isDraft,
        wordCount: content.split(' ').length,
      },
    };
  }
  
  private static convertEmotionToMoment(
    log: EmotionLog | Omit<EmotionLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    userId: string,
    logId: string
  ): Omit<Moment, 'id' | 'createdAt' | 'updatedAt'> {
    const content = `Mood: ${log.mood}/6
Emotions: ${log.emotions.join(', ')}
${log.triggers ? `Triggers: ${log.triggers.join(', ')}` : ''}
${log.context ? `Context: ${log.context}` : ''}
${log.intensity ? `Intensity: ${log.intensity}/10` : ''}`;
    
    return {
      userId,
      type: 'emotion',
      content,
      timestamp: (log as EmotionLog).createdAt || Timestamp.now(),
      mood: log.mood,
      emotions: log.emotions,
      triggers: log.triggers,
      intensity: log.intensity,
      emotionData: {
        context: log.context,
      },
    };
  }
}

// Export hook for React components
export const useUnifiedDataSync = () => {
  const saveJournalEntry = (
    userId: string,
    entryData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    options?: Parameters<typeof UnifiedDataSync.saveJournalEntry>[2]
  ) => UnifiedDataSync.saveJournalEntry(userId, entryData, options);
  
  const saveEmotionLog = (
    userId: string,
    logData: Omit<EmotionLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    options?: Parameters<typeof UnifiedDataSync.saveEmotionLog>[2]
  ) => UnifiedDataSync.saveEmotionLog(userId, logData, options);
  
  const createMoment = (
    momentData: Omit<Moment, 'id' | 'createdAt' | 'updatedAt'>,
    options?: Parameters<typeof UnifiedDataSync.createMomentWithVectorIndex>[1]
  ) => UnifiedDataSync.createMomentWithVectorIndex(momentData, options);
  
  const getSyncStatus = (userId: string) => UnifiedDataSync.getSyncStatus(userId);
  
  const migrateData = (
    userId: string,
    options?: Parameters<typeof UnifiedDataSync.migrateUserDataToMoments>[1]
  ) => UnifiedDataSync.migrateUserDataToMoments(userId, options);
  
  const reindexVectors = (userId: string) => UnifiedDataSync.reindexUserVectors(userId);
  
  return {
    saveJournalEntry,
    saveEmotionLog,
    createMoment,
    getSyncStatus,
    migrateData,
    reindexVectors,
  };
};

export default UnifiedDataSync;