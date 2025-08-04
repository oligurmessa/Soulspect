/**
 * OPTIMIZED VECTOR ENGINE - Server-Side Processing
 * 
 * This module handles all server-side vector operations with maximum efficiency,
 * smart fallbacks, and seamless integration with Firebase moments.
 */

import { Moment, VectorMetadata, createVectorMetadata, getVectorMetadata, updateVectorMetadata } from './moments';
import { getMomentsServer, getLegacyEmotionLogsServer, getLegacyJournalEntriesServer } from './moments-server';
import { Timestamp } from '@firebase/firestore';
import { formatMomentForVector, calculateTextSimilarity } from './vectorSystem';

/* ---------- USER DATA COLLECTION ---------- */

// Get all user data for indexing (server-side safe)
export async function getAllUserDataServer(userId: string): Promise<Moment[]> {
  try {
    // Get unified moments first
    const moments = await getMomentsServer(userId, { limit: 1000 });
    console.log(`Found ${moments.length} unified moments for user ${userId}`);
    
    if (moments.length > 0) {
      return moments;
    }
    
    // Fallback to legacy data if no unified moments exist
    console.log('No moments found, falling back to legacy data indexing');
    const legacyMoments: Moment[] = [];
    
    try {
      // Get legacy emotion logs
      const emotionLogs = await getLegacyEmotionLogsServer(userId, 500);
      for (const log of emotionLogs) {
        legacyMoments.push({
          id: log.id,
          userId,
          type: 'emotion',
          content: `Mood: ${log.mood}/6\nEmotions: ${log.emotions?.join(', ') || 'none'}\n${log.context || ''}\n${log.triggers?.join(', ') || ''}`,
          timestamp: log.createdAt,
          createdAt: log.createdAt,
          updatedAt: log.updatedAt || log.createdAt,
          mood: log.mood,
          emotions: log.emotions || [],
          triggers: log.triggers || [],
          intensity: log.intensity,
        } as Moment);
      }
      
      // Get legacy journal entries
      const journalEntries = await getLegacyJournalEntriesServer(userId, 500);
      for (const entry of journalEntries) {
        legacyMoments.push({
          id: entry.id,
          userId,
          type: 'journal',
          title: entry.title,
          content: entry.content,
          timestamp: entry.date || entry.createdAt,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt || entry.createdAt,
          mood: entry.mood,
          emotions: entry.emotions || [],
          tags: entry.tags || [],
        } as Moment);
      }
      
      console.log(`Converted ${legacyMoments.length} legacy items to moments for indexing`);
      return legacyMoments;
      
    } catch (legacyError) {
      console.error('Error accessing legacy data:', legacyError);
      return [];
    }
    
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
}

/* ---------- LAZY INITIALIZATION ---------- */

let vectorServices: {
  pinecone?: any;
  openai?: any;
  index?: any;
} = {};

let initializationPromise: Promise<boolean> | null = null;

const initializeVectorServices = async (): Promise<boolean> => {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('🚀 Initializing vector services...');

      // Dynamic imports to avoid client-side issues
      const [{ Pinecone }, OpenAI] = await Promise.all([
        import('@pinecone-database/pinecone'),
        import('openai')
      ]);

      // Initialize Pinecone
      if (process.env.PINECONE_API_KEY || process.env.NEXT_PUBLIC_PINECONE_API_KEY) {
        vectorServices.pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY || process.env.NEXT_PUBLIC_PINECONE_API_KEY!,
        });
        vectorServices.index = vectorServices.pinecone.index('soulspect-index');
        console.log('✅ Pinecone initialized');
      }

      // Initialize OpenAI
      if (process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        vectorServices.openai = new (OpenAI.default || OpenAI)({
          apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
        });
        console.log('✅ OpenAI initialized');
      }

      const hasServices = !!(vectorServices.pinecone && vectorServices.openai);
      console.log(`🎯 Vector services status: ${hasServices ? 'READY' : 'PARTIAL/UNAVAILABLE'}`);
      
      return hasServices;
    } catch (error) {
      console.error('❌ Vector services initialization failed:', error);
      return false;
    }
  })();

  return initializationPromise;
};

