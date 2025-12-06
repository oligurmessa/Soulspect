import { PersonalityContext, PertinencyContext } from '../context/types';
import { PersonalityContextService } from '../context/personalityContextService';

export interface PromptContext {
    userId: string;
    query: string;
    intent: string;
    // Legacy context fields (optional/deprecated)
    relevantContext?: any[];
    emotionalPatterns?: any;
    similarExperiences?: any[];
    // New Two-Tier Context
    personalityContext?: PersonalityContext | null;
    pertinencyContext?: PertinencyContext;
    source?: string;
}

export class PromptBuilder {
    private context: PromptContext;
    private isStreaming: boolean;

    constructor(context: PromptContext, isStreaming: boolean = false) {
        this.context = context;
        this.isStreaming = isStreaming;
    }

    build(): string {
        const systemMessage = this.getSystemMessage();
        const contextBlock = this.buildContextBlock();
        const instructionBlock = this.getIntentInstructions();
        const outputFormat = this.getOutputFormat();

        return `${systemMessage}

${contextBlock}

${instructionBlock}

${outputFormat}`;
    }

    private getSystemMessage(): string {
        // Base persona - Neutral Journaling Companion
        return `[ROLE]
You are Soulspect, an intelligent journaling companion.
Your core purpose is to help the user reflect, gain clarity, and feel heard.
You are observant, non-judgmental, and grounded.
You adapt your depth and tone to the user's intent.

[GLOBAL CONSTRAINTS]
- Do NOT use clinical or therapeutic language (e.g., "cognitive distortion", "unpacking") unless explicitly asked.
- Do NOT offer unsolicited advice.
- Do NOT assume the user is struggling or in distress unless they say so.
- Maintain a natural, conversational tone.`;
    }

    private buildContextBlock(): string {
        const { personalityContext, pertinencyContext, intent } = this.context;

        let contextStr = "";

        // 1. Personality Context (Tier 1)
        // Always include for DEEP/SUPPORT. Conditionally for others.
        const includePersonality = ['DEEP_INSIGHT', 'EMOTIONAL_SUPPORT', 'LIGHT_REFLECTION'].includes(intent)
            || (intent === 'FACTUAL' && !!personalityContext); // Optional for factual, but good for tone

        if (includePersonality && personalityContext) {
            contextStr += `[PERSONALITY CONTEXT]\n${PersonalityContextService.serialize(personalityContext)}\n\n`;
        }

        // 2. Pertinent Context (Tier 2)
        // Always include for DEEP. Conditional for others.
        const includePertinency = ['DEEP_INSIGHT', 'LIGHT_REFLECTION'].includes(intent)
            || (intent === 'EMOTIONAL_SUPPORT' && (pertinencyContext?.length || 0) > 0)
            || (intent === 'FACTUAL' && (pertinencyContext?.length || 0) > 0);

        if (includePertinency && pertinencyContext && pertinencyContext.length > 0) {
            contextStr += `[PERTINENT CONTEXT]\n${pertinencyContext.map(item =>
                `- (score: ${item.score.toFixed(2)}, date: ${new Date(item.timestamp).toLocaleDateString()}) ${item.preview}`
            ).join('\n')}\n\n`;
        }

        // Fallback to legacy context if new context is missing (during migration)
        if (!contextStr && this.context.relevantContext?.length) {
            contextStr += `[RELEVANT PAST ENTRIES]\n${this.context.relevantContext.map((ctx, i) =>
                `${i + 1}. "${ctx.preview}" (Date: ${new Date(ctx.timestamp).toLocaleDateString()})`
            ).join('\n')}\n\n`;
        }

        return contextStr ? contextStr.trim() : "";
    }

    private getIntentInstructions(): string {
        const { intent, query } = this.context;

        let instructions = `[USER MESSAGE]\n"${query}"\n\n[INSTRUCTIONS]\n`;

        // Add context usage instructions based on intent
        if (['DEEP_INSIGHT', 'EMOTIONAL_SUPPORT'].includes(intent)) {
            instructions += `
- Use [PERSONALITY CONTEXT] to understand who the user is in general.
- Use [PERTINENT CONTEXT] as specific evidence related to this query.
- Do not invent information beyond these sections.\n`;
        }

        switch (intent) {
            case 'FACTUAL':
                instructions += `
- The user is asking for specific information or a simple recall.
- Answer directly and concisely (1-2 sentences).
- Do NOT "unpack" the question.
- Do NOT ask follow-up questions unless clarification is needed.
- Cite the specific entry date if available.`;
                break;

            case 'LIGHT_REFLECTION':
                instructions += `
- The user is sharing a casual update or light thought.
- Acknowledge it warmly.
- Offer a brief, light reflection (1-2 sentences).
- You may ask ONE simple follow-up question to encourage habit, but keep it low-pressure.
- Avoid deep psychoanalysis.`;
                break;

            case 'DEEP_INSIGHT':
                instructions += `
- The user is seeking to understand patterns, "why" they feel this way, or deeper meaning.
- Analyze the [CONTEXT] deeply.
- Connect the current message to the past entries provided.
- Identify patterns in their thinking or behavior.
- Be insightful but tentative (use "it seems", "possibly").
- Ask 1-2 probing questions that help them verify your insight.`;
                break;

            case 'EMOTIONAL_SUPPORT':
                instructions += `
- The user is expressing distress, venting, or seeking comfort.
- PRIORITIZE validation and empathy.
- Do NOT try to "fix" it immediately.
- Validate their feelings (e.g., "It makes sense you feel this way given...").
- Use a warm, soothing tone.
- If appropriate, suggest one small, grounded step.`;
                break;
        }

        if (this.context.source === 'inline_insight') {
            instructions += `
[REFLECTION BLOCK CONSTRAINTS]
- This is a "Reflection Block", designed to PROMPT the user.
- The Title MUST be a short, provocative QUESTION (max 15 words).
- The Body MUST be between 40 and 50 words.
- Focus on a single, powerful insight that leads to the question.
- Do NOT ask open-ended questions in the body (the title is the question).`;
        }

        return instructions;
    }

    private getOutputFormat(): string {
        if (this.isStreaming) {
            return `[OUTPUT FORMAT]
Do NOT return JSON. Return plain text.`;
        }

        if (this.context.source === 'inline_insight') {
            return `[OUTPUT FORMAT]
Return valid JSON ONLY:
{
  "title": "Question title (max 15 words)",
  "response": "Insightful reflection (40-50 words)",
  "priority": "low|medium|high"
}`;
        }

        return `[OUTPUT FORMAT]
Return valid JSON ONLY:
{
  "response": "Your natural language response...",
  "patterns": ["observed pattern 1", ...],
  "suggestions": ["suggestion 1", ...],
  "relatedEntries": [] 
}`;
    }
}
