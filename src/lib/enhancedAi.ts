import { vectorDb } from './vectorDb';
import { runGeminiPrompt } from './gemini';
import { FallbackVectorService } from './fallbackVectorService';
import { 
  getEmotionLogs, 
  getJournalEntries, 
  getSoulWorkExercises,
  getUser 
} from './dbHelpers';
import {
  getEmotionLogsAdmin,
  getJournalEntriesAdmin,
  getSoulWorkExercisesAdmin
} from './dbHelpersAdmin';
import { Timestamp } from 'firebase/firestore';

interface AIContext {
  userId: string;
  currentQuery: string;
  mode?: 'explore' | 'release' | 'decide' | 'normal';
  recentContext?: any[];
}

interface PersonalizedInsight {
  response: string;
  relatedEntries?: any[];
  patterns?: string[];
  suggestions?: string[];
  emotionalTrends?: any;
}

export class EnhancedAIService {
  // Get relevant context from vector DB with fallback
  private async getRelevantContext(
    userId: string, 
    query: string,
    limit: number = 5
  ): Promise<any[]> {
    try {
      // Try vector DB first
      const results = await vectorDb.search(userId, query, {
        topK: limit,
        includeMetadata: true,
      });

      // Fetch original data from Firebase for top results
      const contextData = [];
      for (const result of results) {
        const metadata = result.metadata;
        
        // Add relevance score and preview
        contextData.push({
          type: metadata.dataType,
          id: metadata.originalId,
          relevanceScore: result.score,
          preview: metadata.preview,
          timestamp: metadata.timestamp,
          mood: metadata.mood,
          emotions: metadata.emotions,
        });
      }

      return contextData;
    } catch (error) {
      console.error('Vector DB unavailable, using fallback search:', error);
      
      // Fallback to basic text similarity search
      try {
        const [journals, emotions, soulwork] = await Promise.all([
          getJournalEntriesAdmin(userId, 50),
          getEmotionLogsAdmin(userId, 50),
          getSoulWorkExercisesAdmin(userId, 20),
        ]);

        const fallbackResults = await FallbackVectorService.searchSimilar(
          query,
          { journals, emotions, soulwork },
          limit
        );

        return fallbackResults.map(result => ({
          type: result.type,
          id: result.data.id,
          relevanceScore: result.similarity,
          preview: result.preview,
          timestamp: result.data.createdAt?.toDate?.()?.getTime() || Date.now(),
          mood: result.data.mood,
          emotions: result.data.emotions,
        }));
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
        return [];
      }
    }
  }

  // Analyze emotional patterns
  private async analyzeEmotionalPatterns(userId: string): Promise<any> {
    try {
      // Get recent emotion logs
      const emotionLogs = await getEmotionLogsAdmin(userId, 30);
      
      // Calculate patterns
      const moodTrend = this.calculateMoodTrend(emotionLogs);
      const dominantEmotions = this.getDominantEmotions(emotionLogs);
      const triggerPatterns = this.analyzeTriggers(emotionLogs);

      return {
        moodTrend,
        dominantEmotions,
        triggerPatterns,
        averageMood: moodTrend.average,
      };
    } catch (error) {
      console.error('Error analyzing patterns:', error);
      return null;
    }
  }

  private calculateMoodTrend(logs: any[]): any {
    if (!logs.length) return { average: 0, trend: 'stable' };

    const moods = logs.map(log => log.mood);
    const average = moods.reduce((a, b) => a + b, 0) / moods.length;
    
    // Calculate trend (last 7 days vs previous 7 days)
    const midPoint = Math.floor(logs.length / 2);
    const recentAvg = moods.slice(0, midPoint).reduce((a, b) => a + b, 0) / midPoint || 0;
    const olderAvg = moods.slice(midPoint).reduce((a, b) => a + b, 0) / (logs.length - midPoint) || 0;
    
    let trend = 'stable';
    if (recentAvg > olderAvg + 0.5) trend = 'improving';
    else if (recentAvg < olderAvg - 0.5) trend = 'declining';

    return { average, trend, recentAvg, olderAvg };
  }

  private getDominantEmotions(logs: any[]): string[] {
    const emotionCounts: Record<string, number> = {};
    
    logs.forEach(log => {
      log.emotions?.forEach((emotion: string) => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    });

    return Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([emotion]) => emotion);
  }

  private analyzeTriggers(logs: any[]): any {
    const triggerCounts: Record<string, number> = {};
    const triggerMoods: Record<string, number[]> = {};
    
    logs.forEach(log => {
      log.triggers?.forEach((trigger: string) => {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
        if (!triggerMoods[trigger]) triggerMoods[trigger] = [];
        triggerMoods[trigger].push(log.mood);
      });
    });

    // Calculate average mood per trigger
    const triggerImpact = Object.entries(triggerMoods).map(([trigger, moods]) => ({
      trigger,
      count: triggerCounts[trigger],
      averageMood: moods.reduce((a, b) => a + b, 0) / moods.length,
    }));

    return triggerImpact.sort((a, b) => b.count - a.count);
  }

