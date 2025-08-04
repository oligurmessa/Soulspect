import { vectorDb } from './vectorDb';
import { runGeminiPrompt } from './gemini';
import { FallbackVectorService } from './fallbackVectorService';
import { 
  getEmotionLogs, 
  getJournalEntries, 
  getUser 
} from './dbHelpers';
import {
  getEmotionLogsServer,
  getJournalEntriesServer,
  getMomentsServer,
  checkUserDataServer
} from './dbHelpersServer';
import { momentVectorService } from './momentVectorService';
import { getMoments, Moment } from './moments';
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
      // PRIORITY 1: Try moment-based vector search first (NEW SYSTEM)
      const momentResults = await momentVectorService.searchMoments(userId, query, {
        topK: limit,
        includeMetadata: true,
      });

      if (momentResults.length > 0) {
        console.log(`[AI] Using ${momentResults.length} moments from vector search`);
        return momentResults.map(result => ({
          type: result.moment?.type || 'unknown',
          id: result.moment?.id,
          relevanceScore: result.score,
          preview: result.moment?.content.substring(0, 200),
          timestamp: result.moment?.timestamp.toDate().getTime(),
          mood: result.moment?.mood,
          emotions: result.moment?.emotions,
          source: 'moments'
        }));
      }

      // PRIORITY 2: Try to get moments directly from database
      try {
        const moments = await getMomentsServer(userId, 50);
        if (moments.length > 0) {
          console.log(`[AI] Found ${moments.length} moments, using direct search`);
          // Simple text-based search on moments
          const searchTerms = query.toLowerCase().split(' ');
          const relevantMoments = moments
            .filter(moment => {
              const content = (moment.title + ' ' + moment.content).toLowerCase();
              return searchTerms.some(term => content.includes(term));
            })
            .slice(0, limit)
            .map(moment => ({
              type: moment.type,
              id: moment.id,
              relevanceScore: 0.7, // Default relevance for direct search
              preview: moment.content.substring(0, 200),
              timestamp: moment.timestamp.toDate().getTime(),
              mood: moment.mood,
              emotions: moment.emotions,
              source: 'moments-direct'
            }));
            
          if (relevantMoments.length > 0) {
            return relevantMoments;
          }
        }
      } catch (momentError) {
        console.log('[AI] Direct moment search failed:', momentError);
      }

      // PRIORITY 3 (FALLBACK): Use legacy vector DB only if no moments available
      console.log('[AI] No moments found, falling back to legacy vector search');
      const results = await vectorDb.search(userId, query, {
        topK: limit,
        includeMetadata: true,
      });

      const contextData = [];
      for (const result of results) {
        const metadata = result.metadata;
        contextData.push({
          type: metadata.dataType,
          id: metadata.originalId,
          relevanceScore: result.score,
          preview: metadata.preview,
          timestamp: metadata.timestamp,
          mood: metadata.mood,
          emotions: metadata.emotions,
          source: 'legacy-vector'
        });
      }

      return contextData;
    } catch (error) {
      console.error('All vector search methods failed, using basic fallback:', error);
      
      // FINAL FALLBACK: Basic text similarity on legacy data
      try {
        const [journals, emotions] = await Promise.all([
          getJournalEntriesServer(userId, 50),
          getEmotionLogsServer(userId, 50),
        ]);

        const fallbackResults = await FallbackVectorService.searchSimilar(
          query,
          { journals, emotions },
          limit
        );

        return fallbackResults.map(result => ({
          type: result.type,
          id: result.data.id,
          relevanceScore: result.similarity,
          preview: result.preview,
          timestamp: result.data.createdAt?.toDate?.()?.getTime() || Date.now(),
          mood: result.data.mood || null,
          emotions: result.data.emotions || [],
          source: 'legacy-fallback'
        }));
      } catch (fallbackError) {
        console.error('Even legacy fallback failed:', fallbackError);
        return [];
      }
    }
  }

  // Analyze emotional patterns - PRIORITIZE MOMENTS DATA
  private async analyzeEmotionalPatterns(userId: string): Promise<any> {
    try {
      // PRIORITY 1: Get moments with emotional data
      try {
        const moments = await getMomentsServer(userId, 100);
        const emotionalMoments = moments.filter(m => m.mood !== undefined || (m.emotions && m.emotions.length > 0));
        
        if (emotionalMoments.length > 0) {
          console.log(`[AI] Analyzing patterns from ${emotionalMoments.length} emotional moments`);
          
          // Extract emotion data from moments
          const emotionData = emotionalMoments.map(moment => ({
            mood: moment.mood || 3, // Default to neutral if no mood
            emotions: moment.emotions || [],
            triggers: moment.triggers || [],
            createdAt: moment.timestamp
          }));
          
          const moodTrend = this.calculateMoodTrend(emotionData);
          const dominantEmotions = this.getDominantEmotions(emotionData);
          const triggerPatterns = this.analyzeTriggers(emotionData);
          
          return {
            moodTrend,
            dominantEmotions,
            triggerPatterns,
            averageMood: moodTrend.average,
            dataCount: emotionalMoments.length,
            source: 'moments'
          };
        }
      } catch (momentError) {
        console.log('[AI] No emotional moments found, trying legacy data:', momentError);
      }
      
      // PRIORITY 2 (FALLBACK): Get recent emotion logs from legacy system
      const emotionLogs = await getEmotionLogsServer(userId, 30);
      
      if (!emotionLogs || emotionLogs.length === 0) {
        console.log('[AI] No emotion data found (moments or legacy)');
        return null;
      }
      
      console.log(`[AI] Analyzing patterns from ${emotionLogs.length} legacy emotion logs`);
      
      // Calculate patterns from legacy data
      const moodTrend = this.calculateMoodTrend(emotionLogs);
      const dominantEmotions = this.getDominantEmotions(emotionLogs);
      const triggerPatterns = this.analyzeTriggers(emotionLogs);

      // Validate that we have meaningful data
      if (moodTrend.average === 0 && dominantEmotions.length === 0 && triggerPatterns.length === 0) {
        console.log('[AI] No meaningful patterns found');
        return null;
      }

      return {
        moodTrend,
        dominantEmotions,
        triggerPatterns,
        averageMood: moodTrend.average,
        dataCount: emotionLogs.length,
        source: 'legacy'
      };
    } catch (error) {
      console.error('[AI] Error analyzing emotional patterns:', error);
      return null;
    }
  }

  private calculateMoodTrend(logs: any[]): any {
    if (!logs || logs.length === 0) {
      return { average: 0, trend: null, recentAvg: 0, olderAvg: 0 };
    }

    // Filter out invalid mood values
    const validMoods = logs.map(log => log.mood).filter(mood => mood !== null && mood !== undefined && mood > 0);
    
    if (validMoods.length === 0) {
      return { average: 0, trend: null, recentAvg: 0, olderAvg: 0 };
    }

    const average = validMoods.reduce((a, b) => a + b, 0) / validMoods.length;
    
    // Need at least 4 entries to calculate meaningful trend
    if (validMoods.length < 4) {
      return { average, trend: null, recentAvg: average, olderAvg: 0 };
    }
    
    // Calculate trend (recent half vs older half)
    const midPoint = Math.floor(validMoods.length / 2);
    const recentMoods = validMoods.slice(0, midPoint);
    const olderMoods = validMoods.slice(midPoint);
    
    const recentAvg = recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length;
    const olderAvg = olderMoods.reduce((a, b) => a + b, 0) / olderMoods.length;
    
    let trend = 'stable';
    const difference = recentAvg - olderAvg;
    if (Math.abs(difference) > 0.5) {
      trend = difference > 0 ? 'improving' : 'declining';
    }

    return { average, trend, recentAvg, olderAvg, dataPoints: validMoods.length };
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
      console.log(`Generating enhanced response for user ${context.userId}`);
      
      // Get relevant context from vector DB
      const relevantContext = await this.getRelevantContext(
        context.userId, 
        context.currentQuery
      );
      console.log(`Found ${relevantContext.length} relevant context items`);

      // Get emotional patterns - only if we have real data
      const emotionalPatterns = await this.analyzeEmotionalPatterns(context.userId);
      console.log('Emotional patterns:', emotionalPatterns ? `Found patterns with ${emotionalPatterns.dataCount} data points` : 'No patterns found');

      // Find similar past experiences
      const similarExperiences = await this.findSimilarExperiences(
        context.userId,
        context.currentQuery
      );
      console.log(`Found ${similarExperiences.length} similar experiences`);

      // Only use enhanced prompt if we have meaningful data
      const hasRealData = (emotionalPatterns && emotionalPatterns.dataCount > 0) || 
                         relevantContext.length > 0 || 
                         similarExperiences.length > 0;

      let response: string;
      if (hasRealData) {
        // Build enhanced prompt with real data
        const enhancedPrompt = this.buildEnhancedPrompt(
          context,
          relevantContext,
          emotionalPatterns,
          similarExperiences
        );
        console.log('Using enhanced prompt with real data');
        response = await runGeminiPrompt(enhancedPrompt);
      } else {
        // Use basic prompt without making assumptions about user's emotional state
        console.log('Using basic prompt - no meaningful data available');
        const basicPrompt = this.getBasicPrompt(context.mode || 'normal', context.currentQuery);
        response = await runGeminiPrompt(basicPrompt);
      }

      // Extract patterns and suggestions only if we have real data
      const patterns = hasRealData ? await this.extractPatterns(relevantContext, similarExperiences, context.userId) : [];
      const suggestions = hasRealData ? await this.generateSuggestions(
        context.userId,
        context.currentQuery,
        emotionalPatterns
      ) : [];

      return {
        response,
        relatedEntries: relevantContext.slice(0, 3),
        patterns,
        suggestions,
        emotionalTrends: emotionalPatterns,
      };
    } catch (error) {
      console.error('Error generating enhanced response:', error);
      
      // Fallback to basic response without any assumptions
      try {
        const basicPrompt = this.getBasicPrompt(context.mode || 'normal', context.currentQuery);
        const response = await runGeminiPrompt(basicPrompt);
        return { response };
      } catch (fallbackError) {
        console.error('Even basic prompt failed:', fallbackError);
        return {
          response: "I'm here to listen and support you. Could you tell me more about what's on your mind?"
        };
      }
    }
  }

  private async findSimilarExperiences(userId: string, query: string): Promise<any[]> {
    try {
      // Try new moment-based search first
      const momentResults = await momentVectorService.searchMoments(userId, query, {
        topK: 3,
        type: 'journal',
      });

      if (momentResults.length > 0) {
        return momentResults.map(r => ({
          preview: r.moment?.content.substring(0, 200),
          timestamp: r.moment?.timestamp.toDate().getTime(),
          similarity: r.score,
        }));
      }

      // Fallback to legacy vector search
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
    } catch (error) {
      console.error('Error finding similar experiences:', error);
      return [];
    }
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

    // Build contextual information only from real data
    let personalContext = '';
    let hasRealData = false;

    if (emotionalPatterns && emotionalPatterns.moodTrend && emotionalPatterns.averageMood > 0) {
      personalContext += `- Current Emotional State: Mood trending ${emotionalPatterns.moodTrend.trend}, average ${emotionalPatterns.averageMood.toFixed(1)}/6\n`;
      hasRealData = true;
    }

    if (emotionalPatterns?.dominantEmotions?.length > 0) {
      personalContext += `- Dominant Emotions Recently: ${emotionalPatterns.dominantEmotions.join(', ')}\n`;
      hasRealData = true;
    }

    if (emotionalPatterns?.triggerPatterns?.length > 0) {
      const triggers = emotionalPatterns.triggerPatterns.slice(0, 3).map((t: any) => t.trigger).filter(Boolean);
      if (triggers.length > 0) {
        personalContext += `- Key Triggers: ${triggers.join(', ')}\n`;
        hasRealData = true;
      }
    }

    // Only include relevant context if we have actual data
    const contextSection = relevantContext.length > 0 ? 
      `\nRELEVANT PAST ENTRIES:\n${relevantContext.slice(0, 3).map((ctx, i) => 
        `${i + 1}. [${ctx.type}] ${ctx.preview} (Relevance: ${(ctx.relevanceScore * 100).toFixed(0)}%)`
      ).join('\n')}` : '';

    const experiencesSection = similarExperiences.length > 0 ?
      `\nSIMILAR EXPERIENCES:\n${similarExperiences.slice(0, 2).map((exp, i) => 
        `${i + 1}. "${exp.preview}" (${new Date(exp.timestamp).toLocaleDateString()})`
      ).join('\n')}` : '';

    // Adjust instructions based on available data
    const instructions = hasRealData || relevantContext.length > 0 ?
      `\nINSTRUCTIONS:\n1. Acknowledge their current query with genuine understanding\n2. Reference specific past experiences when available\n3. Provide insights that connect patterns across their journey\n4. Offer specific, actionable guidance based on their history\n5. Be deeply personal and avoid generic responses\n6. If you notice concerning patterns, gently bring awareness\n7. Celebrate growth and positive changes when evident` :
      `\nINSTRUCTIONS:\n1. Acknowledge their current query with empathy\n2. Provide thoughtful, supportive guidance\n3. Ask reflective questions to help them explore their thoughts\n4. Avoid making assumptions about their emotional state\n5. Focus on being present and supportive rather than analytical`;

    const contextHeader = hasRealData ? `\nPERSONAL CONTEXT:\n${personalContext}` : '';

    return `${basePrompt}\n\nUSER QUERY: "${context.currentQuery}"${contextHeader}${contextSection}${experiencesSection}${instructions}\n\nRespond in 2-4 sentences with genuine insight and compassionate guidance.`;
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
          getJournalEntriesServer(userId, 30),
          getEmotionLogsServer(userId, 30),
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

    // Only provide suggestions if we have meaningful data
    // Don't use generic fallback suggestions that might be inappropriate
    if (suggestions.length === 0) {
      console.log('No specific suggestions available - avoiding generic fallbacks');
    }

    return suggestions.slice(0, 3);
  }

  private getBasicPrompt(mode: string, query: string): string {
    const modePrompts: Record<string, string> = {
      explore: "You are a wise guide helping someone explore their thoughts and feelings. Help them discover insights about themselves through thoughtful questions and gentle observations.",
      release: "You are a healing companion helping someone process difficult emotions or experiences. Provide a safe space for them to express themselves and find peace.",
      decide: "You are a supportive guide helping someone work through a decision. Help them explore their options and connect with their inner wisdom.",
      normal: "You are a compassionate companion in someone's journey of self-discovery. Listen deeply and respond with genuine care and understanding.",
    };

    return `${modePrompts[mode]}\n\nThe person has shared: "${query}"\n\nRespond with empathy and genuine insight. Ask thoughtful follow-up questions to encourage deeper reflection. Avoid making assumptions about their emotional state or history. Keep your response to 2-3 sentences and focus on being present and supportive.`;
  }

  // Index existing user data - PRIORITIZE MOMENTS OVER LEGACY
  async indexUserData(userId: string): Promise<void> {
    try {
      console.log(`[AI] Starting data indexing for user ${userId}`);
      
      // PRIORITY 1: Try to get and index moments first (NEW SYSTEM)
      try {
        const moments = await getMomentsServer(userId, 1000);
        if (moments.length > 0) {
          console.log(`[AI] Found ${moments.length} moments, using unified indexing system`);
          await momentVectorService.batchIndexMoments(userId, moments);
          
          // Check if we have any legacy data that should also be migrated
          const hasLegacyData = await this.checkLegacyData(userId);
          if (hasLegacyData.hasData) {
            console.log(`[AI] Also found legacy data: ${hasLegacyData.journalCount} journals, ${hasLegacyData.emotionCount} emotions`);
            console.log('[AI] Consider running data migration to convert legacy data to moments');
          }
          
          return;
        }
      } catch (error) {
        console.log('[AI] No moments found or indexing failed, checking legacy data:', error);
      }
      
      // PRIORITY 2: Fallback to legacy data indexing (ONLY if no moments exist)
      console.log('[AI] No moments available, indexing legacy data');
      const [journals, emotions] = await Promise.all([
        getJournalEntriesServer(userId, 100),
        getEmotionLogsServer(userId, 100),
      ]);

      const items: Array<{
        id: string;
        data: any;
        type: 'journal' | 'emotion';
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

      // Batch index with legacy system
      if (items.length > 0) {
        await vectorDb.batchIndex(userId, items);
        console.log(`[AI] Indexed ${items.length} legacy items for user ${userId}`);
        console.log('[AI] RECOMMENDATION: Migrate this legacy data to moments system for better performance');
      } else {
        console.log('[AI] No data found to index (neither moments nor legacy)');
      }
    } catch (error) {
      console.error('[AI] Error indexing user data:', error);
    }
  }
  
  // Helper to check for legacy data
  private async checkLegacyData(userId: string): Promise<{
    hasData: boolean;
    journalCount: number;
    emotionCount: number;
  }> {
    try {
      const [journals, emotions] = await Promise.all([
        getJournalEntriesServer(userId, 1),
        getEmotionLogsServer(userId, 1),
      ]);
      
      return {
        hasData: journals.length > 0 || emotions.length > 0,
        journalCount: journals.length,
        emotionCount: emotions.length
      };
    } catch (error) {
      return { hasData: false, journalCount: 0, emotionCount: 0 };
    }
  }
}

// Export singleton instance
export const enhancedAI = new EnhancedAIService();