/* ---------- CONFIGURATION ---------- */

const VECTOR_CONFIG = {
  INDEX_NAME: 'soulspect-index',
  EMBEDDING_MODEL: 'text-embedding-3-large',
  EMBEDDING_DIMENSIONS: 3072,
  NAMESPACE_PREFIX: 'user_',
  BATCH_SIZE: 100,
  MAX_CONTENT_LENGTH: 8000, // Optimized for embedding models
  SIMILARITY_THRESHOLD: 0.5, // More permissive for better recall
};

/* ---------- CORE VECTOR ENGINE ---------- */

export class VectorEngine {
  
  // Get system status and health
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
      const initialized = await initializeVectorServices();
      
      if (!initialized) {
        return {
          available: false,
          provider: 'none',
          indexed: 0,
          health: 'unavailable',
          errors: ['Vector services not available']
        };
      }

      // Test connectivity
      if (vectorServices.index && userId) {
        try {
          const stats = await vectorServices.index
            .describeIndexStats();
          indexed = stats.namespaces?.[VECTOR_CONFIG.NAMESPACE_PREFIX + userId]?.recordCount || 0;
        } catch (error) {
          errors.push('Index connectivity issue');
        }
      }

      return {
        available: true,
        provider: vectorServices.pinecone ? 'pinecone' : 'fallback',
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

  // Generate embeddings with smart preprocessing
  static async generateEmbedding(text: string): Promise<number[]> {
    const initialized = await initializeVectorServices();
    if (!initialized || !vectorServices.openai) {
      throw new Error('OpenAI service not available');
    }

    // Preprocess and truncate content
    const processedText = text.substring(0, VECTOR_CONFIG.MAX_CONTENT_LENGTH);

    try {
      const response = await vectorServices.openai.embeddings.create({
        input: processedText,
        model: VECTOR_CONFIG.EMBEDDING_MODEL,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('❌ Embedding generation failed:', error);
      throw error;
    }
  }

  // Index a single moment with comprehensive metadata
  static async indexMoment(moment: Moment, force = false): Promise<{
    success: boolean;
    vectorId?: string;
    error?: string;
    skipped?: boolean;
  }> {
    if (!moment.id) {
      return { success: false, error: 'Moment must have an ID' };
    }

    try {
      const initialized = await initializeVectorServices();
      if (!initialized) {
        return { success: false, error: 'Vector services not available' };
      }

      // Check if already indexed (unless forcing)
      if (!force) {
        const existingMetadata = await getVectorMetadata(moment.userId, moment.id);
        if (existingMetadata?.indexed) {
          return { success: true, vectorId: existingMetadata.vectorId, skipped: true };
        }
      }

      // Format content for optimal embedding
      const searchableContent = formatMomentForVector(moment);
      const embedding = await this.generateEmbedding(searchableContent);

      // Create comprehensive vector metadata
      const vectorId = `${moment.type}_${moment.id}_${Date.now()}`;
      const timeContext = this.createTimeContext(moment.timestamp.toDate());

      // Index in Pinecone
      await vectorServices.index.namespace(VECTOR_CONFIG.NAMESPACE_PREFIX + moment.userId).upsert([
        {
          id: vectorId,
          values: embedding,
          metadata: {
            // Core identification
            userId: moment.userId,
            momentId: moment.id,
            momentType: moment.type,
            
            // Searchable metadata
            timestamp: moment.timestamp.toDate().getTime(),
            mood: moment.mood,
            emotions: moment.emotions,
            triggers: moment.triggers,
            tags: moment.tags,
            
            // Content preview
            preview: searchableContent.substring(0, 200),
            
            // Time-based context
            ...timeContext,
            
            // Type-specific metadata
            ...(moment.journalData && { entryType: moment.journalData.entryType }),
            ...(moment.intensity && { intensity: moment.intensity }),
            ...(moment.location && { location: moment.location }),
            ...(moment.weather && { weather: moment.weather }),
          },
        },
      ]);

      // Store/update vector metadata in Firebase
      const metadataDoc = {
        userId: moment.userId,
        momentId: moment.id,
        vectorId,
        indexed: true,
        indexedAt: Timestamp.now(),
        dimensions: VECTOR_CONFIG.EMBEDDING_DIMENSIONS,
        model: VECTOR_CONFIG.EMBEDDING_MODEL,
        contentPreview: searchableContent.substring(0, 200),
        searchableText: searchableContent.toLowerCase(),
        momentType: moment.type,
        emotionContext: this.createEmotionContext(moment),
        timeContext: {
          timestamp: moment.timestamp,
          ...timeContext,
        },
      };

      const existingMetadata = await getVectorMetadata(moment.userId, moment.id);
      if (existingMetadata?.id) {
        await updateVectorMetadata(moment.userId, existingMetadata.id, metadataDoc);
      } else {
        await createVectorMetadata(metadataDoc);
      }

      console.log(`✅ Indexed moment ${moment.id} (${moment.type}) as ${vectorId}`);
      return { success: true, vectorId };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to index moment ${moment.id}:`, errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  // Batch index multiple moments with optimized performance
  static async batchIndexMoments(moments: Moment[], force = false): Promise<{
    successful: number;
    failed: number;
    skipped: number;
    results: Array<{ momentId: string; success: boolean; error?: string; vectorId?: string }>;
    duration: number;
  }> {
    const startTime = Date.now();
    const results: Array<{ momentId: string; success: boolean; error?: string; vectorId?: string }> = [];
    let successful = 0;
    let failed = 0;
    let skipped = 0;

    console.log(`🚀 Starting batch index of ${moments.length} moments`);

    // Process in batches for better performance
    for (let i = 0; i < moments.length; i += VECTOR_CONFIG.BATCH_SIZE) {
      const batch = moments.slice(i, i + VECTOR_CONFIG.BATCH_SIZE);
      
      const batchPromises = batch.map(async (moment) => {
        const result = await this.indexMoment(moment, force);
        
        results.push({
          momentId: moment.id || '',
          success: result.success,
          error: result.error,
          vectorId: result.vectorId,
        });

        if (result.success) {
          if (result.skipped) skipped++;
          else successful++;
        } else {
          failed++;
        }
      });

      // Execute batch with concurrency control
      await Promise.allSettled(batchPromises);
      
      console.log(`📊 Batch ${Math.floor(i / VECTOR_CONFIG.BATCH_SIZE) + 1} complete: ${successful} successful, ${failed} failed, ${skipped} skipped`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Batch indexing complete in ${duration}ms: ${successful} successful, ${failed} failed, ${skipped} skipped`);

    return {
      successful,
      failed,
      skipped,
      results,
      duration,
    };
  }

  // Semantic search with smart result processing
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
    try {
      const initialized = await initializeVectorServices();
      if (!initialized) {
        throw new Error('Vector services not available');
      }

      const queryEmbedding = await this.generateEmbedding(query);
      
      // Build search filters
      const filter: any = { userId };
      
      if (options.type) {
        filter.momentType = options.type;
      }
      
      if (options.moodRange) {
        filter.mood = { $gte: options.moodRange.min, $lte: options.moodRange.max };
      }
      
      if (options.dateRange) {
        filter.timestamp = {
          $gte: options.dateRange.start.getTime(),
          $lte: options.dateRange.end.getTime(),
        };
      }

      // Execute search
      const searchResults = await vectorServices.index
        .namespace(VECTOR_CONFIG.NAMESPACE_PREFIX + userId)
        .query({
          vector: queryEmbedding,
          topK: options.topK || 10,
          includeMetadata: options.includeMetadata !== false,
          filter,
        });

      // Process and filter results
      let results = (searchResults.matches || []).map((match: any) => ({
        momentId: match.metadata.momentId,
        score: match.score,
        metadata: match.metadata,
        preview: match.metadata.preview || '',
      }));

      // Apply additional client-side filters
      if (options.emotions?.length) {
        results = results.filter((result: any) => {
          const resultEmotions = result.metadata.emotions || [];
          return options.emotions!.some(emotion => resultEmotions.includes(emotion));
        });
      }

      // Filter by similarity threshold
      results = results.filter((result: any) => result.score >= VECTOR_CONFIG.SIMILARITY_THRESHOLD);

      console.log(`🔍 Search "${query}" returned ${results.length} results`);
      return results;

    } catch (error) {
      console.error('❌ Vector search failed:', error);
      throw error;
    }
  }

  // Find similar moments using vector similarity
  static async findSimilarMoments(
    userId: string,
    referenceId: string,
    options: { topK?: number; type?: Moment['type'] } = {}
  ): Promise<Array<{
    momentId: string;
    score: number;
    metadata: any;
  }>> {
    try {
      const initialized = await initializeVectorServices();
      if (!initialized) {
        throw new Error('Vector services not available');
      }

      // Find the reference vector
      const metadata = await getVectorMetadata(userId, referenceId);
      if (!metadata?.vectorId) {
        throw new Error('Reference moment not indexed');
      }

      // Fetch the reference vector
      const fetchResult = await vectorServices.index
        .namespace(VECTOR_CONFIG.NAMESPACE_PREFIX + userId)
        .fetch([metadata.vectorId]);
      
      const referenceVector = fetchResult.records[metadata.vectorId];
      if (!referenceVector) {
        throw new Error('Reference vector not found');
      }

      // Search for similar vectors
      const filter: any = { userId };
      if (options.type) {
        filter.momentType = options.type;
      }

      const searchResults = await vectorServices.index
        .namespace(VECTOR_CONFIG.NAMESPACE_PREFIX + userId)
        .query({
          vector: referenceVector.values,
          topK: (options.topK || 5) + 1, // +1 to exclude self
          includeMetadata: true,
          filter,
        });

      // Remove self from results and apply threshold
      const results = (searchResults.matches || [])
        .filter((match: any) => match.metadata.momentId !== referenceId)
        .filter((match: any) => match.score >= VECTOR_CONFIG.SIMILARITY_THRESHOLD)
        .map((match: any) => ({
          momentId: match.metadata.momentId,
          score: match.score,
          metadata: match.metadata,
        }));

      console.log(`🔗 Found ${results.length} similar moments for ${referenceId}`);
      return results;

    } catch (error) {
      console.error('❌ Similar search failed:', error);
      throw error;
    }
  }

  // Fallback search using text similarity
  static async fallbackSearch(
    userId: string,
    query: string,
    moments: Moment[],
    options: { topK?: number } = {}
  ): Promise<Array<{
    momentId: string;
    score: number;
    preview: string;
  }>> {
    console.log('🔄 Using fallback text similarity search');

    const results = moments
      .filter(moment => moment.id)
      .map(moment => {
        const content = formatMomentForVector(moment);
        const similarity = calculateTextSimilarity(query.toLowerCase(), content.toLowerCase());
        
        return {
          momentId: moment.id!,
          score: similarity,
          preview: content.substring(0, 200),
          moment,
        };
      })
      .filter(result => result.score > 0.1) // Basic threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, options.topK || 10);

    console.log(`📝 Fallback search returned ${results.length} results`);
    return results;
  }

  // Helper: Create time-based context for better search
  private static createTimeContext(date: Date) {
    return {
      dayOfWeek: date.getDay(),
      hourOfDay: date.getHours(),
      season: this.getSeason(date),
      timeOfDay: this.getTimeOfDay(date.getHours()),
    };
  }

  // Helper: Create emotion context
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

  // Helper: Get season from date
  private static getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  // Helper: Get time of day
  private static getTimeOfDay(hour: number): string {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }
}

export default VectorEngine;