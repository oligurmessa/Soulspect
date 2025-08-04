import { vectorDb } from './vectorDb';
import { 
  getMoments, 
  getVectorMetadata, 
  updateVectorMetadata,
  createVectorMetadata,
  Moment,
  VectorMetadata 
} from './moments';
import { Timestamp } from 'firebase/firestore';

/* ---------- VECTOR INDEXING FOR MOMENTS ---------- */

export class MomentVectorService {
  
  // Index a single moment
  async indexMoment(moment: Moment): Promise<void> {
    if (!moment.id) {
      throw new Error('Moment must have an ID to be indexed');
    }

    try {
      // Check if already indexed
      const existingMetadata = await getVectorMetadata(moment.userId, moment.id);
      
      if (existingMetadata && existingMetadata.indexed) {
        console.log(`Moment ${moment.id} already indexed, skipping`);
        return;
      }

      // Index with vector database
      await vectorDb.indexItem(
        moment.userId,
        moment.id,
        moment,
        moment.type as any // Type assertion for legacy compatibility
      );

      // Create or update vector metadata
      const vectorId = `${moment.type}_${moment.id}`;
      const timeContext = {
        timestamp: moment.timestamp,
        dayOfWeek: moment.timestamp.toDate().getDay(),
        hourOfDay: moment.timestamp.toDate().getHours(),
        season: this.getSeason(moment.timestamp.toDate()),
      };

      if (existingMetadata) {
        // Update existing metadata
        await updateVectorMetadata(moment.userId, existingMetadata.id!, {
          indexed: true,
          indexedAt: Timestamp.now(),
          vectorId,
          contentPreview: moment.content.substring(0, 200),
          searchableText: this.createSearchableText(moment),
          emotionContext: this.createEmotionContext(moment),
          timeContext,
        });
      } else {
        // Create new metadata
        await createVectorMetadata({
          userId: moment.userId,
          momentId: moment.id,
          vectorId,
          indexed: true,
          indexedAt: Timestamp.now(),
          dimensions: 3072,
          model: 'text-embedding-3-large',
          contentPreview: moment.content.substring(0, 200),
          searchableText: this.createSearchableText(moment),
          momentType: moment.type,
          emotionContext: this.createEmotionContext(moment),
          timeContext,
        });
      }

      console.log(`Successfully indexed moment ${moment.id} (${moment.type})`);
    } catch (error) {
      console.error(`Error indexing moment ${moment.id}:`, error);
      throw error;
    }
  }

