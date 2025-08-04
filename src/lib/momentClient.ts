import { Moment } from './moments';
import VectorSystem from './vectorSystem';
import { auth } from './firebase';

/* ---------- CLIENT-SIDE MOMENT SERVICE ---------- */

export class MomentClient {
  
  // Get auth headers for API requests
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }
  
  // Create a new moment with automatic vector indexing
  static async createMoment(
    momentData: Omit<Moment, 'id' | 'createdAt' | 'updatedAt'>,
    indexForSearch = true
  ): Promise<string> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch('/api/moments', {
      method: 'POST',
      headers,
      body: JSON.stringify({ momentData, indexForSearch: false }), // We'll index separately
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create moment');
    }

    // Index for vector search using the optimized system
    if (indexForSearch && result.momentId) {
      try {
        const fullMoment = { ...momentData, id: result.momentId } as Moment;
        await VectorSystem.indexMoment(fullMoment);
      } catch (indexError) {
        console.warn('Vector indexing failed for new moment:', indexError);
        // Don't fail the creation if indexing fails
      }
    }

    return result.momentId;
  }

  // Get moments for a user
  static async getMoments(
    userId: string,
    options: {
      type?: Moment['type'];
      limit?: number;
    } = {}
  ): Promise<Moment[]> {
    const headers = await this.getAuthHeaders();
    const params = new URLSearchParams({ userId });
    if (options.type) params.append('type', options.type);
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await fetch(`/api/moments?${params.toString()}`, {
      headers,
    });
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch moments');
    }

    return result.moments;
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
    } = {}
  ): Promise<Array<{
    moment: Moment | null;
    score: number;
    metadata: any;
  }>> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch('/api/moments/search', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId,
        query,
        ...options,
      }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to search moments');
    }

    return result.results;
  }

  // Find similar moments
  static async findSimilarMoments(
    userId: string,
    referenceId: string,
    type?: Moment['type'],
    topK = 5
  ): Promise<Array<{
    moment: Moment | null;
    score: number;
  }>> {
    const headers = await this.getAuthHeaders();
    const params = new URLSearchParams({ 
      userId, 
      referenceId,
      topK: topK.toString()
    });
    if (type) params.append('type', type);

    const response = await fetch(`/api/moments/search?${params.toString()}`, {
      headers,
    });
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to find similar moments');
    }

    return result.results;
  }
  
  // Update a moment
  static async updateMoment(
    momentId: string,
    momentData: Partial<Moment> & { userId: string },
    indexForSearch = true
  ): Promise<void> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`/api/moments/${momentId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ momentData, indexForSearch }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update moment');
    }
  }
  
  // Delete a moment
  static async deleteMoment(
    userId: string,
    momentId: string
  ): Promise<void> {
    const headers = await this.getAuthHeaders();
    const params = new URLSearchParams({ userId });
    
    const response = await fetch(`/api/moments/${momentId}?${params.toString()}`, {
      method: 'DELETE',
      headers,
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete moment');
    }
  }
}

// Helper function to create a moment with unified content
export const createUnifiedMoment = async (
  userId: string,
  type: Moment['type'],
  title: string | undefined,
  content: string,
  metadata: {
    mood?: number;
    emotions?: string[];
    triggers?: string[];
    intensity?: number;
    tags?: string[];
    attachments?: string[];
  } = {}
): Promise<string> => {
  const momentData: Omit<Moment, 'id' | 'createdAt' | 'updatedAt'> = {
    userId,
    type,
    title,
    content,
    timestamp: { toDate: () => new Date() } as any, // Will be converted server-side
    ...metadata,
  };

  return MomentClient.createMoment(momentData);
};

// Helper function to update a moment
export const updateUnifiedMoment = async (
  momentId: string,
  userId: string,
  updates: Partial<Moment>,
  indexForSearch = true
): Promise<void> => {
  const momentData = {
    ...updates,
    userId,
  };

  return MomentClient.updateMoment(momentId, momentData, indexForSearch);
};