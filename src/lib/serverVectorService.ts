/**
 * Server-only vector service that safely handles Pinecone operations
 * This module should only be imported in API routes or server-side code
 */

import { Moment, VectorMetadata } from './moments';
import { Timestamp } from '@firebase/firestore';

// Lazy imports to avoid client-side issues
let vectorDbService: any = null;
let pineconeClient: any = null;
let openaiClient: any = null;
let firebaseAdminDb: any = null;

const initializeVectorServices = async () => {
  if (vectorDbService) return vectorDbService;

  try {
    // Only import these on the server side
    const { Pinecone } = await import('@pinecone-database/pinecone');
    const OpenAI = await import('openai');
    
    // Initialize Firebase Admin
    if (!firebaseAdminDb) {
      try {
        const { adminDb } = await import('./firebaseAdmin');
        firebaseAdminDb = adminDb;
        console.log('✅ Firebase Admin initialized for server operations');
      } catch (error) {
        console.warn('Firebase Admin not available, using client SDK:', error);
      }
    }

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
      db: firebaseAdminDb,
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
        // Use server-specific function for better performance
        existingMetadata = await getVectorMetadataServer(moment.userId, moment.id);
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
          // Handle various timestamp formats
          const timestampValue = typeof moment.timestamp === 'object' && 'seconds' in moment.timestamp 
            ? moment.timestamp.seconds * 1000 
            : moment.timestamp;
          momentDate = new Date(timestampValue as any);
        } else {
          momentDate = new Date(); // Fallback to current time
        }
        
        // Validate the date is actually valid
        if (isNaN(momentDate.getTime())) {
          console.warn('Invalid date parsed, using current time');
          momentDate = new Date();
        }
      } catch (error) {
        console.warn('Error parsing timestamp, using current time:', error);
        momentDate = new Date();
      }
      
      // Create time context with validation
      const timeContext = {
        timestamp: momentDate.getTime(),
        dayOfWeek: momentDate.getDay(),
        hourOfDay: momentDate.getHours(),
        season: this.getSeason(momentDate),
      };
      
      console.log('Time context:', timeContext);
      console.log('Moment date:', momentDate);
      
      // Validate time context values
      if (isNaN(timeContext.timestamp) || isNaN(timeContext.dayOfWeek) || isNaN(timeContext.hourOfDay)) {
        throw new Error('Invalid time context values generated');
      }

      // Index in Pinecone with sanitized metadata
      const metadata: any = {
        userId: moment.userId,
        momentId: moment.id,
        momentType: moment.type,
        timestamp: timeContext.timestamp,
        preview: searchableText.substring(0, 200),
        dayOfWeek: timeContext.dayOfWeek,
        hourOfDay: timeContext.hourOfDay,
        season: timeContext.season,
      };

      // Add optional fields only if they exist and are valid
      if (this.isValidMetadataValue(moment.mood)) {
        metadata.mood = moment.mood;
      }
      if (moment.emotions && Array.isArray(moment.emotions) && moment.emotions.length > 0) {
        metadata.emotions = moment.emotions;
      }
      if (moment.triggers && Array.isArray(moment.triggers) && moment.triggers.length > 0) {
        metadata.triggers = moment.triggers;
      }
      if (moment.tags && Array.isArray(moment.tags) && moment.tags.length > 0) {
        metadata.tags = moment.tags;
      }
      if (this.isValidMetadataValue(moment.intensity)) {
        metadata.intensity = moment.intensity;
      }
      
      // Sanitize all metadata values before sending to Pinecone
      const sanitizedMetadata = this.sanitizeMetadata(metadata);
      console.log('Sanitized metadata for Pinecone:', sanitizedMetadata);

      await services.index.namespace(NAMESPACE_PREFIX + moment.userId).upsert([
        {
          id: vectorId,
          values: embedding,
          metadata: sanitizedMetadata,
        },
      ]);

      // Update/create vector metadata directly in database
      try {
        const emotionContext = this.createEmotionContext(moment);
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
          ...(emotionContext && { emotionContext }), // Only include if not undefined
          timeContext: {
            timestamp: Timestamp.fromDate(momentDate),
            dayOfWeek: timeContext.dayOfWeek,
            hourOfDay: timeContext.hourOfDay,
            season: timeContext.season,
          },
        };
        
        if (existingMetadata) {
          await updateVectorMetadataServer(moment.userId, existingMetadata.id!, metadataPayload);
        } else {
          await createVectorMetadataServer(metadataPayload);
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
      const { getMomentsServer } = await import('./dbHelpersServer');
      const { calculateTextSimilarity } = await import('./vectorSystem');
      
      const moments = await getMomentsServer(userId, 500);

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

  // Helper to validate metadata values for Pinecone
  private static isValidMetadataValue(value: any): boolean {
    return value !== null && value !== undefined && !Number.isNaN(value);
  }

  // Sanitize metadata for Pinecone (removes null, undefined, NaN values)
  private static sanitizeMetadata(metadata: any): any {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      if (Array.isArray(value)) {
        // For arrays, only include if non-empty and all elements are valid
        const validArray = value.filter(item => this.isValidMetadataValue(item));
        if (validArray.length > 0) {
          sanitized[key] = validArray;
        }
      } else if (this.isValidMetadataValue(value)) {
        sanitized[key] = value;
      }
      // Skip null, undefined, NaN values
    }
    
    return sanitized;
  }
}