  // Batch index multiple moments
  async batchIndexMoments(userId: string, moments: Moment[]): Promise<{
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Prepare items for vector database
    const items = moments
      .filter(m => m.id && m.content.trim().length > 0)
      .map(moment => ({
        id: moment.id!,
        data: moment,
        type: moment.type as any, // Legacy compatibility
      }));

    try {
      // Batch index with vector database
      await vectorDb.batchIndex(userId, items);

      // Update metadata for all moments
      for (const moment of moments) {
        if (!moment.id) continue;

        try {
          const existingMetadata = await getVectorMetadata(userId, moment.id);
          const vectorId = `${moment.type}_${moment.id}`;
          const timeContext = {
            timestamp: moment.timestamp,
            dayOfWeek: moment.timestamp.toDate().getDay(),
            hourOfDay: moment.timestamp.toDate().getHours(),
            season: this.getSeason(moment.timestamp.toDate()),
          };

          if (existingMetadata) {
            await updateVectorMetadata(userId, existingMetadata.id!, {
              indexed: true,
              indexedAt: Timestamp.now(),
              vectorId,
              contentPreview: moment.content.substring(0, 200),
              searchableText: this.createSearchableText(moment),
              emotionContext: this.createEmotionContext(moment),
              timeContext,
            });
          } else {
            await createVectorMetadata({
              userId,
              momentId: moment.id,
              vectorId,
              indexed: true,
              indexedAt: Timestamp.now(),
              dimensions: 3072,
              model: 'text-embedding-3-large',
              contentPreview: moment.content.substring(0, 200),
              searchableText: this.createSearchableText(moment),
              momentType: moment.type,
              emotionContext: this.createEmotionContext(moment),
              timeContext,
            });
          }

          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Moment ${moment.id}: ${error}`);
        }
      }

      console.log(`Batch indexing completed: ${results.successful} successful, ${results.failed} failed`);
      return results;

    } catch (error) {
      console.error('Batch indexing failed:', error);
      results.failed = moments.length;
      results.errors.push(`Batch indexing failed: ${error}`);
      return results;
    }
  }

  // Search moments using vector similarity
  async searchMoments(
    userId: string,
    query: string,
    options: {
      topK?: number;
      type?: Moment['type'];
      emotions?: string[];
      dateRange?: { start: Date; end: Date };
      moodRange?: { min: number; max: number };
      includeMetadata?: boolean;
    } = {}
  ): Promise<Array<{
    moment: Moment | null;
    score: number;
    metadata: any;
  }>> {
    try {
      // Build filter for vector search
      const filter: any = { userId };

      if (options.type) {
        filter.dataType = options.type;
      }

      if (options.emotions?.length) {
        // This would need to be handled at the query level
        // For now, we'll filter results after retrieval
      }

      if (options.moodRange) {
        // Similarly, mood filtering would be done post-retrieval
      }

      // Perform vector search
      const vectorResults = await vectorDb.search(userId, query, {
        topK: options.topK || 10,
        filter,
        includeMetadata: options.includeMetadata !== false,
      });

      // Fetch full moment data and apply additional filters
      const results = [];
      for (const result of vectorResults) {
        try {
          const momentId = result.metadata.originalId || result.id.split('_').slice(1).join('_');
          const moment = await this.getMomentById(userId, momentId);

          if (!moment) continue;

          // Apply additional filters
          if (options.emotions?.length && moment.emotions) {
            const hasMatchingEmotion = options.emotions.some(emotion => 
              moment.emotions!.includes(emotion)
            );
            if (!hasMatchingEmotion) continue;
          }

          if (options.moodRange && moment.mood !== undefined) {
            if (moment.mood < options.moodRange.min || moment.mood > options.moodRange.max) {
              continue;
            }
          }

          if (options.dateRange) {
            const momentDate = moment.timestamp.toDate();
            if (momentDate < options.dateRange.start || momentDate > options.dateRange.end) {
              continue;
            }
          }

          results.push({
            moment,
            score: result.score,
            metadata: result.metadata,
          });

        } catch (error) {
          console.error(`Error fetching moment for result:`, error);
        }
      }

      return results;

    } catch (error) {
      console.error('Error searching moments:', error);
      return [];
    }
  }

  // Find similar moments to a given moment
  async findSimilarMoments(
    userId: string,
    referenceId: string,
    type?: Moment['type'],
    topK = 5
  ): Promise<Array<{
    moment: Moment | null;
    score: number;
  }>> {
    try {
      const referenceMoment = await this.getMomentById(userId, referenceId);
      if (!referenceMoment) {
        throw new Error('Reference moment not found');
      }

      const vectorResults = await vectorDb.findSimilar(
        userId,
        referenceId,
        (type || referenceMoment.type) as any,
        topK
      );

      const results = [];
      for (const result of vectorResults) {
        try {
          const momentId = result.metadata.originalId || result.id.split('_').slice(1).join('_');
          const moment = await this.getMomentById(userId, momentId);

          if (moment) {
            results.push({
              moment,
              score: result.score,
            });
          }
        } catch (error) {
          console.error('Error fetching similar moment:', error);
        }
      }

      return results;

    } catch (error) {
      console.error('Error finding similar moments:', error);
      return [];
    }
  }

  // Re-index all moments for a user
  async reindexUserMoments(userId: string): Promise<{
    total: number;
    indexed: number;
    failed: number;
    errors: string[];
  }> {
    try {
      console.log(`Starting reindexing for user ${userId}`);

      // Get all moments
      const moments = await getMoments(userId, { limit: 1000 });
      
      const result = await this.batchIndexMoments(userId, moments);

      return {
        total: moments.length,
        indexed: result.successful,
        failed: result.failed,
        errors: result.errors,
      };

    } catch (error) {
      console.error('Error reindexing user moments:', error);
      return {
        total: 0,
        indexed: 0,
        failed: 1,
        errors: [`Reindexing failed: ${error}`],
      };
    }
  }

  // Helper methods
  private async getMomentById(userId: string, momentId: string): Promise<Moment | null> {
    try {
      const { getMoment } = await import('./moments');
      return await getMoment(userId, momentId);
    } catch (error) {
      console.error(`Error fetching moment ${momentId}:`, error);
      return null;
    }
  }

  private createSearchableText(moment: Moment): string {
    const parts = [moment.content];
    
    if (moment.title) parts.unshift(moment.title);
    if (moment.emotions?.length) parts.push(`emotions: ${moment.emotions.join(' ')}`);
    if (moment.triggers?.length) parts.push(`triggers: ${moment.triggers.join(' ')}`);
    if (moment.tags?.length) parts.push(`tags: ${moment.tags.join(' ')}`);
    
    return parts.join(' ').toLowerCase();
  }

  private createEmotionContext(moment: Moment): VectorMetadata['emotionContext'] | undefined {
    if (moment.mood !== undefined || moment.emotions?.length || moment.triggers?.length) {
      return {
        mood: moment.mood,
        emotions: moment.emotions,
        triggers: moment.triggers,
      };
    }
    return undefined;
  }

  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
}

// Export singleton instance
export const momentVectorService = new MomentVectorService();