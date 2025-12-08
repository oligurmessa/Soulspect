import { AI_CONFIG } from '../config';

// Qwen3-Embedding-8B service via DeepInfra
export class EmbeddingService {
  private readonly apiKey: string;
  private readonly baseUrl = AI_CONFIG.deepinfra.baseUrl;
  private readonly model = AI_CONFIG.deepinfra.embeddingModel;
  
  constructor() {
    this.apiKey = AI_CONFIG.deepinfra.apiKey || '';
    if (!this.apiKey) {
      console.warn('DEEPINFRA_API_KEY not configured. Embedding service will not work.');
      // Don't throw here to avoid breaking the app initialization
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('DEEPINFRA_API_KEY is not configured. Please add it to your environment variables.');
    }

    try {
      console.log('Creating embedding with Qwen3-Embedding-8B via DeepInfra');
      
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: text,
          encoding_format: 'float'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepInfra API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.data || !data.data[0] || !data.data[0].embedding) {
        throw new Error('Invalid response format from DeepInfra API');
      }

      return data.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw error;
    }
  }

  async createBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      console.log(`Creating batch embeddings for ${texts.length} texts`);
      
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: texts,
          encoding_format: 'float'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepInfra API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format from DeepInfra API');
      }

      return data.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error('Error creating batch embeddings:', error);
      throw error;
    }
  }

  getModelInfo() {
    return {
      model: this.model,
      provider: 'DeepInfra',
      dimensions: 4096, // Qwen3-Embedding-8B actually produces 4096-dimensional vectors
      maxTokens: 8192
    };
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();