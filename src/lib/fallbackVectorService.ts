// Fallback vector service using basic text similarity when OpenAI is unavailable
import { 
  EmotionLog, 
  JournalEntry, 
  SoulWorkExercise,
} from './dbHelpers';

export class FallbackVectorService {
  // Simple text similarity using word overlap
  private static calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // Format content for search
  private static formatContent(data: any, type: string): string {
    switch (type) {
      case 'journal':
        const journal = data as JournalEntry;
        return `${journal.title} ${journal.content} ${journal.emotions?.join(' ') || ''}`;
      
      case 'emotion':
        const emotion = data as EmotionLog;
        return `${emotion.emotions.join(' ')} ${emotion.triggers?.join(' ') || ''} ${emotion.context || ''}`;
      
      case 'soulwork':
        return `${data.title} ${JSON.stringify(data.responses)}`;
      
      default:
        return JSON.stringify(data);
    }
  }

  // Search through data using text similarity
  static async searchSimilar(
    query: string,
    userData: {
      journals: JournalEntry[];
      emotions: EmotionLog[];
      soulwork: SoulWorkExercise[];
    },
    limit: number = 5
  ): Promise<Array<{
    type: string;
    data: any;
    similarity: number;
    preview: string;
  }>> {
    const results: Array<{
      type: string;
      data: any;
      similarity: number;
      preview: string;
    }> = [];

    // Search journals
    userData.journals.forEach(journal => {
      const content = this.formatContent(journal, 'journal');
      const similarity = this.calculateSimilarity(query, content);
      
      if (similarity > 0.1) {
        results.push({
          type: 'journal',
          data: journal,
          similarity,
          preview: `${journal.title}: ${journal.content?.substring(0, 100)}...`,
        });
      }
    });

    // Search emotions
    userData.emotions.forEach(emotion => {
      const content = this.formatContent(emotion, 'emotion');
      const similarity = this.calculateSimilarity(query, content);
      
      if (similarity > 0.1) {
        results.push({
          type: 'emotion',
          data: emotion,
          similarity,
          preview: `Mood ${emotion.mood}/6: ${emotion.emotions.join(', ')}`,
        });
      }
    });

    // Search soul work
    userData.soulwork.forEach(work => {
      const content = this.formatContent(work, 'soulwork');
      const similarity = this.calculateSimilarity(query, content);
      
      if (similarity > 0.1) {
        results.push({
          type: 'soulwork',
          data: work,
          similarity,
          preview: `${work.title} (${work.exerciseType})`,
        });
      }
    });

    // Sort by similarity and limit results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  // Extract keywords from query
  static extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'but', 'for', 'are', 'you', 'all', 'any', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'not', 'put', 'say', 'she', 'too', 'use'].includes(word));
  }

  // Find patterns in user data
  static findPatterns(userData: {
    journals: JournalEntry[];
    emotions: EmotionLog[];
  }): string[] {
    const patterns: string[] = [];

    // Time patterns
    const timeFreq: Record<number, number> = {};
    userData.emotions.forEach(emotion => {
      const hour = emotion.createdAt.toDate().getHours();
      timeFreq[hour] = (timeFreq[hour] || 0) + 1;
    });

    const peakHour = Object.entries(timeFreq)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (peakHour && peakHour[1] > 2) {
      const hour = parseInt(peakHour[0]);
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      patterns.push(`You tend to reflect most during ${timeOfDay} hours`);
    }

    // Emotion patterns
    const emotionFreq: Record<string, number> = {};
    userData.emotions.forEach(emotion => {
      emotion.emotions.forEach(em => {
        emotionFreq[em] = (emotionFreq[em] || 0) + 1;
      });
    });

    const topEmotion = Object.entries(emotionFreq)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (topEmotion && topEmotion[1] > 3) {
      patterns.push(`"${topEmotion[0]}" appears frequently in your emotional journey`);
    }

    // Trigger patterns
    const triggerFreq: Record<string, number> = {};
    userData.emotions.forEach(emotion => {
      emotion.triggers?.forEach(trigger => {
        triggerFreq[trigger] = (triggerFreq[trigger] || 0) + 1;
      });
    });

    const topTrigger = Object.entries(triggerFreq)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (topTrigger && topTrigger[1] > 2) {
      patterns.push(`"${topTrigger[0]}" is a recurring theme in your experiences`);
    }

    return patterns.slice(0, 3);
  }

  // Generate suggestions based on patterns
  static generateSuggestions(query: string, patterns: string[]): string[] {
    const suggestions: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Query-based suggestions
    if (lowerQuery.includes('anxious') || lowerQuery.includes('anxiety')) {
      suggestions.push('Try the 5-4-3-2-1 grounding technique');
      suggestions.push('Practice deep breathing for 5 minutes');
    } else if (lowerQuery.includes('sad') || lowerQuery.includes('down')) {
      suggestions.push('Reach out to a supportive friend or family member');
      suggestions.push('Engage in a physical activity you enjoy');
    } else if (lowerQuery.includes('stress')) {
      suggestions.push('Take a 10-minute break to step away from stressors');
      suggestions.push('Write down what you can control vs. cannot control');
    } else {
      suggestions.push('Take a moment for self-reflection');
      suggestions.push('Practice gratitude by noting three positive things');
    }

    // Pattern-based suggestions
    if (patterns.some(p => p.includes('evening'))) {
      suggestions.push('Consider a calming bedtime routine');
    }

    return suggestions.slice(0, 3);
  }
}