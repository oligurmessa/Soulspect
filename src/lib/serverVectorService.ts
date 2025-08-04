/**
 * Server-only vector service that safely handles Pinecone operations
 * This module should only be imported in API routes or server-side code
 */

import { Moment, createVectorMetadata, getVectorMetadata, updateVectorMetadata } from './moments';
import { Timestamp } from '@firebase/firestore';

// Lazy imports to avoid client-side issues
let vectorDbService: any = null;
let pineconeClient: any = null;
let openaiClient: any = null;

const initializeVectorServices = async () => {
  if (vectorDbService) return vectorDbService;

  try {
    // Only import these on the server side
    const { Pinecone } = await import('@pinecone-database/pinecone');
    const OpenAI = await import('openai');

    if (process.env.PINECONE_API_KEY || process.env.NEXT_PUBLIC_PINECONE_API_KEY) {
      pineconeClient = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY || process.env.NEXT_PUBLIC_PINECONE_API_KEY || '',
      });
      console.log('✅ Pinecone initialized for server operations');
    }

    if (process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      openaiClient = new (OpenAI.default || OpenAI)({
        apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
      });
      console.log('✅ OpenAI initialized for server operations');
    }

    vectorDbService = {
      pinecone: pineconeClient,
      openai: openaiClient,
      index: pineconeClient?.index('soulspect-index'),
    };

    return vectorDbService;
  } catch (error) {
    console.error('Failed to initialize vector services:', error);
    return null;
  }
};

const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 3072;
const NAMESPACE_PREFIX = 'user_';

export class ServerVectorService {
  
