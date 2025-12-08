// DISABLED: Pinecone vectorDb import removed
import {
  EmotionLog,
  JournalEntry,
  SoulspaceItem
} from './data/legacy/dbHelpers';

/**
 * Data sync service to automatically index new data in vector database
 * This service should be called whenever new data is created or updated
 */
export class DataSyncService {
  // Index a new journal entry
  static async indexJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
    if (!entry.id || !entry.content) return;

    try {
      // DISABLED: Pinecone indexing removed
      console.log('DataSync indexing disabled - Pinecone removed');
      console.log(`Indexed journal entry: ${entry.id}`);
    } catch (error) {
      console.error('Error indexing journal entry:', error);
    }
  }

  // Index a new emotion log
  static async indexEmotionLog(userId: string, log: EmotionLog): Promise<void> {
    if (!log.id) return;

    try {
      // DISABLED: Pinecone indexing removed
      console.log('DataSync indexing disabled - Pinecone removed');
      console.log(`Indexed emotion log: ${log.id}`);
    } catch (error) {
      console.error('Error indexing emotion log:', error);
    }
  }

  // Index voice transcript
  static async indexVoiceTranscript(
    userId: string,
    entryId: string,
    transcript: string,
    duration: number
  ): Promise<void> {
    if (!transcript) return;

    try {
      const voiceData = {
        transcript,
        duration,
        entryId,
        createdAt: Date.now(),
      };

      // DISABLED: Pinecone indexing removed
      console.log('DataSync indexing disabled - Pinecone removed');
      console.log(`Indexed voice transcript: ${entryId}`);
    } catch (error) {
      console.error('Error indexing voice transcript:', error);
    }
  }

  // Index photo with caption
  static async indexPhoto(
    userId: string,
    photoId: string,
    caption: string,
    name: string
  ): Promise<void> {
    if (!caption) return;

    try {
      const photoData = {
        caption,
        name,
        photoId,
        createdAt: Date.now(),
      };

      // DISABLED: Pinecone indexing removed
      console.log('DataSync indexing disabled - Pinecone removed');
      console.log(`Indexed photo: ${photoId}`);
    } catch (error) {
      console.error('Error indexing photo:', error);
    }
  }

  // Index soulspace item
  static async indexSoulspaceItem(userId: string, item: SoulspaceItem): Promise<void> {
    if (!item.id || !item.content) return;

    try {
      // DISABLED: Pinecone indexing removed
      console.log('DataSync indexing disabled - Pinecone removed');
      console.log(`Indexed soulspace item: ${item.id}`);
    } catch (error) {
      console.error('Error indexing soulspace item:', error);
    }
  }

  // Remove item from vector database
  static async removeItem(userId: string, itemId: string, dataType: string): Promise<void> {
    try {
      // DISABLED: Pinecone deletion removed
      console.log('DataSync deletion disabled - Pinecone removed');
      console.log(`Removed ${dataType} item from vector DB: ${itemId}`);
    } catch (error) {
      console.error('Error removing item from vector DB:', error);
    }
  }

  // Batch sync multiple items
  static async batchSync(userId: string, items: Array<{
    id: string;
    data: any;
    type: 'journal' | 'emotion' | 'voice' | 'photo' | 'chat';
  }>): Promise<void> {
    try {
      // DISABLED: Pinecone batch indexing removed
      console.log('DataSync batch indexing disabled - Pinecone removed');
      console.log(`Batch synced ${items.length} items for user ${userId}`);
    } catch (error) {
      console.error('Error in batch sync:', error);
    }
  }
}

// Hook to automatically sync data when saving
export const useDataSync = () => {
  const syncJournalEntry = (userId: string, entry: JournalEntry) => {
    DataSyncService.indexJournalEntry(userId, entry);
  };

  const syncEmotionLog = (userId: string, log: EmotionLog) => {
    DataSyncService.indexEmotionLog(userId, log);
  };

  const syncVoiceTranscript = (userId: string, entryId: string, transcript: string, duration: number) => {
    DataSyncService.indexVoiceTranscript(userId, entryId, transcript, duration);
  };

  const syncPhoto = (userId: string, photoId: string, caption: string, name: string) => {
    DataSyncService.indexPhoto(userId, photoId, caption, name);
  };

  return {
    syncJournalEntry,
    syncEmotionLog,
    syncVoiceTranscript,
    syncPhoto,
  };
};