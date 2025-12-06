// REMOVED: vectorDb import - no longer used for retrieval
import { IntentClassifier } from './ai/intentClassifier';
import { PromptBuilder } from './ai/prompts/promptBuilder';
import { runLlamaPrompt, runLlamaPromptStream } from './vertexai';
import { PersonalityContextService } from './ai/context/personalityContextService';
import { PertinencyContextService } from './ai/context/pertinencyContextService';
// Fallback services removed - system uses only ChromaDB+Qwen
import {
  getMomentsServer,
  getJournalEntriesServer,
  getEmotionLogsServer,
} from './dbHelpersServer';
import { momentVectorService } from './momentVectorService';
import { embeddingService } from './embeddingService';
import { Moment } from './types';
import { Timestamp } from 'firebase/firestore';

interface AIContext {
  userId: string;
  currentQuery: string;
  mode?: 'explore' | 'release' | 'decide' | 'normal';
  recentContext?: any[];
  source?: string; // Track where the prompt originated (inline_insight, soulspace, voice_video)
}

interface PersonalizedInsight {
  response: string;
  relatedEntries?: any[];
  patterns?: string[];
  suggestions?: string[];
  emotionalTrends?: any;
  title?: string;
}

export class EnhancedAIService {

  // Generate enhanced response with context
  async generateEnhancedResponse(context: AIContext): Promise<PersonalizedInsight> {
    try {
      console.log(`[EnhancedAI] Generating response - User: ${context.userId}, Source: ${context.source || 'unknown'}`);

      // 1. CLASSIFY INTENT
      const intentAnalysis = await IntentClassifier.classify(context.currentQuery);
      console.log(`[EnhancedAI] Intent classified: ${intentAnalysis.intent} (Confidence: ${intentAnalysis.confidence})`);

      // 2. GATHER CONTEXT (Two-Tier System)
      const [personalityContext, pertinencyContext] = await Promise.all([
        PersonalityContextService.getOrRebuild(context.userId),
        PertinencyContextService.getPertinencyContext(context.userId, context.currentQuery, intentAnalysis.intent)
      ]);

      console.log(`[AI] Context gathered: Personality (Themes: ${personalityContext.coreThemes.length}), Pertinency (${pertinencyContext.length} items)`);

      // 3. Build Prompt using PromptBuilder
      const promptBuilder = new PromptBuilder({
        userId: context.userId,
        query: context.currentQuery,
        intent: intentAnalysis.intent,
        personalityContext,
        pertinencyContext,
        source: context.source
      }, false);

      const enhancedPrompt = promptBuilder.build();

      console.log('Using enhanced prompt with intent:', intentAnalysis.intent);

      const response = await runLlamaPrompt(enhancedPrompt);

      // Parse JSON response
      let parsedResponse: any;
      try {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/{[\s\S]*}/);
        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
        parsedResponse = JSON.parse(jsonString);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        return {
          response: response,
          relatedEntries: pertinencyContext.slice(0, 3)
        };
      }

      return this.mapResponseToInsight(parsedResponse, pertinencyContext, personalityContext);

    } catch (error) {
      console.error('Error generating enhanced response:', error);
      return {
        response: "I'm here to listen. Could you tell me more?"
      };
    }
  }

  // Generate enhanced response with streaming (Hybrid: Context first, then LLM)
  async generateEnhancedResponseStream(context: AIContext): Promise<ReadableStream<Uint8Array>> {
    try {
      console.log(`[EnhancedAI] Generating streaming response - User: ${context.userId}`);

      // 1. CLASSIFY INTENT
      const intentAnalysis = await IntentClassifier.classify(context.currentQuery);
      console.log(`[EnhancedAI] Intent classified: ${intentAnalysis.intent}`);

      // 2. GATHER CONTEXT (Two-Tier System)
      const [personalityContext, pertinencyContext] = await Promise.all([
        PersonalityContextService.getOrRebuild(context.userId),
        PertinencyContextService.getPertinencyContext(context.userId, context.currentQuery, intentAnalysis.intent)
      ]);

      // 3. Build Prompt
      const promptBuilder = new PromptBuilder({
        userId: context.userId,
        query: context.currentQuery,
        intent: intentAnalysis.intent,
        personalityContext,
        pertinencyContext,
        source: context.source
      }, true); // Streaming = true

      const enhancedPrompt = promptBuilder.build();

      const llmStream = await runLlamaPromptStream(enhancedPrompt);
      const encoder = new TextEncoder();

      return new ReadableStream({
        async start(controller) {
          // 1. Send Context Data as an SSE event
          const contextData = {
            type: 'context',
            intent: intentAnalysis.intent, // Send intent to UI!
            relatedEntries: pertinencyContext.slice(0, 3),
            patterns: [], // Parsed from LLM later
            emotionalTrends: personalityContext.emotionalBaseline, // Use baseline as trends for now
            suggestions: []
          };
          // Format as SSE data
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(contextData)}\n\n`));

          // 2. Stream LLM response
          if (llmStream) {
            const reader = llmStream.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
              }
            } catch (streamError) {
              console.error('Error reading LLM stream:', streamError);
              controller.error(streamError);
            } finally {
              reader.releaseLock();
            }
          }
          controller.close();
        }
      });

    } catch (error) {
      console.error('Error generating streaming response:', error);
      const encoder = new TextEncoder();
      return new ReadableStream({
        start(controller) {
          const errorData = { error: 'Failed to generate response' };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
          controller.close();
        }
      });
    }
  }

  private mapResponseToInsight(parsed: any, pertinencyContext: any[], personalityContext: any): PersonalizedInsight {
    return {
      response: parsed.response || JSON.stringify(parsed),
      relatedEntries: pertinencyContext.slice(0, 3),
      patterns: parsed.patterns || [],
      suggestions: parsed.suggestions || [],
      emotionalTrends: personalityContext.emotionalBaseline,
      title: parsed.title,
    };
  }

  private async findSimilarExperiences(userId: string, query: string, vector?: number[]): Promise<any[]> {
    try {
      // ONLY METHOD: Use ChromaDB+Qwen via momentVectorService
      let momentResults;
      if (vector) {
        momentResults = await momentVectorService.searchMomentsByVector(userId, vector, {
          topK: 3,
          type: 'journal',
        });
      } else {
        momentResults = await momentVectorService.searchMoments(userId, query, {
          topK: 3,
          type: 'journal',
        });
      }

      console.log(`[AI] Similar experiences search returned ${momentResults.length} results`);

      if (momentResults.length === 0) {
        console.log('[AI] No similar experiences found in ChromaDB+Qwen search');
        return [];
      }

      return momentResults.map(r => ({
        preview: r.moment?.content?.substring(0, 200) || 'No content available',
        timestamp: this.normalizeTimestamp(r.moment?.timestamp),
        similarity: r.score,
      }));
    } catch (error) {
      console.error('[AI] Vector search failed – fallback disabled, using basic prompt:', error);
      return [];
    }
  }

  private normalizeTimestamp(timestamp: any): number {
    // Use unified timestamp utility
    const { normalizeTimestampToMs } = require('./timestampUtils');
    return normalizeTimestampToMs(timestamp);
  }

  private getTimeOfDay(hour: number): string {
    if (hour >= 5 && hour < 12) return "morning hours";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "late night";
  }

  // Index existing user data - MOMENTS ONLY
  async indexUserData(userId: string): Promise<void> {
    try {
      console.log(`[AI] Starting data indexing for user ${userId}`);

      // ONLY METHOD: Get and index moments via ChromaDB+Qwen
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
      } else {
        console.log('[AI] No moments found to index');
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
  // Debug method to inspect the full pipeline
  async debugPipeline(context: AIContext): Promise<{
    intent: any;
    personalityContext: any;
    pertinencyContext: any[];
    constructedPrompt: string;
  }> {
    try {
      console.log(`[EnhancedAI] Debugging pipeline - User: ${context.userId}`);

      // 1. Classify
      const intentAnalysis = await IntentClassifier.classify(context.currentQuery);

      // 2. Gather context
      const [personalityContext, pertinencyContext] = await Promise.all([
        PersonalityContextService.getOrRebuild(context.userId),
        PertinencyContextService.getPertinencyContext(context.userId, context.currentQuery, intentAnalysis.intent)
      ]);

      // 3. Build prompt
      const promptBuilder = new PromptBuilder({
        userId: context.userId,
        query: context.currentQuery,
        intent: intentAnalysis.intent,
        personalityContext,
        pertinencyContext,
        source: context.source
      }, false);

      const constructedPrompt = promptBuilder.build();

      return {
        intent: intentAnalysis,
        personalityContext,
        pertinencyContext,
        constructedPrompt
      };

    } catch (error) {
      console.error('Error in debug pipeline:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const enhancedAI = new EnhancedAIService();