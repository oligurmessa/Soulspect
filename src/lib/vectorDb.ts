import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { 
  EmotionLog, 
  JournalEntry, 
  SoulspaceItem,
  User 
} from './dbHelpers';

// Initialize clients
const pinecone = new Pinecone({
  apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
});

// Constants
const INDEX_NAME = 'soulspect-index';
const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 1024;
const NAMESPACE_PREFIX = 'user_';

// Vector metadata interface
interface VectorMetadata {
  userId: string;
  dataType: 'journal' | 'emotion' | 'voice' | 'photo' | 'chat' | 'soulwork';
  timestamp: number;
  // Original data references
  originalId: string;
  // Searchable metadata
  mood?: number;
  emotions?: string[];
  triggers?: string[];
  tags?: string[];
  // Content preview
  preview?: string;
}

export class VectorDbService {
  private index: any;

  constructor() {
    this.initializeIndex();
  }

  private async initializeIndex() {
    try {
      this.index = pinecone.index(INDEX_NAME);
      console.log('Vector DB initialized successfully');
    } catch (error) {
      console.error('Error initializing vector DB:', error);
      // Create index if it doesn't exist
      await this.createIndex();
    }
  }

  private async createIndex() {
    try {
      await pinecone.createIndex({
        name: INDEX_NAME,
        dimension: 1536, // OpenAI embedding dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
      
      // Wait for index to be ready
      await new Promise(resolve => setTimeout(resolve, 60000));
      this.index = pinecone.index(INDEX_NAME);
    } catch (error) {
      console.error('Error creating index:', error);
    }
  }

  // Generate embeddings for text content
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        input: text,
        model: EMBEDDING_MODEL,
        dimensions: EMBEDDING_DIMENSIONS,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  // Format content for embedding
  private formatContentForEmbedding(data: any, type: VectorMetadata['dataType']): string {
    switch (type) {
      case 'journal':
        const journal = data as JournalEntry;
        return `Journal Entry: ${journal.title}\n\nContent: ${journal.content}\n\nMood: ${journal.mood || 'not specified'}\nEmotions: ${journal.emotions?.join(', ') || 'none'}`;
      
      case 'emotion':
        const emotion = data as EmotionLog;
        return `Emotion Log:\nMood Level: ${emotion.mood}/6\nEmotions: ${emotion.emotions.join(', ')}\nTriggers: ${emotion.triggers?.join(', ') || 'none'}\nContext: ${emotion.context || 'no additional context'}\nIntensity: ${emotion.intensity || 'not specified'}`;
      
      case 'voice':
        return `Voice Transcript: ${data.transcript}\nDuration: ${data.duration} seconds`;
      
      case 'photo':
        return `Photo Caption: ${data.caption}\nPhoto Name: ${data.name}`;
      
      case 'chat':
        return `AI Chat:\nUser: ${data.userMessage}\nAI Response: ${data.aiResponse}\nMode: ${data.mode || 'normal'}`;
      
      case 'soulwork':
        return `Soul Work Exercise: ${data.title}\nType: ${data.exerciseType}\nResponses: ${JSON.stringify(data.responses)}`;
      
      default:
        return JSON.stringify(data);
    }
  }

  // Index a single item
  async indexItem(
    userId: string,
    itemId: string,
    data: any,
    dataType: VectorMetadata['dataType']
  ): Promise<void> {
    try {
      const content = this.formatContentForEmbedding(data, dataType);
      const embedding = await this.generateEmbedding(content);
      
      const metadata: VectorMetadata = {
        userId,
        dataType,
        timestamp: Date.now(),
        originalId: itemId,
        preview: content.substring(0, 200),
      };

      // Add type-specific metadata
      if (dataType === 'journal' || dataType === 'emotion') {
        metadata.mood = data.mood;
        metadata.emotions = data.emotions;
        metadata.triggers = data.triggers;
      }

      await this.index.namespace(NAMESPACE_PREFIX + userId).upsert([
        {
          id: `${dataType}_${itemId}`,
          values: embedding,
          metadata,
        },
      ]);

      console.log(`Indexed ${dataType} item ${itemId} for user ${userId}`);
    } catch (error) {
      console.error('Error indexing item:', error);
      throw error;
    }
  }

  // Batch index multiple items
  async batchIndex(userId: string, items: Array<{
    id: string;
    data: any;
    type: VectorMetadata['dataType'];
  }>): Promise<void> {
    const vectors = [];

    for (const item of items) {
      try {
        const content = this.formatContentForEmbedding(item.data, item.type);
        const embedding = await this.generateEmbedding(content);
        
        const metadata: VectorMetadata = {
          userId,
          dataType: item.type,
          timestamp: Date.now(),
          originalId: item.id,
          preview: content.substring(0, 200),
        };

        vectors.push({
          id: `${item.type}_${item.id}`,
          values: embedding,
          metadata,
        });
      } catch (error) {
        console.error(`Error processing item ${item.id}:`, error);
      }
    }

    if (vectors.length > 0) {
      await this.index.namespace(NAMESPACE_PREFIX + userId).upsert(vectors);
      console.log(`Batch indexed ${vectors.length} items for user ${userId}`);
    }
  }

  // Semantic search
  async search(
    userId: string,
    query: string,
    options: {
      topK?: number;
      filter?: Partial<VectorMetadata>;
      includeMetadata?: boolean;
    } = {}
  ): Promise<any[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      
      const searchOptions: any = {
        vector: queryEmbedding,
        topK: options.topK || 10,
        includeMetadata: options.includeMetadata !== false,
      };

      // Add filters
      if (options.filter) {
        searchOptions.filter = {
          ...options.filter,
          userId: userId, // Always filter by user
        };
      } else {
        searchOptions.filter = { userId };
      }

      const results = await this.index
        .namespace(NAMESPACE_PREFIX + userId)
        .query(searchOptions);

      return results.matches || [];
    } catch (error) {
      console.error('Error searching vectors:', error);
      return [];
    }
  }

  // Find similar content
  async findSimilar(
    userId: string,
    referenceId: string,
    dataType: VectorMetadata['dataType'],
    topK: number = 5
  ): Promise<any[]> {
    try {
      // Fetch the reference vector
      const referenceResult = await this.index
        .namespace(NAMESPACE_PREFIX + userId)
        .fetch([`${dataType}_${referenceId}`]);
      
      if (!referenceResult.records[`${dataType}_${referenceId}`]) {
        console.log('Reference item not found in vector DB');
        return [];
      }

      const referenceVector = referenceResult.records[`${dataType}_${referenceId}`].values;
      
      // Search for similar items
      const results = await this.index
        .namespace(NAMESPACE_PREFIX + userId)
        .query({
          vector: referenceVector,
          topK: topK + 1, // +1 to exclude self
          includeMetadata: true,
          filter: {
            userId,
            dataType, // Only find similar items of same type
          },
        });

      // Remove self from results
      return results.matches.filter((match: any) => match.id !== `${dataType}_${referenceId}`);
    } catch (error) {
      console.error('Error finding similar items:', error);
      return [];
    }
  }

  // Delete vectors
  async deleteVectors(userId: string, ids: string[]): Promise<void> {
    try {
      await this.index.namespace(NAMESPACE_PREFIX + userId).deleteMany(ids);
      console.log(`Deleted ${ids.length} vectors for user ${userId}`);
    } catch (error) {
      console.error('Error deleting vectors:', error);
    }
  }

  // Get user's vector stats
  async getUserStats(userId: string): Promise<any> {
    try {
      const stats = await this.index
        .namespace(NAMESPACE_PREFIX + userId)
        .describeIndexStats();
      
      return {
        totalVectors: stats.totalRecordCount || 0,
        dimensions: stats.dimension,
        indexFullness: stats.indexFullness,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const vectorDb = new VectorDbService();