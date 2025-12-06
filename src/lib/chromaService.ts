import { chromaHttpService } from './chromaHttpClient';
import { embeddingService } from './embeddingService';

interface ChromaMetadata {
  userId: string;
  momentId: string;
  type: string;
  timestamp: number;
  mood?: number;
  emotions?: string[];
  triggers?: string[];
  preview: string;
  [key: string]: any;
}

interface SearchResult {
  id: string;
  score: number;
  metadata: ChromaMetadata;
  document: string;
}

export class ChromaVectorService {
  // Delegate to HTTP client for compatibility with your security setup

  async indexMoment(userId: string, momentId: string, content: string, metadata: Partial<ChromaMetadata>): Promise<void> {
    return await chromaHttpService.indexMoment(userId, momentId, content, metadata);
  }

  async batchIndexMoments(moments: Array<{
    userId: string;
    momentId: string;
    content: string;
    metadata: Partial<ChromaMetadata>;
  }>): Promise<{ successful: number; failed: number }> {
    return await chromaHttpService.batchIndexMoments(moments);
  }

  async searchMoments(userId: string, query: string, options: {
    topK?: number;
    includeMetadata?: boolean;
    filter?: Record<string, any>;
  } = {}): Promise<SearchResult[]> {
    return await chromaHttpService.searchMoments(userId, query, options);
  }

  async searchMomentsByVector(userId: string, queryEmbedding: number[], options: {
    topK?: number;
    includeMetadata?: boolean;
    filter?: Record<string, any>;
  } = {}): Promise<SearchResult[]> {
    return await chromaHttpService.searchMomentsByVector(userId, queryEmbedding, options);
  }

  async deleteMoment(userId: string, momentId: string): Promise<void> {
    return await chromaHttpService.deleteMoment(userId, momentId);
  }

  async updateMoment(userId: string, momentId: string, content: string, metadata: Partial<ChromaMetadata>): Promise<void> {
    return await chromaHttpService.updateMoment(userId, momentId, content, metadata);
  }

  async getCollectionStats(): Promise<{
    count: number;
    model: string;
    dimensions: number;
  }> {
    return await chromaHttpService.getCollectionStats();
  }

  async clearUserVectors(userId: string): Promise<{ deletedCount: number }> {
    return await chromaHttpService.clearUserVectors(userId);
  }

  async getUserVectorCount(userId: string): Promise<{
    count: number;
    vectors: Array<{ id: string; metadata: any }>;
  }> {
    return await chromaHttpService.getUserVectorCount(userId);
  }
}

// Export singleton instance
export const chromaService = new ChromaVectorService();