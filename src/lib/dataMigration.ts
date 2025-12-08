/**
 * NOTE: This file was flagged as LEGACY / AMBIGUOUS by static analysis.
 * It contains migration logic that may be useful for operations but appears unused in the active application flow.
 * Recommended Action: Review for archival or deletion if no longer needed.
 */
import { Timestamp } from "firebase/firestore";
import {
  getJournalEntries,
  getEmotionLogs,
  JournalEntry,
  EmotionLog
} from "./data/legacy/dbHelpers";
import {
  createMoment,
  createVectorMetadata,
  Moment,
  VectorMetadata
} from "./moments";

/* ---------- MIGRATION UTILITIES ---------- */

export interface MigrationProgress {
  total: number;
  completed: number;
  errors: number;
  currentType: string;
  status: 'running' | 'completed' | 'failed';
}

export type MigrationCallback = (progress: MigrationProgress) => void;

/* ---------- CONVERSION FUNCTIONS ---------- */

export const convertJournalEntryToMoment = (entry: JournalEntry): Omit<Moment, 'id' | 'createdAt' | 'updatedAt'> => {
  // Determine content - combine title and content
  const content = entry.title ? `${entry.title}\n\n${entry.content}` : entry.content;

  // Extract basic emotional data
  const mood = entry.mood;
  const emotions = entry.emotions || [];

  // Process carousel content for attachments
  const attachments: string[] = [];
  let additionalContent = content;

  if (entry.carouselContent) {
    // Add photo information to content
    if (entry.carouselContent.photos?.length > 0) {
      const photoDescriptions = entry.carouselContent.photos
        .map(photo => `Photo: ${photo.caption || photo.name}`)
        .join('\n');
      additionalContent += '\n\nPhotos:\n' + photoDescriptions;

      // Add photo URLs to attachments
      entry.carouselContent.photos.forEach(photo => {
        if (photo.url) attachments.push(photo.url);
      });
    }

    // Add emotion logs to content
    if (entry.carouselContent.emotions?.length > 0) {
      const emotionDescriptions = entry.carouselContent.emotions
        .map(emotion => `Emotion: ${emotion.emotion} (intensity: ${emotion.intensity}) - ${emotion.note}`)
        .join('\n');
      additionalContent += '\n\nEmotion Logs:\n' + emotionDescriptions;
    }

    // Add audio recordings to content
    if (entry.carouselContent.audioRecordings?.length > 0) {
      const audioDescriptions = entry.carouselContent.audioRecordings
        .map(audio => `Audio: ${audio.transcript} (${audio.duration}s)`)
        .join('\n');
      additionalContent += '\n\nAudio Recordings:\n' + audioDescriptions;

      // Add audio URLs to attachments
      entry.carouselContent.audioRecordings.forEach(audio => {
        if (audio.audioUrl) attachments.push(audio.audioUrl);
      });
    }
  }

  // Add existing attachments
  if (entry.attachments) {
    attachments.push(...entry.attachments);
  }

  const moment: Omit<Moment, 'id' | 'createdAt' | 'updatedAt'> = {
    userId: entry.userId,
    type: 'journal',
    title: entry.title,
    content: additionalContent,
    timestamp: entry.date,
    mood,
    emotions,
    attachments: attachments.length > 0 ? attachments : undefined,
    journalData: {
      entryType: entry.entryType,
      prompt: entry.prompt,
      isDraft: entry.isDraft,
      wordCount: additionalContent.split(' ').length,
    },
  };

  return moment;
};

export const convertEmotionLogToMoment = (log: EmotionLog): Omit<Moment, 'id' | 'createdAt' | 'updatedAt'> => {
  // Create content from emotion log data
  const content = `Mood: ${log.mood}/6
Emotions: ${log.emotions.join(', ')}
${log.triggers ? `Triggers: ${log.triggers.join(', ')}` : ''}
${log.context ? `Context: ${log.context}` : ''}
${log.intensity ? `Intensity: ${log.intensity}/10` : ''}`;

  const moment: Omit<Moment, 'id' | 'createdAt' | 'updatedAt'> = {
    userId: log.userId,
    type: 'emotion',
    content,
    timestamp: log.createdAt,
    mood: log.mood,
    emotions: log.emotions,
    triggers: log.triggers,
    intensity: log.intensity,
    emotionData: {
      context: log.context,
    },
  };

  return moment;
};

/* ---------- MIGRATION FUNCTIONS ---------- */

