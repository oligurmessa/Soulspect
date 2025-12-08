// New ChromaDB-based vector database service replacing Pinecone
import { chromaService } from './chromaService';
import { EmotionLog, JournalEntry, Moment } from './data/shared/types';
import { normalizeTimestampForChroma } from './timestampUtils';

// Legacy compatibility interfaces
interface LegacyVectorMetadata {
  userId: string;
  dataType: 'journal' | 'emotion' | 'voice' | 'photo' | 'chat';
  timestamp: number;
  originalId: string;
  mood?: number;
  emotions?: string[];
  triggers?: string[];
  tags?: string[];
  preview: string;
}

interface SearchOptions {
  topK?: number;
  includeMetadata?: boolean;
  filter?: any;
}

interface SearchResult {
  id: string;
  score: number;
  metadata: LegacyVectorMetadata;
  moment?: Moment;
}

export class ChromaVectorDatabase {
  // Index a single item (legacy compatibility)
  async indexItem(
    userId: string,
    itemId: string,
    item: JournalEntry | EmotionLog | Moment,
    type: 'journal' | 'emotion' | 'voice' | 'photo' | 'chat'
  ): Promise<void> {
    try {
      let content = '';
      let metadata: any = {};

      // Extract content and metadata based on item type
      if ('content' in item && item.content) {
        // Journal entry or Moment
        content = item.content;

        // Create standardized searchable text
        const searchableParts = [item.content];
        const title = 'title' in item ? item.title : undefined;
        if (title) searchableParts.unshift(title);
        if (item.emotions?.length) searchableParts.push(`emotions: ${item.emotions.join(' ')}`);
        const triggers = 'triggers' in item ? item.triggers : undefined;
        if (triggers?.length) searchableParts.push(`triggers: ${triggers.join(' ')}`);
        const tags = 'tags' in item ? item.tags : undefined;
        if (tags?.length) searchableParts.push(`tags: ${tags.join(' ')}`);

        metadata = {
          type,
          title: title,
          content: item.content,
          mood: item.mood,
          emotions: item.emotions || [],
          triggers: triggers || [],
          tags: tags || [],
          intensity: 'intensity' in item ? item.intensity : undefined,
          timestamp: normalizeTimestampForChroma(item.createdAt),
          cleanedText: searchableParts.join(' ').toLowerCase(),
          embeddingModel: 'Qwen/Qwen3-Embedding-8B',
          dimensions: 4096
        };
      } else if ('context' in item) {
        // Emotion log
        const emotionLog = item as EmotionLog;
        content = `Mood: ${emotionLog.mood}/6. Emotions: ${emotionLog.emotions?.join(', ')}. Context: ${emotionLog.context}. Triggers: ${emotionLog.triggers?.join(', ')}.`;
        metadata = {
          type,
          content: content,
          mood: emotionLog.mood,
          emotions: emotionLog.emotions || [],
          triggers: emotionLog.triggers || [],
          tags: [],
          timestamp: normalizeTimestampForChroma(emotionLog.createdAt),
          cleanedText: content.toLowerCase(),
          embeddingModel: 'Qwen/Qwen3-Embedding-8B',
          dimensions: 4096
        };
      }

      await chromaService.indexMoment(userId, itemId, content, metadata);
    } catch (error) {
      console.error('Error indexing item:', error);
      throw error;
    }
  }

  // Batch index multiple items
  async batchIndex(
    userId: string,
    items: Array<{
      id: string;
      data: JournalEntry | EmotionLog | Moment;
      type: 'journal' | 'emotion' | 'voice' | 'photo' | 'chat';
    }>
  ): Promise<{ successful: number; failed: number }> {
    try {
      const chromaItems = items.map(item => {
        let content = '';
        let metadata: any = {};

        if ('content' in item.data && item.data.content) {
          content = item.data.content;
          metadata = {
            type: item.type,
            title: 'title' in item.data ? item.data.title : undefined,
            mood: item.data.mood,
            emotions: item.data.emotions || [],
            triggers: 'triggers' in item.data ? item.data.triggers || [] : [],
            timestamp: normalizeTimestampForChroma(item.data.createdAt)
          };
        } else if ('context' in item.data) {
          const emotionLog = item.data as EmotionLog;
          content = `Mood: ${emotionLog.mood}/6. Emotions: ${emotionLog.emotions?.join(', ')}. Context: ${emotionLog.context}. Triggers: ${emotionLog.triggers?.join(', ')}.`;
          metadata = {
            type: item.type,
            mood: emotionLog.mood,
            emotions: emotionLog.emotions || [],
            triggers: emotionLog.triggers || [],
            timestamp: normalizeTimestampForChroma(emotionLog.createdAt)
          };
        }

        return {
          userId,
          momentId: item.id,
          content,
          metadata
        };
      });

      return await chromaService.batchIndexMoments(chromaItems);
    } catch (error) {
      console.error('Error batch indexing:', error);
      return { successful: 0, failed: items.length };
    }
  }