/* ---------- SERVER-SPECIFIC FIRESTORE OPERATIONS ---------- */

// Server-specific vector metadata operations using top-level collection
const getVectorMetadataServer = async (userId: string, momentId: string): Promise<VectorMetadata | null> => {
  const services = await initializeVectorServices();
  
  // Try Firebase Admin if available
  if (services?.db) {
    try {
      const snapshot = await services.db.collection('vectorMetadata')
        .where('userId', '==', userId)
        .where('momentId', '==', momentId)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as VectorMetadata;
      }
    } catch (error) {
      console.warn('Firebase Admin query failed, falling back to client SDK:', error);
    }
  }
  
  // Fallback to client SDK with subcollection
  try {
    const { getVectorMetadata } = await import('./moments');
    return await getVectorMetadata(userId, momentId);
  } catch (error) {
    console.error('Failed to get vector metadata:', error);
    return null;
  }
};

const createVectorMetadataServer = async (metadata: Omit<VectorMetadata, 'id' | 'lastUpdated'>): Promise<string> => {
  const services = await initializeVectorServices();
  
  const metadataData = {
    ...metadata,
    lastUpdated: new Date(), // Use Date for Admin SDK
  };
  
  // Try Firebase Admin if available (top-level collection)
  if (services?.db) {
    try {
      const docRef = await services.db.collection('vectorMetadata').add(metadataData);
      console.log('✅ Created vector metadata in top-level collection:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.warn('Firebase Admin create failed, falling back to client SDK:', error);
    }
  }
  
  // Fallback to client SDK with subcollection
  try {
    const { createVectorMetadata } = await import('./moments');
    return await createVectorMetadata({
      ...metadata,
      lastUpdated: Timestamp.now(), // Use Timestamp for client SDK
    } as any);
  } catch (error) {
    console.error('Failed to create vector metadata:', error);
    throw error;
  }
};

const updateVectorMetadataServer = async (
  userId: string, 
  metadataId: string, 
  updates: Partial<VectorMetadata>
): Promise<void> => {
  const services = await initializeVectorServices();
  
  const updateData = {
    ...updates,
    lastUpdated: new Date(), // Use Date for Admin SDK
  };
  
  // Try Firebase Admin if available (top-level collection)
  if (services?.db) {
    try {
      await services.db.collection('vectorMetadata').doc(metadataId).update(updateData);
      console.log('✅ Updated vector metadata in top-level collection:', metadataId);
      return;
    } catch (error) {
      console.warn('Firebase Admin update failed, falling back to client SDK:', error);
    }
  }
  
  // Fallback to client SDK with subcollection
  try {
    const { updateVectorMetadata } = await import('./moments');
    await updateVectorMetadata(userId, metadataId, {
      ...updates,
      lastUpdated: Timestamp.now(), // Use Timestamp for client SDK
    } as any);
  } catch (error) {
    console.error('Failed to update vector metadata:', error);
    throw error;
  }
};

// Export the class as default
export default ServerVectorService;