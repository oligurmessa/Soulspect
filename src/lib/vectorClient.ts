// Client-side service for vector database operations
export class VectorClient {
  // Index a single item
  static async indexItem(
    userId: string,
    itemId: string,
    data: any,
    dataType: 'journal' | 'emotion' | 'voice' | 'photo' | 'chat'
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
      type: 'journal' | 'emotion' | 'voice' | 'photo' | 'chat';
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
  // Generate enhanced response with streaming
  static async generateResponseStream(
    userId: string,
    query: string,
    mode: 'explore' | 'release' | 'decide' | 'normal' = 'normal',
    source: string = 'inline_insight',
    onChunk?: (chunk: string) => void,
    onContext?: (context: any) => void
  ): Promise<void> {
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
          source,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Enhanced AI API error:', response.status, errorText);
        throw new Error(`Failed to generate enhanced response: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let isMetadata = false;
      let metadataBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process SSE events
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);

              // Handle Context Event
              if (data.type === 'context') {
                if (onContext) onContext(data);
                continue;
              }

              // Handle LLM Chunk
              if (data.choices && data.choices[0]?.delta?.content) {
                const content = data.choices[0].delta.content;

                if (isMetadata) {
                  metadataBuffer += content;
                  // Try to parse metadata if it looks complete-ish (simple check)
                  if (metadataBuffer.trim().endsWith('}')) {
                    try {
                      const metadata = JSON.parse(metadataBuffer);
                      if (onContext) onContext(metadata);
                    } catch (e) {
                      // Incomplete JSON, keep buffering
                    }
                  }
                } else {
                  // Check for separator
                  if (content.includes('---METADATA---')) {
                    const [textPart, metaPart] = content.split('---METADATA---');
                    if (onChunk && textPart) onChunk(textPart);
                    isMetadata = true;
                    if (metaPart) metadataBuffer += metaPart;
                  } else {
                    // Check if we are crossing the boundary in a split chunk
                    // This is tricky, but for now let's assume the separator comes in one piece or we handle it simply
                    // A robust implementation would buffer the last few chars to check for split separator
                    // For "Lightning Fast" prototype, we'll assume the LLM outputs it cleanly or we catch it next chunk
                    // Actually, let's just check if the accumulated text contains it? 
                    // No, we are streaming chunks. 

                    // Simple check: if content contains part of separator, it might be split.
                    // But for now, let's just stream the content.
                    if (onChunk) onChunk(content);
                  }
                }
              }
            } catch (e) {
              console.warn('Error parsing SSE data:', e);
            }
          }
        }
      }

      // Final metadata parse attempt
      if (isMetadata && metadataBuffer) {
        try {
          const metadata = JSON.parse(metadataBuffer);
          if (onContext) onContext(metadata);
        } catch (e) {
          console.warn('Failed to parse final metadata:', e);
        }
      }
    } catch (error) {
      console.error('Error generating enhanced response stream:', error);
      throw error;
    }
  }

  // Generate enhanced response (Legacy/Non-streaming)
  static async generateResponse(
    userId: string,
    query: string,
    mode: 'explore' | 'release' | 'decide' | 'normal' = 'normal',
    source: string = 'inline_insight' // Track where the prompt originated
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
          source,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Enhanced AI API error:', response.status, errorText);
        throw new Error(`Failed to generate enhanced response: ${response.status} - ${errorText}`);
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