  // Generate embeddings for text content
  static async generateEmbedding(text: string): Promise<number[]> {
    const services = await initializeVectorServices();
    if (!services?.openai) {
      throw new Error('OpenAI service not available');
    }

    try {
      const response = await services.openai.embeddings.create({
        input: text,
        model: EMBEDDING_MODEL,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  // Format moment content for embedding
  static formatMomentForEmbedding(moment: Moment): string {
    let content = moment.content;
    
    if (moment.title) {
      content = `${moment.title}\n\n${content}`;
    }
    
    // Add metadata to searchable content
    const metadata: string[] = [];
    
    if (moment.mood !== undefined) {
      metadata.push(`Mood: ${moment.mood}/6`);
    }
    
    if (moment.emotions?.length) {
      metadata.push(`Emotions: ${moment.emotions.join(', ')}`);
    }
    
    if (moment.triggers?.length) {
      metadata.push(`Triggers: ${moment.triggers.join(', ')}`);
    }
    
    if (moment.tags?.length) {
      metadata.push(`Tags: ${moment.tags.join(', ')}`);
    }
    
    if (moment.intensity !== undefined) {
      metadata.push(`Intensity: ${moment.intensity}/10`);
    }
    
    if (metadata.length > 0) {
      content += '\n\n' + metadata.join('\n');
    }
    
    return content;
  }

  // Get system status
  static async getSystemStatus(userId?: string): Promise<{
    available: boolean;
    provider: 'pinecone' | 'fallback' | 'none';
    indexed: number;
    health: 'healthy' | 'degraded' | 'unavailable';
    errors: string[];
  }> {
    const errors: string[] = [];
    let indexed = 0;

    try {
      const services = await initializeVectorServices();
      
      if (!services?.pinecone || !services?.openai) {
        return {
          available: false,
          provider: 'none',
          indexed: 0,
          health: 'unavailable',
          errors: ['Vector services not available - check API keys']
        };
      }

      // Test connectivity and get index stats
      if (services.index && userId) {
        try {
          const stats = await services.index.describeIndexStats();
          const namespace = NAMESPACE_PREFIX + userId;
          indexed = stats.namespaces?.[namespace]?.recordCount || 0;
        } catch (error) {
          errors.push('Index connectivity issue: ' + (error instanceof Error ? error.message : 'Unknown'));
        }
      }

      return {
        available: true,
        provider: 'pinecone',
        indexed,
        health: errors.length === 0 ? 'healthy' : 'degraded',
        errors
      };
    } catch (error) {
      return {
        available: false,
        provider: 'none',
        indexed: 0,
        health: 'unavailable',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // Index a moment for vector search
  static async indexMoment(moment: Moment, force = false): Promise<{
    success: boolean;
    vectorId?: string;
    error?: string;
    skipped?: boolean;
  }> {
    if (!moment.id) {
      return { success: false, error: 'Moment must have an ID to be indexed' };
    }

    const services = await initializeVectorServices();
    if (!services?.index) {
      return { success: false, error: 'Vector indexing not available (Pinecone not configured)' };
    }

    try {
      // Check if already indexed (unless forcing)
      let existingMetadata = null;
      try {
        // Use client SDK for now to check metadata
        const response = await fetch(`/api/vector-system/metadata?userId=${moment.userId}&momentId=${moment.id}`);
        if (response.ok) {
          const metadataResult = await response.json();
          existingMetadata = metadataResult.metadata;
        }
      } catch (error) {
        console.warn('Could not check existing metadata:', error);
      }
      
      if (!force && existingMetadata && existingMetadata.indexed) {
        console.log(`Moment ${moment.id} already indexed, skipping`);
        return { success: true, skipped: true, vectorId: existingMetadata.vectorId };
      }

      // Format content for embedding
      const searchableText = this.formatMomentForEmbedding(moment);
      const embedding = await this.generateEmbedding(searchableText);

      // Create vector metadata
      const vectorId = `${moment.type}_${moment.id}`;
      
      // Handle timestamp conversion safely
      let momentDate: Date;
      try {
        if (moment.timestamp && typeof moment.timestamp.toDate === 'function') {
          momentDate = moment.timestamp.toDate();
        } else if (moment.timestamp) {
          momentDate = new Date(moment.timestamp as any);
        } else {
          momentDate = new Date(); // Fallback to current time
        }
      } catch (error) {
        console.warn('Error parsing timestamp, using current time:', error);
        momentDate = new Date();
      }
        
      const timeContext = {
        timestamp: momentDate.getTime(),
        dayOfWeek: momentDate.getDay(),
        hourOfDay: momentDate.getHours(),
        season: this.getSeason(momentDate),
      };
      
      console.log('Time context:', timeContext);
      console.log('Moment date:', momentDate);

      // Index in Pinecone with safe metadata
      const metadata: any = {
        userId: moment.userId,
        momentId: moment.id,
        momentType: moment.type,
        timestamp: timeContext.timestamp,
        preview: searchableText.substring(0, 200),
      };

      // Add optional fields only if they exist and are valid
      if (moment.mood !== undefined && moment.mood !== null) {
        metadata.mood = moment.mood;
      }
      if (moment.emotions && Array.isArray(moment.emotions)) {
        metadata.emotions = moment.emotions;
      }
      if (moment.triggers && Array.isArray(moment.triggers)) {
        metadata.triggers = moment.triggers;
      }
      if (moment.tags && Array.isArray(moment.tags)) {
        metadata.tags = moment.tags;
      }
      if (timeContext.dayOfWeek !== undefined && timeContext.dayOfWeek !== null) {
        metadata.dayOfWeek = timeContext.dayOfWeek;
      }
      if (timeContext.hourOfDay !== undefined && timeContext.hourOfDay !== null) {
        metadata.hourOfDay = timeContext.hourOfDay;
      }
      if (timeContext.season) {
        metadata.season = timeContext.season;
      }

      await services.index.namespace(NAMESPACE_PREFIX + moment.userId).upsert([
        {
          id: vectorId,
          values: embedding,
          metadata,
        },
      ]);

      // Update/create vector metadata via API endpoint
      try {
        const metadataPayload = {
          userId: moment.userId,
          momentId: moment.id,
          vectorId,
          indexed: true,
          dimensions: EMBEDDING_DIMENSIONS,
          model: EMBEDDING_MODEL,
          contentPreview: searchableText.substring(0, 200),
          searchableText: searchableText.toLowerCase(),
          momentType: moment.type,
          emotionContext: this.createEmotionContext(moment),
          timeContext: {
            timestamp: Timestamp.fromDate(momentDate),
            dayOfWeek: timeContext.dayOfWeek,
            hourOfDay: timeContext.hourOfDay,
            season: timeContext.season,
          },
        };
        
        const metadataResponse = await fetch('/api/vector-system/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metadataPayload),
        });
        
        if (!metadataResponse.ok) {
          console.warn('Failed to update vector metadata:', await metadataResponse.text());
        }
      } catch (error) {
        console.warn('Error updating vector metadata:', error);
      }

      console.log(`Successfully indexed moment ${moment.id} (${moment.type})`);
      return { success: true, vectorId };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error indexing moment ${moment.id}:`, errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  // Search moments using vector similarity
  static async searchMoments(
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
    momentId: string;
    score: number;
    metadata: any;
    preview: string;
  }>> {
    const services = await initializeVectorServices();
    if (!services?.index) {
      console.warn('Vector search not available (Pinecone not configured)');
      return [];
    }

    try {
      const queryEmbedding = await this.generateEmbedding(query);
      
      const searchOptions: any = {
        vector: queryEmbedding,
        topK: options.topK || 10,
        includeMetadata: options.includeMetadata !== false,
        filter: {
          userId: userId,
        },
      };

      if (options.type) {
        searchOptions.filter.momentType = options.type;
      }

      const results = await services.index
        .namespace(NAMESPACE_PREFIX + userId)
        .query(searchOptions);

      // Process and filter results
      let processedResults = (results.matches || []).map((match: any) => ({
        momentId: match.metadata.momentId,
        score: match.score,
        metadata: match.metadata,
        preview: match.metadata.preview || '',
      }));

      // Apply additional client-side filters
      if (options.emotions?.length) {
        processedResults = processedResults.filter((result: any) => {
          const resultEmotions = result.metadata.emotions || [];
          return options.emotions!.some(emotion => resultEmotions.includes(emotion));
        });
      }

      if (options.moodRange) {
        processedResults = processedResults.filter((result: any) => {
          const mood = result.metadata.mood;
          return mood !== undefined && mood >= options.moodRange!.min && mood <= options.moodRange!.max;
        });
      }

      if (options.dateRange) {
        processedResults = processedResults.filter((result: any) => {
          const timestamp = result.metadata.timestamp;
          return timestamp && timestamp >= options.dateRange!.start.getTime() && timestamp <= options.dateRange!.end.getTime();
        });
      }

      // Filter by similarity threshold
      processedResults = processedResults.filter((result: any) => result.score >= 0.3);

      console.log(`🔍 Server search "${query}" returned ${processedResults.length} results`);
      return processedResults;
    } catch (error) {
      console.error('Error searching moments:', error);
      throw error;
    }
  }

  // Fallback search using text similarity
  static async fallbackSearch(
    userId: string,
    query: string,
    options: { topK?: number; type?: Moment['type'] } = {}
  ): Promise<Array<{
    momentId: string;
    score: number;
    preview: string;
  }>> {
    console.log('🔄 Using server-side fallback text similarity search');

    try {
      // Import dynamically to avoid circular dependency
      const { getMomentsServer } = await import('./moments-server');
      const { calculateTextSimilarity } = await import('./vectorSystem');
      
      const moments = await getMomentsServer(userId, { 
        limit: 500,
        type: options.type 
      });

      const results = moments
        .filter(moment => moment.id)
        .map(moment => {
          const content = this.formatMomentForEmbedding(moment);
          const similarity = calculateTextSimilarity(query.toLowerCase(), content.toLowerCase());
          
          return {
            momentId: moment.id!,
            score: similarity,
            preview: content.substring(0, 200),
          };
        })
        .filter(result => result.score > 0.1) // Basic threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, options.topK || 10);

      console.log(`📝 Server fallback search returned ${results.length} results`);
      return results;

    } catch (error) {
      console.error('Server fallback search failed:', error);
      return [];
    }
  }

  // Helper methods
  private static createEmotionContext(moment: Moment) {
    if (moment.mood !== undefined || moment.emotions?.length || moment.triggers?.length) {
      return {
        mood: moment.mood,
        emotions: moment.emotions,
        triggers: moment.triggers,
      };
    }
    return undefined;
  }

  private static getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
}

// Export the class as default
export default ServerVectorService;