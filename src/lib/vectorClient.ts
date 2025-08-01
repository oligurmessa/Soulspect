// Client-side service for vector database operations
export class VectorClient {
  // Index a single item
  static async indexItem(
    userId: string,
    itemId: string,
    data: any,
    dataType: 'journal' | 'emotion' | 'voice' | 'photo' | 'chat' | 'soulwork'
  ): Promise<void> {
    try {
      const response = await fetch('/api/vector/index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          itemId,
          data,
          dataType,
        }),
      });

      if (!response.ok) {
        // Don't throw error if indexing fails - just log it
        console.warn('Vector indexing unavailable, continuing without it');
        return;
      }
    } catch (error) {
      console.warn('Vector indexing failed, continuing without it:', error);
      // Don't throw - let the app continue working
    }
  }

  // Batch index multiple items
  static async batchIndex(
    userId: string,
    items: Array<{
      id: string;
      data: any;
      type: 'journal' | 'emotion' | 'voice' | 'photo' | 'chat' | 'soulwork';
    }>
  ): Promise<void> {
    try {
      const response = await fetch('/api/vector/index', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          items,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to batch index items');
      }
    } catch (error) {
      console.error('Error batch indexing:', error);
      throw error;
    }
  }

  // Search vectors
  static async search(
    userId: string,
    query: string,
    options: {
      topK?: number;
      filter?: any;
      includeMetadata?: boolean;
    } = {}
  ): Promise<any[]> {
    try {
      const response = await fetch('/api/vector/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          query,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search vectors');
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching vectors:', error);
      return [];
    }
  }
}

export class EnhancedAIClient {
  // Generate enhanced response
  static async generateResponse(
    userId: string,
    query: string,
    mode: 'explore' | 'release' | 'decide' | 'normal' = 'normal'
  ): Promise<any> {
    try {
      const response = await fetch('/api/ai/enhanced-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          query,
          mode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate enhanced response');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating enhanced response:', error);
      throw error;
    }
  }

  // Index user data
  static async indexUserData(userId: string): Promise<void> {
    try {
      const response = await fetch('/api/ai/index-user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to index user data');
      }
    } catch (error) {
      console.error('Error indexing user data:', error);
      throw error;
    }
  }
}