  // Generate enhanced response with context
  async generateEnhancedResponse(context: AIContext): Promise<PersonalizedInsight> {
    try {
      // Get relevant context from vector DB
      const relevantContext = await this.getRelevantContext(
        context.userId, 
        context.currentQuery
      );

      // Get emotional patterns
      const emotionalPatterns = await this.analyzeEmotionalPatterns(context.userId);

      // Find similar past experiences
      const similarExperiences = await this.findSimilarExperiences(
        context.userId,
        context.currentQuery
      );

      // Build enhanced prompt
      const enhancedPrompt = this.buildEnhancedPrompt(
        context,
        relevantContext,
        emotionalPatterns,
        similarExperiences
      );

      // Generate response with Gemini
      const response = await runGeminiPrompt(enhancedPrompt);

      // Extract patterns and suggestions
      const patterns = await this.extractPatterns(relevantContext, similarExperiences, context.userId);
      const suggestions = await this.generateSuggestions(
        context.userId,
        context.currentQuery,
        emotionalPatterns
      );

      return {
        response,
        relatedEntries: relevantContext.slice(0, 3),
        patterns,
        suggestions,
        emotionalTrends: emotionalPatterns,
      };
    } catch (error) {
      console.error('Error generating enhanced response:', error);
      
      // Fallback to basic response
      const basicPrompt = this.getBasicPrompt(context.mode || 'normal', context.currentQuery);
      const response = await runGeminiPrompt(basicPrompt);
      
      return { response };
    }
  }

  private async findSimilarExperiences(userId: string, query: string): Promise<any[]> {
    // Search for similar journal entries and emotions
    const results = await vectorDb.search(userId, query, {
      topK: 3,
      filter: {
        dataType: 'journal' as any,
      },
    });

    return results.map(r => ({
      preview: r.metadata.preview,
      timestamp: r.metadata.timestamp,
      similarity: r.score,
    }));
  }

  private buildEnhancedPrompt(
    context: AIContext,
    relevantContext: any[],
    emotionalPatterns: any,
    similarExperiences: any[]
  ): string {
    const modePrompts = {
      explore: "You are a wise guide helping someone explore their subconscious mind and inner patterns.",
      release: "You are a healing companion helping someone release what no longer serves them.",
      decide: "You are a clarity guide helping someone make important decisions.",
      normal: "You are a supportive companion in someone's journey of self-discovery.",
    };

    const basePrompt = modePrompts[context.mode || 'normal'];

    return `${basePrompt}

USER QUERY: "${context.currentQuery}"

PERSONAL CONTEXT:
- Current Emotional State: Mood trending ${emotionalPatterns?.moodTrend?.trend || 'stable'}, average ${emotionalPatterns?.averageMood?.toFixed(1) || 'unknown'}/6
- Dominant Emotions Recently: ${emotionalPatterns?.dominantEmotions?.join(', ') || 'varied'}
- Key Triggers: ${emotionalPatterns?.triggerPatterns?.slice(0, 3).map((t: any) => t.trigger).join(', ') || 'none identified'}

RELEVANT PAST ENTRIES:
${relevantContext.slice(0, 3).map((ctx, i) => 
  `${i + 1}. [${ctx.type}] ${ctx.preview} (Relevance: ${(ctx.relevanceScore * 100).toFixed(0)}%)`
).join('\n')}

SIMILAR EXPERIENCES:
${similarExperiences.slice(0, 2).map((exp, i) => 
  `${i + 1}. "${exp.preview}" (${new Date(exp.timestamp).toLocaleDateString()})`
).join('\n')}

INSTRUCTIONS:
1. Acknowledge their current emotional state and query
2. Reference relevant past experiences when helpful
3. Provide insights that connect patterns across their journey
4. Offer specific, actionable guidance based on their history
5. Be deeply personal and avoid generic responses
6. If you notice concerning patterns, gently bring awareness
7. Celebrate growth and positive changes when evident

Respond in 2-4 sentences with deep personal insight and compassionate guidance.`;
  }

