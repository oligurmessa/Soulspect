/**
 * DISABLED: PINECONE VECTOR SYSTEM
 * 
 * This file contained client-side interfaces to deleted Pinecone API routes.
 * REMOVED: All Pinecone/OpenAI references eliminated in migration to ChromaDB+Qwen
 * 
 * File kept for reference but all functions disabled.
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
  provider: 'chroma' | 'none'; // UPDATED: Removed 'pinecone' | 'fallback'
  indexed: number;
  errors: string[];
}

/* ---------- UNIFIED VECTOR CLIENT ---------- */

/**
 * Client-side vector operations that work seamlessly with moments
 * Automatically handles fallbacks and errors gracefully
 */
export class VectorSystem {
  // ALL METHODS DISABLED - PINECONE API ROUTES REMOVED
  
  private static throwDisabledError(): never {
    throw new Error('VectorSystem disabled - Pinecone API routes removed. Use momentVectorService + ChromaDB instead.');
  }
  
  // DISABLED: Pinecone API routes removed
  static async getStatus(userId: string): Promise<VectorSystemStatus> {
    this.throwDisabledError();
  }

  // DISABLED: Pinecone API routes removed
  static async indexMoment(moment: Moment, force = false): Promise<VectorIndexResult> {
    this.throwDisabledError();
  }

  // DISABLED: Pinecone API routes removed
  static async batchIndexMoments(moments: Moment[]): Promise<{
    successful: number;
    failed: number;
    results: VectorIndexResult[];
  }> {
    this.throwDisabledError();
  }

  // DISABLED: Pinecone API routes removed
  static async searchMoments(
    userId: string, 
    query: string, 
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    this.throwDisabledError();
  }

  // DISABLED: Pinecone API routes removed
  static async findSimilarMoments(
    userId: string, 
    referenceId: string, 
    options: Omit<VectorSearchOptions, 'topK'> & { topK?: number } = {}
  ): Promise<VectorSearchResult[]> {
    this.throwDisabledError();
  }

  // DISABLED: Pinecone API routes removed
  static async getAIContext(
    userId: string, 
    query: string, 
    limit = 5
  ): Promise<{
    contexts: VectorSearchResult[];
    patterns: string[];
    emotionalTrends: any;
  }> {
    this.throwDisabledError();
  }

  // DISABLED: Pinecone API routes removed
  static async reindexUser(userId: string): Promise<{
    total: number;
    indexed: number;
    failed: number;
    duration: number;
  }> {
    this.throwDisabledError();
  }

  // DISABLED: Pinecone API routes removed
  private static async fallbackSearch(
    userId: string, 
    query: string, 
    options: VectorSearchOptions
  ): Promise<VectorSearchResult[]> {
    this.throwDisabledError();
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