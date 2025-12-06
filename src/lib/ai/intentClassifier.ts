import { runLlamaPrompt } from '../vertexai';

export type IntentType = 'FACTUAL' | 'LIGHT_REFLECTION' | 'DEEP_INSIGHT' | 'EMOTIONAL_SUPPORT';

export interface IntentAnalysis {
    intent: IntentType;
    confidence: number;
    reasoning: string;
}

export class IntentClassifier {
    static async classify(query: string, recentContext?: string): Promise<IntentAnalysis> {
        try {
            const prompt = `
You are an intent classifier for a journaling AI.
Analyze the user's message and categorize it into exactly one of these intents:

1. FACTUAL: Simple questions about past entries, dates, or specific details. (e.g., "When did I visit Paris?", "What did I write yesterday?")
2. LIGHT_REFLECTION: Casual sharing, daily updates, or light musings. (e.g., "I had a good lunch", "Feeling a bit tired today")
3. DEEP_INSIGHT: Complex questions about patterns, behaviors, or "why" questions. (e.g., "Why do I always self-sabotage?", "Do you see a trend in my mood?")
4. EMOTIONAL_SUPPORT: Expressions of distress, venting, or need for comfort. (e.g., "I can't take it anymore", "I feel so lonely")

User Message: "${query}"
${recentContext ? `Recent Context Snippet: "${recentContext.substring(0, 100)}..."` : ''}

Return JSON ONLY:
{
  "intent": "INTENT_NAME",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}
`;

            const response = await runLlamaPrompt(prompt);

            // Parse JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    intent: this.validateIntent(parsed.intent),
                    confidence: parsed.confidence || 0.5,
                    reasoning: parsed.reasoning || 'No reasoning provided'
                };
            }

            throw new Error('Failed to parse intent JSON');

        } catch (error) {
            console.warn('[IntentClassifier] Classification failed, defaulting to LIGHT_REFLECTION:', error);
            return {
                intent: 'LIGHT_REFLECTION',
                confidence: 0.0,
                reasoning: 'Fallback due to error'
            };
        }
    }

    private static validateIntent(intent: string): IntentType {
        const validIntents: IntentType[] = ['FACTUAL', 'LIGHT_REFLECTION', 'DEEP_INSIGHT', 'EMOTIONAL_SUPPORT'];
        if (validIntents.includes(intent as IntentType)) {
            return intent as IntentType;
        }
        return 'LIGHT_REFLECTION'; // Default fallback
    }
}