  private async extractPatterns(relevantContext: any[], similarExperiences: any[], userId: string): Promise<string[]> {
    let patterns = [];

    // Time-based patterns
    const timestamps = relevantContext.map(c => c.timestamp);
    if (timestamps.length > 2) {
      const hourCounts: Record<number, number> = {};
      timestamps.forEach(ts => {
        const hour = new Date(ts).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      
      const peakHour = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)[0];
      
      if (peakHour && peakHour[1] > 2) {
        patterns.push(`You often reflect during ${this.getTimeOfDay(parseInt(peakHour[0]))}`);
      }
    }

    // Emotion patterns
    const emotions = relevantContext.flatMap(c => c.emotions || []);
    const emotionPairs: Record<string, number> = {};
    
    for (let i = 0; i < emotions.length - 1; i++) {
      const pair = `${emotions[i]} → ${emotions[i + 1]}`;
      emotionPairs[pair] = (emotionPairs[pair] || 0) + 1;
    }

    const commonTransition = Object.entries(emotionPairs)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (commonTransition && commonTransition[1] > 1) {
      patterns.push(`You tend to transition from ${commonTransition[0]}`);
    }

    // Recurring themes
    if (similarExperiences.length > 1) {
      patterns.push("This theme has appeared in your reflections before");
    }

    // If no patterns found from vector search, use fallback
    if (patterns.length === 0) {
      try {
        const [journals, emotions] = await Promise.all([
          getJournalEntriesAdmin(userId, 30),
          getEmotionLogsAdmin(userId, 30),
        ]);
        
        patterns = FallbackVectorService.findPatterns({ journals, emotions });
      } catch (error) {
        console.error('Error finding fallback patterns:', error);
      }
    }

    return patterns;
  }

  private getTimeOfDay(hour: number): string {
    if (hour >= 5 && hour < 12) return "morning hours";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "late night";
  }

  private async generateSuggestions(
    userId: string, 
    query: string,
    emotionalPatterns: any
  ): Promise<string[]> {
    let suggestions = [];

    // Mood-based suggestions
    if (emotionalPatterns?.moodTrend?.trend === 'declining') {
      suggestions.push("Consider scheduling a self-care activity today");
      suggestions.push("Reach out to someone who brings you joy");
    } else if (emotionalPatterns?.moodTrend?.trend === 'improving') {
      suggestions.push("Journal about what's been working well for you");
      suggestions.push("Share your positive progress with someone you trust");
    }

    // Time-based suggestions
    const hour = new Date().getHours();
    if (hour >= 20 || hour < 6) {
      suggestions.push("Practice a calming bedtime routine tonight");
    } else if (hour >= 6 && hour < 10) {
      suggestions.push("Set a positive intention for your day");
    }

    // Query-based suggestions
    if (query.toLowerCase().includes('anxious') || query.toLowerCase().includes('worried')) {
      suggestions.push("Try the 5-4-3-2-1 grounding technique");
      suggestions.push("Write down three things within your control");
    }

    // If no suggestions yet, use fallback
    if (suggestions.length === 0) {
      const fallbackPatterns = ['general']; // Placeholder
      suggestions = FallbackVectorService.generateSuggestions(query, fallbackPatterns);
    }

    return suggestions.slice(0, 3);
  }

  private getBasicPrompt(mode: string, query: string): string {
    const modePrompts: Record<string, string> = {
      explore: "You are a wise guide helping someone explore their subconscious mind. ",
      release: "You are a healing companion helping someone release what no longer serves them. ",
      decide: "You are a clarity guide helping someone make important decisions. ",
      normal: "You are a supportive companion in someone's journey of self-discovery. ",
    };

    return `${modePrompts[mode]}Respond to this query with compassion and insight: "${query}". Keep your response to 2-3 sentences.`;
  }

  // Index existing user data
  async indexUserData(userId: string): Promise<void> {
    try {
      console.log(`Starting data indexing for user ${userId}`);
      
      // Get all user data
      const [journals, emotions, soulwork] = await Promise.all([
        getJournalEntriesAdmin(userId, 100),
        getEmotionLogsAdmin(userId, 100),
        getSoulWorkExercisesAdmin(userId, 50),
      ]);

      const items: Array<{
        id: string;
        data: any;
        type: 'journal' | 'emotion' | 'soulwork';
      }> = [];

      // Prepare journal entries
      journals.forEach(journal => {
        if (journal.content && journal.id) {
          items.push({
            id: journal.id,
            data: journal,
            type: 'journal' as const,
          });
        }
      });

      // Prepare emotion logs
      emotions.forEach(emotion => {
        if (emotion.id) {
          items.push({
            id: emotion.id,
            data: emotion,
            type: 'emotion' as const,
          });
        }
      });

      // Prepare soul work
      soulwork.forEach(work => {
        if (work.id) {
          items.push({
            id: work.id,
            data: work,
            type: 'soulwork' as const,
          });
        }
      });

      // Batch index
      if (items.length > 0) {
        await vectorDb.batchIndex(userId, items);
        console.log(`Indexed ${items.length} items for user ${userId}`);
      }
    } catch (error) {
      console.error('Error indexing user data:', error);
    }
  }
}

// Export singleton instance
export const enhancedAI = new EnhancedAIService();