import { vectorDb } from './vectorDbChroma';
import { Moment, VectorMetadata } from './types';
import {
  getMomentsServer,
  getVectorMetadataServer,
  updateVectorMetadataServer,
  createVectorMetadataServer
} from './moments-server';
import { Timestamp } from 'firebase/firestore';
import { normalizeTimestampToDate, getTimeContext, normalizeTimestampForChroma } from './timestampUtils';

/* ---------- VECTOR INDEXING FOR MOMENTS ---------- */

export class MomentVectorService {

  // Index a single moment
  async indexMoment(moment: Moment, force = false): Promise<void> {
    if (!moment.id) {
      throw new Error('Moment must have an ID to be indexed');
    }

    try {
      // Check if already indexed - use server-side function when available
      const existingMetadata = await this.getVectorMetadataSafe(moment.userId, moment.id);

      // If force=true, delete existing vector before reindexing
      if (force && existingMetadata && existingMetadata.indexed) {
        console.log(`[MomentVectorService] Force reindexing moment ${moment.id} - deleting old vector`);
        try {
          await vectorDb.deleteItem(moment.userId, moment.id);
        } catch (deleteError) {
          console.warn(`[MomentVectorService] Error deleting old vector (may not exist):`, deleteError);
          // Continue with indexing even if delete fails
        }
      } else if (existingMetadata && existingMetadata.indexed && !force) {
        console.log(`Moment ${moment.id} already indexed, skipping (use force=true to reindex)`);
        return;
      }

      // Index with vector database
      await vectorDb.indexItem(
        moment.userId,
        moment.id,
        moment,
        moment.type as any // Type assertion for legacy compatibility
      );

      // Create or update vector metadata - use server-side function when available
      const vectorId = `${moment.type}_${moment.id}`;
      const timeContextRaw = getTimeContext(moment.timestamp);
      // Convert timestamp number to Timestamp object
      const timeContext = {
        ...timeContextRaw,
        timestamp: moment.timestamp instanceof Timestamp ? moment.timestamp : Timestamp.fromDate(normalizeTimestampToDate(moment.timestamp))
      };

      if (existingMetadata) {
        // Update existing metadata
        await this.updateVectorMetadataSafe(moment.userId, existingMetadata.id!, {
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
        await this.createVectorMetadataSafe({
          userId: moment.userId,
          momentId: moment.id,
          vectorId,
          indexed: true,
          indexedAt: Timestamp.now(),
          dimensions: 4096,
          model: 'Qwen/Qwen3-Embedding-8B',
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
      const vectorResult = await vectorDb.batchIndex(userId, items);

      // Vector indexing results
      results.successful = vectorResult.successful;
      results.failed = vectorResult.failed;

      // Update metadata for all moments (optional - failures don't affect success count)
      // Metadata is stored in ChromaDB, so Firestore metadata is just for tracking
      for (const moment of moments) {
        if (!moment.id) continue;

        try {
          const existingMetadata = await this.getVectorMetadataSafe(userId, moment.id);
          const vectorId = `${moment.type}_${moment.id}`;
          const timeContextRaw = getTimeContext(moment.timestamp);
          // Convert timestamp number to Timestamp object
          const timeContext = {
            ...timeContextRaw,
            timestamp: moment.timestamp instanceof Timestamp ? moment.timestamp : Timestamp.fromDate(normalizeTimestampToDate(moment.timestamp))
          };

          if (existingMetadata) {
            await this.updateVectorMetadataSafe(userId, existingMetadata.id!, {
              indexed: true,
              indexedAt: Timestamp.now(),
              vectorId,
              contentPreview: moment.content.substring(0, 200),
              searchableText: this.createSearchableText(moment),
              emotionContext: this.createEmotionContext(moment),
              timeContext,
            });
          } else {
            await this.createVectorMetadataSafe({
              userId,
              momentId: moment.id,
              vectorId,
              indexed: true,
              indexedAt: Timestamp.now(),
              dimensions: 4096,
              model: 'Qwen/Qwen3-Embedding-8B',
              contentPreview: moment.content.substring(0, 200),
              searchableText: this.createSearchableText(moment),
              momentType: moment.type,
              emotionContext: this.createEmotionContext(moment),
              timeContext,
            });
          }
        } catch (error) {
          // Metadata update failed, but vector indexing succeeded
          // Log warning but don't count as failure
          console.warn(`[MomentVectorService] Metadata update failed for moment ${moment.id}:`, error);
          results.errors.push(`Moment ${moment.id} metadata update: ${error}`);
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
      // Build filter for ChromaDB - only use $and when multiple conditions
      const filter: any = {};

      if (options.type) {
        filter.type = options.type;
      }

      // Note: Additional filters (emotions, mood, dateRange) are applied post-retrieval
      // from ChromaDB metadata to avoid complex query logic

      // Perform vector search
      const vectorResults = await vectorDb.search(userId, query, {
        topK: options.topK || 10,
        filter,
        includeMetadata: options.includeMetadata !== false,
      });

      // Build context directly from ChromaDB metadata - NO Firestore calls
      const results = [];
      for (const result of vectorResults) {
        try {
          const metadata = result.metadata as any;

          // Extract momentId from ChromaDB document ID or metadata
          const momentId = (metadata as any).momentId || result.id.split('_').slice(1).join('_');

          // Build content from multiple possible sources
          const content = metadata.content || (result as any).document || metadata.preview || metadata.cleanedText || '';

          // Debug logging for content issues
          if (!content) {
            console.warn(`[VECTOR] Missing content for moment ${momentId}:`, {
              hasMetadataContent: !!metadata.content,
              hasDocument: !!(result as any).document,
              hasPreview: !!metadata.preview,
              hasCleanedText: !!metadata.cleanedText,
              metadataKeys: Object.keys(metadata || {}),
              documentLength: (result as any).document?.length || 0,
              previewLength: metadata.preview?.length || 0
            });
          }

          const moment = {
            id: momentId,
            userId: metadata.userId,
            type: metadata.type,
            title: metadata.title,
            content: content,
            mood: metadata.mood,
            emotions: metadata.emotions || [],
            triggers: metadata.triggers || [],
            tags: metadata.tags || [],
            intensity: metadata.intensity,
            timestamp: metadata.timestamp,
            createdAt: metadata.timestamp, // Fallback
            updatedAt: metadata.timestamp  // Fallback
          };

          // Apply additional filters using metadata
          if (options.emotions?.length && metadata.emotions) {
            const hasMatchingEmotion = options.emotions.some(emotion =>
              metadata.emotions.includes(emotion)
            );
            if (!hasMatchingEmotion) continue;
          }

          if (options.moodRange && metadata.mood !== undefined) {
            if (metadata.mood < options.moodRange.min || metadata.mood > options.moodRange.max) {
              continue;
            }
          }

          if (options.dateRange) {
            const momentDate = normalizeTimestampToDate(metadata.timestamp);
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
          console.error(`Error processing vector result:`, error);
        }
      }

      return results;

    } catch (error) {
      console.error('Error searching moments:', error);
      return [];
    }
  }

  // Search moments using a pre-computed vector (Optimization)
  async searchMomentsByVector(
    userId: string,
    vector: number[],
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
      // Build filter for ChromaDB
      const filter: any = {};
      if (options.type) {
        filter.type = options.type;
      }

      // Perform vector search using the pre-computed vector
      const vectorResults = await vectorDb.searchByVector(userId, vector, {
        topK: options.topK || 10,
        filter,
        includeMetadata: options.includeMetadata !== false,
      });

      // Build context directly from ChromaDB metadata
      const results = [];
      for (const result of vectorResults) {
        try {
          const metadata = result.metadata as any;
          const momentId = (metadata as any).momentId || result.id.split('_').slice(1).join('_');
          const content = metadata.content || (result as any).document || metadata.preview || metadata.cleanedText || '';

          const moment = {
            id: momentId,
            userId: metadata.userId,
            type: metadata.type,
            title: metadata.title,
            content: content,
            mood: metadata.mood,
            emotions: metadata.emotions || [],
            triggers: metadata.triggers || [],
            tags: metadata.tags || [],
            intensity: metadata.intensity,
            timestamp: metadata.timestamp,
            createdAt: metadata.timestamp,
            updatedAt: metadata.timestamp
          };

          // Apply additional filters using metadata
          if (options.emotions?.length && metadata.emotions) {
            const hasMatchingEmotion = options.emotions.some(emotion =>
              metadata.emotions.includes(emotion)
            );
            if (!hasMatchingEmotion) continue;
          }

          if (options.moodRange && metadata.mood !== undefined) {
            if (metadata.mood < options.moodRange.min || metadata.mood > options.moodRange.max) {
              continue;
            }
          }

          if (options.dateRange) {
            const momentDate = normalizeTimestampToDate(metadata.timestamp);
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
          console.error(`Error processing vector result:`, error);
        }
      }
      return results;
    } catch (error) {
      console.error('Error searching moments by vector:', error);
      return [];
    }
  }

  // Find similar moments to a given moment - using only ChromaDB metadata
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
      // Use vectorDb.findSimilar which handles the reference lookup via ChromaDB
      const vectorResults = await vectorDb.findSimilar(
        userId,
        referenceId,
        topK
      );

      const results = [];
      for (const result of vectorResults) {
        try {
          const metadata = result.metadata as any;

          // Extract momentId from ChromaDB document ID or metadata
          const momentId = (metadata as any).momentId || result.id.split('_').slice(1).join('_');

          // Build content from multiple possible sources - NO Firestore calls
          const content = metadata.content || (result as any).document || metadata.preview || metadata.cleanedText || '';

          // Debug logging for similar moments content issues
          if (!content) {
            console.warn(`[SIMILAR] Missing content for moment ${momentId}:`, {
              hasMetadataContent: !!metadata.content,
              hasDocument: !!(result as any).document,
              hasPreview: !!metadata.preview,
              hasCleanedText: !!metadata.cleanedText,
              metadataKeys: Object.keys(metadata || {}),
              documentLength: (result as any).document?.length || 0,
              previewLength: metadata.preview?.length || 0
            });
          }

          const moment = {
            id: momentId,
            userId: metadata.userId,
            type: metadata.type,
            title: metadata.title,
            content: content,
            mood: metadata.mood,
            emotions: metadata.emotions || [],
            triggers: metadata.triggers || [],
            tags: metadata.tags || [],
            intensity: metadata.intensity,
            timestamp: metadata.timestamp,
            createdAt: metadata.timestamp, // Fallback
            updatedAt: metadata.timestamp  // Fallback
          };

          results.push({
            moment,
            score: result.score,
          });
        } catch (error) {
          console.error('Error processing similar moment result:', error);
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
      const moments = await getMomentsServer(userId, { limit: 1000 });

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

  // Helper methods - Firestore calls removed, now using only ChromaDB metadata

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

  // Helper methods to use server-side functions when available (for API routes)
  private async getVectorMetadataSafe(userId: string, momentId: string): Promise<VectorMetadata | null> {
    try {
      // Try server-side function first (for API routes)
      return await getVectorMetadataServer(userId, momentId);
    } catch (error) {
      // Fallback to client-side function (for client-side usage)
      console.warn('[MomentVectorService] Server-side getVectorMetadata failed, using client-side:', error);
      const { getVectorMetadata } = await import('./moments');
      return await getVectorMetadata(userId, momentId);
    }
  }

  private async createVectorMetadataSafe(metadata: Omit<VectorMetadata, 'id' | 'lastUpdated'>): Promise<string> {
    try {
      // Try server-side function first (for API routes)
      return await createVectorMetadataServer(metadata);
    } catch (error) {
      // Fallback to client-side function (for client-side usage)
      console.warn('[MomentVectorService] Server-side createVectorMetadata failed, using client-side:', error);
      const { createVectorMetadata } = await import('./moments');
      return await createVectorMetadata(metadata);
    }
  }

  private async updateVectorMetadataSafe(
    userId: string,
    metadataId: string,
    updates: Partial<VectorMetadata>
  ): Promise<void> {
    try {
      // Try server-side function first (for API routes)
      return await updateVectorMetadataServer(userId, metadataId, updates);
    } catch (error) {
      // Fallback to client-side function (for client-side usage)
      console.warn('[MomentVectorService] Server-side updateVectorMetadata failed, using client-side:', error);
      const { updateVectorMetadata } = await import('./moments');
      return await updateVectorMetadata(userId, metadataId, updates);
    }
  }
}

// Export singleton instance
export const momentVectorService = new MomentVectorService();