export const migrateUserData = async (
  userId: string,
  onProgress?: MigrationCallback
): Promise<{
  success: boolean;
  totalMigrated: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  let totalMigrated = 0;

  try {
    // Get all existing data
    console.log('Fetching existing data for migration...');

    const [journalEntries, emotionLogs] = await Promise.all([
      getJournalEntries(userId, 1000),
      getEmotionLogs(userId, 1000),
    ]);

    const totalItems = journalEntries.length + emotionLogs.length;
    let completed = 0;

    const updateProgress = (currentType: string) => {
      if (onProgress) {
        onProgress({
          total: totalItems,
          completed,
          errors: errors.length,
          currentType,
          status: 'running',
        });
      }
    };

    // Migrate journal entries
    console.log(`Migrating ${journalEntries.length} journal entries...`);
    updateProgress('journal entries');

    for (const entry of journalEntries) {
      try {
        const moment = convertJournalEntryToMoment(entry);
        const momentId = await createMoment(moment);

        // Create vector metadata entry
        await createVectorMetadata({
          userId,
          momentId,
          vectorId: `journal_${entry.id}`,
          indexed: false,
          dimensions: 4096,
          model: 'Qwen/Qwen3-Embedding-8B',
          contentPreview: moment.content.substring(0, 200),
          searchableText: moment.content,
          momentType: 'journal',
          emotionContext: moment.mood || moment.emotions ? {
            mood: moment.mood,
            emotions: moment.emotions,
            triggers: moment.triggers,
          } : undefined,
          timeContext: {
            timestamp: moment.timestamp,
            dayOfWeek: moment.timestamp.toDate().getDay(),
            hourOfDay: moment.timestamp.toDate().getHours(),
            season: getSeason(moment.timestamp.toDate()),
          },
        });

        totalMigrated++;
        completed++;
      } catch (error) {
        errors.push(`Journal entry ${entry.id}: ${error}`);
        completed++;
      }
    }

    // Migrate emotion logs
    console.log(`Migrating ${emotionLogs.length} emotion logs...`);
    updateProgress('emotion logs');

    for (const log of emotionLogs) {
      try {
        const moment = convertEmotionLogToMoment(log);
        const momentId = await createMoment(moment);

        // Create vector metadata entry
        await createVectorMetadata({
          userId,
          momentId,
          vectorId: `emotion_${log.id}`,
          indexed: false,
          dimensions: 4096,
          model: 'Qwen/Qwen3-Embedding-8B',
          contentPreview: moment.content.substring(0, 200),
          searchableText: moment.content,
          momentType: 'emotion',
          emotionContext: {
            mood: moment.mood,
            emotions: moment.emotions,
            triggers: moment.triggers,
          },
          timeContext: {
            timestamp: moment.timestamp,
            dayOfWeek: moment.timestamp.toDate().getDay(),
            hourOfDay: moment.timestamp.toDate().getHours(),
            season: getSeason(moment.timestamp.toDate()),
          },
        });

        totalMigrated++;
        completed++;
      } catch (error) {
        errors.push(`Emotion log ${log.id}: ${error}`);
        completed++;
      }
    }

    // Final progress update
    if (onProgress) {
      onProgress({
        total: totalItems,
        completed,
        errors: errors.length,
        currentType: 'completed',
        status: 'completed',
      });
    }

    console.log(`Migration completed: ${totalMigrated} items migrated, ${errors.length} errors`);

    return {
      success: errors.length < totalItems / 2, // Success if less than 50% errors
      totalMigrated,
      errors,
    };

  } catch (error) {
    console.error('Migration failed:', error);

    if (onProgress) {
      onProgress({
        total: 0,
        completed: 0,
        errors: 1,
        currentType: 'failed',
        status: 'failed',
      });
    }

    return {
      success: false,
      totalMigrated,
      errors: [...errors, `Migration failed: ${error}`],
    };
  }
};

/* ---------- BATCH MIGRATION FOR VECTOR INDEXING ---------- */

export const prepareMomentsForVectorIndexing = async (
  userId: string,
  batchSize = 50
): Promise<Array<{
  id: string;
  data: any;
  type: 'journal' | 'emotion' | 'voice' | 'photo' | 'chat';
}>> => {
  try {
    // Get all existing data
    const [journalEntries, emotionLogs] = await Promise.all([
      getJournalEntries(userId, 1000),
      getEmotionLogs(userId, 1000),
    ]);

    const items: Array<{
      id: string;
      data: any;
      type: 'journal' | 'emotion' | 'voice' | 'photo' | 'chat';
    }> = [];

    // Convert journal entries
    journalEntries.forEach(entry => {
      if (entry.content && entry.id) {
        const moment = convertJournalEntryToMoment(entry);
        items.push({
          id: entry.id,
          data: moment,
          type: 'journal',
        });
      }
    });

    // Convert emotion logs
    emotionLogs.forEach(log => {
      if (log.id) {
        const moment = convertEmotionLogToMoment(log);
        items.push({
          id: log.id,
          data: moment,
          type: 'emotion',
        });
      }
    });

    return items.slice(0, batchSize);
  } catch (error) {
    console.error('Error preparing moments for vector indexing:', error);
    return [];
  }
};

/* ---------- HELPER FUNCTIONS ---------- */

const getSeason = (date: Date): string => {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
};

/* ---------- DATA VALIDATION ---------- */

export const validateMigration = async (userId: string): Promise<{
  isValid: boolean;
  issues: string[];
  statistics: {
    totalMoments: number;
    byType: Record<string, number>;
    withMood: number;
    withEmotions: number;
    withAttachments: number;
  };
}> => {
  try {
    // This would need to be implemented using the moments service
    // For now, return a placeholder
    return {
      isValid: true,
      issues: [],
      statistics: {
        totalMoments: 0,
        byType: {},
        withMood: 0,
        withEmotions: 0,
        withAttachments: 0,
      },
    };
  } catch (error) {
    return {
      isValid: false,
      issues: [`Validation failed: ${error}`],
      statistics: {
        totalMoments: 0,
        byType: {},
        withMood: 0,
        withEmotions: 0,
        withAttachments: 0,
      },
    };
  }
};