  // Search functionality with legacy compatibility
  async search(
    userId: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      const results = await chromaService.searchMoments(userId, query, {
        topK: options.topK || 5,
        includeMetadata: options.includeMetadata !== false,
        filter: options.filter
      });

      // Transform ChromaDB results to legacy format
      return results.map(result => ({
        id: result.id,
        score: result.score,
        metadata: {
          userId: result.metadata.userId,
          dataType: result.metadata.type as any,
          timestamp: result.metadata.timestamp,
          originalId: result.metadata.momentId,
          mood: result.metadata.mood,
          emotions: result.metadata.emotions,
          triggers: result.metadata.triggers,
          tags: result.metadata.tags || [],
          preview: result.metadata.preview
        }
      }));
    } catch (error) {
      console.error('Error searching:', error);
      throw error;
    }
  }

  // Search functionality using pre-computed vector
  async searchByVector(
    userId: string,
    vector: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      const results = await chromaService.searchMomentsByVector(userId, vector, {
        topK: options.topK || 5,
        includeMetadata: options.includeMetadata !== false,
        filter: options.filter
      });

      // Transform ChromaDB results to legacy format
      return results.map(result => ({
        id: result.id,
        score: result.score,
        metadata: {
          userId: result.metadata.userId,
          dataType: result.metadata.type as any,
          timestamp: result.metadata.timestamp,
          originalId: result.metadata.momentId,
          mood: result.metadata.mood,
          emotions: result.metadata.emotions,
          triggers: result.metadata.triggers,
          tags: result.metadata.tags || [],
          preview: result.metadata.preview
        }
      }));
    } catch (error) {
      console.error('Error searching by vector:', error);
      throw error;
    }
  }

  // Delete an indexed item
  async deleteItem(userId: string, itemId: string): Promise<void> {
    try {
      await chromaService.deleteMoment(userId, itemId);
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  // Update an indexed item
  async updateItem(
    userId: string,
    itemId: string,
    item: JournalEntry | EmotionLog | Moment,
    type: 'journal' | 'emotion' | 'voice' | 'photo' | 'chat'
  ): Promise<void> {
    try {
      let content = '';
      let metadata: any = {};

      if ('content' in item && item.content) {
        content = item.content;
        metadata = {
          type,
          title: 'title' in item ? item.title : undefined,
          mood: item.mood,
          emotions: item.emotions || [],
          triggers: 'triggers' in item ? item.triggers || [] : [],
          timestamp: normalizeTimestampForChroma(item.createdAt)
        };
      } else if ('context' in item) {
        const emotionLog = item as EmotionLog;
        content = `Mood: ${emotionLog.mood}/6. Emotions: ${emotionLog.emotions?.join(', ')}. Context: ${emotionLog.context}. Triggers: ${emotionLog.triggers?.join(', ')}.`;
        metadata = {
          type,
          mood: emotionLog.mood,
          emotions: emotionLog.emotions || [],
          triggers: emotionLog.triggers || [],
          timestamp: normalizeTimestampForChroma(emotionLog.createdAt)
        };
      }

      await chromaService.updateMoment(userId, itemId, content, metadata);
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }

  // Find similar items (compatibility method)
  async findSimilar(
    userId: string,
    referenceId: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    try {
      // First get the reference item to use as query
      const referenceResults = await chromaService.searchMoments(userId, '', {
        topK: 1,
        filter: { momentId: { '$eq': referenceId } }
      });

      if (referenceResults.length === 0) {
        return [];
      }

      const referenceContent = referenceResults[0].document;

      // Search for similar items
      return await this.search(userId, referenceContent, { topK: limit + 1 });
    } catch (error) {
      console.error('Error finding similar items:', error);
      return [];
    }
  }

  // Get database statistics
  async getStats(): Promise<{
    totalDocuments: number;
    model: string;
    dimensions: number;
  }> {
    try {
      const stats = await chromaService.getCollectionStats();
      return {
        totalDocuments: stats.count,
        model: stats.model,
        dimensions: stats.dimensions
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }
}

// Export the ChromaDB vector database instance
export const vectorDb = new ChromaVectorDatabase();