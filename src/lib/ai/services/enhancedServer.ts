/**
 * SERVER-SIDE ENHANCED AI SERVICE
 * Uses server-side data access to avoid permission issues
 */

// DISABLED: vectorEngine imports removed (Pinecone services deleted)
// import { getAllUserDataServer } from './vectorEngine';
import { runLlamaPrompt } from './vertex';
// import VectorEngine from './vectorEngine';
import { Moment } from '../../data/shared/types';

export class EnhancedAIServerService {
  // DISABLED: vectorEngine services removed
  static async indexUserData(userId: string): Promise<void> {
    throw new Error('enhancedAi-server.ts disabled - vectorEngine removed. Use momentVectorService + ChromaDB instead.');
  }

  // Generate enhanced AI response with pattern analysis
  static async generateEnhancedResponse(
    userId: string,
    query: string,
    mode: 'explore' | 'release' | 'decide' | 'normal' = 'normal'
  ): Promise<{
    response: string;
    patterns?: string[];
    suggestions?: string[];
    relatedEntries?: any[];
  }> {
    try {
      // DISABLED: vectorEngine services removed
      throw new Error('enhancedAi-server.ts disabled - vectorEngine removed.');

    } catch (error) {
      console.error('Error analyzing patterns:', error);
      return {
        response: this.getFallbackResponse(mode),
        patterns: ['Unable to analyze patterns at this time'],
        suggestions: [],
        relatedEntries: []
      };
    }
  }

  private static analyzeUserPatterns(moments: Moment[]): string[] {
    const patterns: string[] = [];

    try {
      // Analyze mood patterns
      const moodEntries = moments.filter(m => m.mood !== undefined);
      if (moodEntries.length > 0) {
        const avgMood = moodEntries.reduce((sum, m) => sum + (m.mood || 0), 0) / moodEntries.length;
        patterns.push(`Average mood: ${avgMood.toFixed(1)}/6`);
      }

      // Analyze emotion frequency
      const emotionCounts: Record<string, number> = {};
      moments.forEach(m => {
        m.emotions?.forEach(emotion => {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
      });

      const topEmotions = Object.entries(emotionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([emotion]) => emotion);

      if (topEmotions.length > 0) {
        patterns.push(`Most frequent emotions: ${topEmotions.join(', ')}`);
      }

      // Analyze content themes
      const contentWords = moments
        .map(m => m.content.toLowerCase())
        .join(' ')
        .split(/\\s+/)
        .filter(word => word.length > 4);

      const wordCounts: Record<string, number> = {};
      contentWords.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });

      const commonThemes = Object.entries(wordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([word]) => word);

      if (commonThemes.length > 0) {
        patterns.push(`Common themes: ${commonThemes.join(', ')}`);
      }

    } catch (error) {
      console.error('Error finding fallback patterns:', error);
      patterns.push('Pattern analysis temporarily unavailable');
    }

    return patterns;
  }

  private static async generateContextualResponse(
    query: string,
    recentMoments: Moment[],
    mode: string,
    patterns: string[]
  ): Promise<string> {
    const context = recentMoments.map(m =>
      `${m.type}: ${m.content.substring(0, 200)}`
    ).join('\\n');

    const patternContext = patterns.join('\\n');

    const prompt = `
You are a compassionate AI companion helping with emotional well-being and self-discovery.

User's question: "${query}"
Mode: ${mode}

Recent context from their journal:
${context}

Observed patterns:
${patternContext}

Please provide a thoughtful, personalized response that:
1. Acknowledges their current emotional state
2. References relevant patterns from their data
3. Offers gentle insights or guidance
4. Maintains a warm, supportive tone

Keep the response to 2-3 sentences and focus on being helpful and empathetic.
`;

    try {
      return await runLlamaPrompt(prompt);
    } catch (error) {
      console.error('Vertex AI API error:', error);
      return this.getFallbackResponse(mode);
    }
  }

  private static generateSuggestions(patterns: string[], mode: string): string[] {
    const suggestions = [];

    switch (mode) {
      case 'explore':
        suggestions.push('Try journaling about recurring themes in your thoughts');
        suggestions.push('Notice patterns in your emotional responses');
        break;
      case 'release':
        suggestions.push('Consider what you might be ready to let go of');
        suggestions.push('Practice self-compassion around difficult emotions');
        break;
      case 'decide':
        suggestions.push('Reflect on your core values when making choices');
        suggestions.push('Consider both logical and emotional aspects');
        break;
      default:
        suggestions.push('Continue tracking your emotional patterns');
        suggestions.push('Take time for self-reflection');
    }

    return suggestions;
  }

  private static getFallbackResponse(mode: string): string {
    const responses = {
      explore: "I sense you're reaching into deeper layers of awareness. What patterns do you notice emerging as you reflect on this?",
      release: "Releasing can be both liberating and challenging. What would it feel like to let this go completely?",
      decide: "Decisions become clearer when we align with your deeper knowing. What does your intuition whisper about this choice?",
      normal: "Thank you for sharing that with me. I'm here to support your journey of self-discovery."
    };

    return responses[mode as keyof typeof responses] || responses.normal;
  }
}

export const enhancedAIServer = EnhancedAIServerService;