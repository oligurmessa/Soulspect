/**
 * UNIFIED VECTOR SYSTEM - Optimized Integration with Firebase Moments
 * 
 * This file provides a clean, unified interface for all vector operations
 * integrated with the Firebase moments structure for maximum efficiency.
 */

import { Moment } from './moments';

/* ---------- CORE TYPES ---------- */

export interface VectorSearchOptions {
  topK?: number;
  type?: Moment['type'];
  emotions?: string[];
  dateRange?: { start: Date; end: Date };
  moodRange?: { min: number; max: number };
  includeMetadata?: boolean;
}

export interface VectorSearchResult {
  moment: Moment | null;
  score: number;
  metadata?: any;
  preview?: string;
}

export interface VectorIndexResult {
  success: boolean;
  momentId: string;
  vectorId?: string;
  error?: string;
}

export interface VectorSystemStatus {
  available: boolean;
  provider: 'pinecone' | 'fallback' | 'none';
  indexed: number;
  errors: string[];
}

/* ---------- UNIFIED VECTOR CLIENT ---------- */

/**
 * Client-side vector operations that work seamlessly with moments
 * Automatically handles fallbacks and errors gracefully
 */
export class VectorSystem {
  
  // Get system status
  static async getStatus(userId: string): Promise<VectorSystemStatus> {
    try {
      const response = await fetch(`/api/vector-system/status?userId=${userId}`);
      const result = await response.json();
      return result.status || {
        available: false,
        provider: 'none',
        indexed: 0,
        errors: ['System unavailable']
      };
    } catch (error) {
      return {
        available: false,
        provider: 'none',
        indexed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // Index a moment for vector search (called automatically when moments are created)
  static async indexMoment(moment: Moment, force = false): Promise<VectorIndexResult> {
    if (!moment.id) {
      return { success: false, momentId: '', error: 'Moment must have an ID' };
    }

    try {
      const response = await fetch('/api/vector-system/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moment, force }),
      });

      const result = await response.json();
      
      if (!result.success) {
        console.warn(`Vector indexing failed for moment ${moment.id}:`, result.error);
      }

      return {
        success: result.success,
        momentId: moment.id,
        vectorId: result.vectorId,
        error: result.error,
      };
    } catch (error) {
      console.warn(`Vector indexing error for moment ${moment.id}:`, error);
      return {
        success: false,
        momentId: moment.id,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Batch index multiple moments
  static async batchIndexMoments(moments: Moment[]): Promise<{
    successful: number;
    failed: number;
    results: VectorIndexResult[];
  }> {
    try {
      const response = await fetch('/api/vector-system/batch-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moments }),
      });

      const result = await response.json();
      return result.batchResult || {
        successful: 0,
        failed: moments.length,
        results: moments.map(m => ({ success: false, momentId: m.id || '', error: 'Batch failed' })),
      };
    } catch (error) {
      return {
        successful: 0,
        failed: moments.length,
        results: moments.map(m => ({ 
          success: false, 
          momentId: m.id || '', 
          error: error instanceof Error ? error.message : 'Network error' 
        })),
      };
    }
  }

  // Semantic search across moments
  static async searchMoments(
    userId: string, 
    query: string, 
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    try {
      const response = await fetch('/api/vector-system/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, query, options }),
      });

      const result = await response.json();
      return result.results || [];
    } catch (error) {
      console.warn('Vector search failed, using fallback:', error);
      return this.fallbackSearch(userId, query, options);
    }
  }

  // Find similar moments to a given moment
  static async findSimilarMoments(
    userId: string, 
    referenceId: string, 
    options: Omit<VectorSearchOptions, 'topK'> & { topK?: number } = {}
  ): Promise<VectorSearchResult[]> {
    try {
      const response = await fetch('/api/vector-system/similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, referenceId, options }),
      });

      const result = await response.json();
      return result.results || [];
    } catch (error) {
      console.warn('Similar search failed:', error);
      return [];
    }
  }

  // AI-powered context retrieval for enhanced responses
  static async getAIContext(
    userId: string, 
    query: string, 
    limit = 5
  ): Promise<{
    contexts: VectorSearchResult[];
    patterns: string[];
    emotionalTrends: any;
  }> {
    try {
      const response = await fetch('/api/vector-system/ai-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, query, limit }),
      });

      const result = await response.json();
      return result.context || { contexts: [], patterns: [], emotionalTrends: null };
    } catch (error) {
      console.warn('AI context retrieval failed:', error);
      return { contexts: [], patterns: [], emotionalTrends: null };
    }
  }

  // Re-index all moments for a user (maintenance operation)
  static async reindexUser(userId: string): Promise<{
    total: number;
    indexed: number;
    failed: number;
    duration: number;
  }> {
    try {
      const response = await fetch('/api/vector-system/reindex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();
      return result.reindexResult || { total: 0, indexed: 0, failed: 0, duration: 0 };
    } catch (error) {
      console.error('User reindex failed:', error);
      return { total: 0, indexed: 0, failed: 1, duration: 0 };
    }
  }

  // Private fallback search using basic text similarity
  private static async fallbackSearch(
    userId: string, 
    query: string, 
    options: VectorSearchOptions
  ): Promise<VectorSearchResult[]> {
    try {
      const response = await fetch('/api/vector-system/fallback-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, query, options }),
      });

      const result = await response.json();
      return result.results || [];
    } catch (error) {
      console.error('Even fallback search failed:', error);
      return [];
    }
  }
}

/* ---------- HELPER FUNCTIONS ---------- */

// Format moment content for optimal vector search
export const formatMomentForVector = (moment: Moment): string => {
  let content = moment.content;
  
  if (moment.title) {
    content = `${moment.title}\n\n${content}`;
  }
  
  // Add structured metadata for better search
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
  
  if (moment.location) {
    metadata.push(`Location: ${moment.location}`);
  }
  
  if (moment.weather) {
    metadata.push(`Weather: ${moment.weather}`);
  }
  
  // Add type-specific context
  switch (moment.type) {
    case 'journal':
      if (moment.journalData?.entryType) {
        metadata.push(`Entry Type: ${moment.journalData.entryType}`);
      }
      break;
    case 'emotion':
      if (moment.intensity) {
        metadata.push(`Intensity: ${moment.intensity}/10`);
      }
      if (moment.emotionData?.context) {
        metadata.push(`Context: ${moment.emotionData.context}`);
      }
      break;
    case 'chat':
      if (moment.chatData?.mode) {
        metadata.push(`Mode: ${moment.chatData.mode}`);
      }
      break;
  }
  
  if (metadata.length > 0) {
    content += '\n\n' + metadata.join('\n');
  }
  
  return content;
};

// Calculate text similarity for fallback search
export const calculateTextSimilarity = (text1: string, text2: string): number => {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
};

// Smart content preprocessing for better embeddings
export const preprocessForEmbedding = (content: string): string => {
  return content
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s.,!?-]/g, '') // Remove special characters except basic punctuation
    .trim()
    .toLowerCase();
};

// Extract key themes from moment content
export const extractThemes = (moment: Moment): string[] => {
  const themes = new Set<string>();
  
  // Add explicit emotions and triggers
  moment.emotions?.forEach(e => themes.add(e));
  moment.triggers?.forEach(t => themes.add(t));
  moment.tags?.forEach(tag => themes.add(tag));
  
  // Add type-based themes
  themes.add(moment.type);
  
  // Add mood-based themes
  if (moment.mood !== undefined) {
    if (moment.mood >= 5) themes.add('positive');
    else if (moment.mood <= 2) themes.add('negative');
    else themes.add('neutral');
  }
  
  return Array.from(themes);
};

// Export the unified system
export default VectorSystem;