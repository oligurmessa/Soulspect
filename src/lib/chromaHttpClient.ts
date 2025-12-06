// HTTP client for ChromaDB (compatible with your token auth setup)
import { embeddingService } from './embeddingService';

interface ChromaMetadata {
  userId: string;
  momentId: string;
  type: string;
  title?: string;
  content?: string;
  mood?: number;
  emotions?: string[];
  triggers?: string[];
  tags?: string[];
  intensity?: number;
  timestamp: number;
  cleanedText?: string;
  preview: string;
  embeddingModel: string;
  dimensions: number;
  [key: string]: any;
}

interface SearchResult {
  id: string;
  score: number;
  metadata: ChromaMetadata;
  document: string;
}

export class ChromaHttpService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly tenant: string;
  private readonly database: string;
  private readonly collectionName = 'soulspect_moments';

  constructor() {
    this.baseUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    this.apiKey = process.env.CHROMA_API_KEY || '';
    this.tenant = process.env.CHROMA_TENANT || 'default_tenant';
    this.database = process.env.CHROMA_DATABASE || 'default_database';
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) {
    const url = `${this.baseUrl}/api/v1/${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization if API key is available
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Add tenant and database headers for multi-tenant ChromaDB
    if (this.tenant) {
      headers['X-Chroma-Tenant'] = this.tenant;
    }
    if (this.database) {
      headers['X-Chroma-Database'] = this.database;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ChromaDB API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  async ensureCollection(): Promise<string> {
    try {
      // Try to get the collection by name
      const collections = await this.makeRequest('collections');
      const existingCollection = collections.find((c: any) => c.name === this.collectionName);

      if (existingCollection) {
        console.log('Collection exists:', this.collectionName, 'ID:', existingCollection.id);
        return existingCollection.id;
      } else {
        throw new Error('Collection not found, will create');
      }
    } catch (error) {
      // Collection doesn't exist, create it
      console.log('Creating collection:', this.collectionName);
      const newCollection = await this.makeRequest('collections', 'POST', {
        name: this.collectionName,
        metadata: {
          description: 'SoulSpect moments and embeddings',
          embedding_model: 'Qwen/Qwen3-Embedding-8B',
          dimensions: 4096 // Match actual embedding dimensions
        }
      });
      console.log('Created collection:', this.collectionName, 'ID:', newCollection.id);
      return newCollection.id;
    }
  }

  async indexMoment(userId: string, momentId: string, content: string, metadata: Partial<ChromaMetadata>): Promise<void> {
    const collectionId = await this.ensureCollection();

    // Create embedding using Qwen3-Embedding-8B
    const embedding = await embeddingService.createEmbedding(content);

    const fullMetadata: ChromaMetadata = {
      userId,
      momentId,
      type: metadata.type || 'unknown',
      title: metadata.title,
      content: metadata.content || content,
      mood: metadata.mood,
      emotions: metadata.emotions,
      triggers: metadata.triggers,
      tags: metadata.tags,
      intensity: metadata.intensity,
      timestamp: metadata.timestamp || Date.now(),
      cleanedText: metadata.cleanedText,
      preview: content.substring(0, 200),
      embeddingModel: 'Qwen/Qwen3-Embedding-8B',
      dimensions: 4096,
      ...metadata
    };

    const documentId = `${userId}_${momentId}`;

    await this.makeRequest(`collections/${collectionId}/add`, 'POST', {
      ids: [documentId],
      embeddings: [embedding],
      documents: [content],
      metadatas: [fullMetadata]
    });

    console.log(`Successfully indexed moment ${momentId} for user ${userId}`);
  }

  async batchIndexMoments(moments: Array<{
    userId: string;
    momentId: string;
    content: string;
    metadata: Partial<ChromaMetadata>;
  }>): Promise<{ successful: number; failed: number }> {
    const collectionId = await this.ensureCollection();

    try {
      // Prepare batch data
      const texts = moments.map(m => m.content);
      const embeddings = await embeddingService.createBatchEmbeddings(texts);

      const ids = moments.map(m => `${m.userId}_${m.momentId}`);
      const documents = texts;
      const metadatas = moments.map(m => ({
        ...m.metadata, // Spread first to get all custom metadata
        userId: m.userId,
        momentId: m.momentId,
        type: m.metadata.type || 'unknown',
        timestamp: m.metadata.timestamp || Date.now(),
        preview: m.content.substring(0, 200),
        embeddingModel: 'Qwen/Qwen3-Embedding-8B', // Override to ensure correct values
        dimensions: 4096, // Override to ensure correct values
      }));

      await this.makeRequest(`collections/${collectionId}/add`, 'POST', {
        ids,
        embeddings,
        documents,
        metadatas
      });

      console.log(`Successfully batch indexed ${moments.length} moments`);
      return { successful: moments.length, failed: 0 };
    } catch (error) {
      console.error('Error batch indexing moments:', error);
      return { successful: 0, failed: moments.length };
    }
  }

  async searchMoments(userId: string, query: string, options: {
    topK?: number;
    includeMetadata?: boolean;
    filter?: Record<string, any>;
  } = {}): Promise<SearchResult[]> {
    const collectionId = await this.ensureCollection();

    const { topK = 5, includeMetadata = true, filter = {} } = options;

    // Create query embedding
    const queryEmbedding = await embeddingService.createEmbedding(query);

    // Build where clause - ChromaDB v0.4.24 requires proper $and structure for multiple conditions
    const whereClause = filter && Object.keys(filter).length > 0 ? {
      '$and': [
        { userId: { '$eq': userId } },
        ...Object.entries(filter).map(([key, value]) => ({
          [key]: typeof value === 'object' ? value : { '$eq': value }
        }))
      ]
    } : {
      userId: { '$eq': userId }
    };

    const results = await this.makeRequest(`collections/${collectionId}/query`, 'POST', {
      query_embeddings: [queryEmbedding],
      n_results: topK,
      where: whereClause,
      include: ['metadatas', 'documents', 'distances']
    });

    // Transform results to our format
    const searchResults: SearchResult[] = [];

    if (results.ids && results.ids[0]) {
      for (let i = 0; i < results.ids[0].length; i++) {
        const id = results.ids[0][i];
        const distance = results.distances ? results.distances[0][i] : 0;
        const metadata = results.metadatas ? results.metadatas[0][i] as ChromaMetadata : {} as ChromaMetadata;
        const document = results.documents ? results.documents[0][i] || '' : '';

        // Convert distance to similarity score (ChromaDB returns cosine distance)
        const score = 1 - distance;

        searchResults.push({
          id,
          score,
          metadata,
          document
        });
      }
    }

    console.log(`Found ${searchResults.length} results for query: ${query}`);
    return searchResults;
  }

  async searchMomentsByVector(userId: string, queryEmbedding: number[], options: {
    topK?: number;
    includeMetadata?: boolean;
    filter?: Record<string, any>;
  } = {}): Promise<SearchResult[]> {
    const collectionId = await this.ensureCollection();

    const { topK = 5, includeMetadata = true, filter = {} } = options;

    // Build where clause - ChromaDB v0.4.24 requires proper $and structure for multiple conditions
    const whereClause = filter && Object.keys(filter).length > 0 ? {
      '$and': [
        { userId: { '$eq': userId } },
        ...Object.entries(filter).map(([key, value]) => ({
          [key]: typeof value === 'object' ? value : { '$eq': value }
        }))
      ]
    } : {
      userId: { '$eq': userId }
    };

    const results = await this.makeRequest(`collections/${collectionId}/query`, 'POST', {
      query_embeddings: [queryEmbedding],
      n_results: topK,
      where: whereClause,
      include: ['metadatas', 'documents', 'distances']
    });

    // Transform results to our format
    const searchResults: SearchResult[] = [];

    if (results.ids && results.ids[0]) {
      for (let i = 0; i < results.ids[0].length; i++) {
        const id = results.ids[0][i];
        const distance = results.distances ? results.distances[0][i] : 0;
        const metadata = results.metadatas ? results.metadatas[0][i] as ChromaMetadata : {} as ChromaMetadata;
        const document = results.documents ? results.documents[0][i] || '' : '';

        // Convert distance to similarity score (ChromaDB returns cosine distance)
        const score = 1 - distance;

        searchResults.push({
          id,
          score,
          metadata,
          document
        });
      }
    }

    console.log(`Found ${searchResults.length} results for vector search`);
    return searchResults;
  }

  async deleteMoment(userId: string, momentId: string): Promise<void> {
    const collectionId = await this.ensureCollection();

    const documentId = `${userId}_${momentId}`;
    await this.makeRequest(`collections/${collectionId}/delete`, 'POST', {
      ids: [documentId]
    });
    console.log(`Deleted moment ${momentId} for user ${userId}`);
  }

  async updateMoment(userId: string, momentId: string, content: string, metadata: Partial<ChromaMetadata>): Promise<void> {
    // ChromaDB update strategy: delete and re-add
    await this.deleteMoment(userId, momentId);
    await this.indexMoment(userId, momentId, content, metadata);
  }

  async getCollectionStats(): Promise<{
    count: number;
    model: string;
    dimensions: number;
  }> {
    try {
      const collectionId = await this.ensureCollection();
      const collection = await this.makeRequest(`collections/${collectionId}`);
      const modelInfo = embeddingService.getModelInfo();

      return {
        count: collection.count || 0,
        model: modelInfo.model,
        dimensions: modelInfo.dimensions
      };
    } catch (error) {
      // If collection doesn't exist yet, return default stats
      const modelInfo = embeddingService.getModelInfo();
      return {
        count: 0,
        model: modelInfo.model,
        dimensions: modelInfo.dimensions
      };
    }
  }

  async clearUserVectors(userId: string): Promise<{ deletedCount: number }> {
    try {
      const collectionId = await this.ensureCollection();

      // Get all documents for this user first
      const response = await this.makeRequest(`collections/${collectionId}/get`, 'POST', {
        where: {
          userId: { $eq: userId }
        }
      });

      if (!response.ids || response.ids.length === 0) {
        console.log(`No vectors found for user ${userId}`);
        return { deletedCount: 0 };
      }

      // Delete all documents for this user
      await this.makeRequest(`collections/${collectionId}/delete`, 'POST', {
        ids: response.ids
      });

      console.log(`Deleted ${response.ids.length} vectors for user ${userId}`);
      return { deletedCount: response.ids.length };
    } catch (error) {
      console.error(`Error clearing vectors for user ${userId}:`, error);
      throw error;
    }
  }

  async getUserVectorCount(userId: string): Promise<{
    count: number;
    vectors: Array<{ id: string; metadata: ChromaMetadata }>;
  }> {
    try {
      const collectionId = await this.ensureCollection();

      const response = await this.makeRequest(`collections/${collectionId}/get`, 'POST', {
        where: {
          userId: { $eq: userId }
        },
        include: ['metadatas']
      });

      const vectors = response.ids ? response.ids.map((id: string, index: number) => ({
        id,
        metadata: response.metadatas[index]
      })) : [];

      return {
        count: vectors.length,
        vectors
      };
    } catch (error) {
      console.error(`Error counting vectors for user ${userId}:`, error);
      return { count: 0, vectors: [] };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test connection with proper headers
      const headers: Record<string, string> = {};

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      if (this.tenant) {
        headers['X-Chroma-Tenant'] = this.tenant;
      }
      if (this.database) {
        headers['X-Chroma-Database'] = this.database;
      }

      const response = await fetch(`${this.baseUrl}/api/v1/heartbeat`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        console.log('ChromaDB connection test successful');
        return true;
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('ChromaDB connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const chromaHttpService = new ChromaHttpService();