import { adminDb as db } from '@/lib/firebaseAdmin';
import { PersonalityContext } from './types';
import { runLlamaPrompt } from '@/lib/vertexai';
import * as timestampUtils from '@/lib/timestampUtils';

const COLLECTION_NAME = 'personalityContexts';
const MAX_TOKEN_CAP = 400; // Rough estimate for text serialization

export class PersonalityContextService {

    /**
     * Get existing context or rebuild if missing/stale.
     */
    static async getOrRebuild(userId: string): Promise<PersonalityContext> {
        const existing = await this.getPersonalityContext(userId);

        if (!existing) {
            console.log(`[PersonalityContext] No context found for ${userId}, rebuilding...`);
            return this.rebuildPersonalityContext(userId);
        }

        // Check staleness (24h)
        const lastUpdated = new Date(existing.lastUpdated).getTime();
        const now = Date.now();
        const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            console.log(`[PersonalityContext] Context stale (${hoursDiff.toFixed(1)}h), rebuilding...`);
            // Rebuild in background to not block response? 
            // For now, let's block to ensure freshness, or we can return existing and trigger rebuild.
            // User requested "Rebuild when... lastUpdated older than 24h".
            return this.rebuildPersonalityContext(userId);
        }

        return existing;
    }

    static async getPersonalityContext(userId: string): Promise<PersonalityContext | null> {
        try {
            const doc = await db.collection(COLLECTION_NAME).doc(userId).get();
            if (doc.exists) {
                return doc.data() as PersonalityContext;
            }
            return null;
        } catch (error) {
            console.error('[PersonalityContext] Failed to fetch:', error);
            return null;
        }
    }

    static async rebuildPersonalityContext(userId: string): Promise<PersonalityContext> {
        try {
            console.log(`[PersonalityContext] Rebuilding for ${userId}`);

            // 1. Fetch recent moments (last 20 for analysis)
            // Note: In a real agentic system, we'd crawl more intelligently.
            // Here we use a simple heuristic: last 20 moments.
            const momentsSnap = await db.collection(`users/${userId}/moments`)
                .orderBy('timestamp', 'desc')
                .limit(20)
                .get();

            const momentsText = momentsSnap.docs.map((d: any) => {
                const data = d.data();
                return `[${timestampUtils.normalizeTimestampToDate(data.timestamp).toLocaleDateString()}] ${data.content}`;
            }).join('\n\n');

            if (!momentsText) {
                return this.createEmptyContext();
            }

            // 2. Analyze with LLM
            const prompt = `
You are an expert analyst for a journaling AI.
Analyze the following user journal entries to construct a "Personality Context".

USER ENTRIES:
${momentsText}

TASK:
Extract the following profile data. Be concise.
1. Identity: Name, pronouns, roles (e.g. "student", "parent").
2. Core Themes: Recurring patterns (e.g. "anxiety", "ambition"). Max 5.
3. Long-Term Goals: Inferred or explicit. Max 3.
4. Emotional Baseline: Typical mood (1-10) and dominant emotions.
5. Key Milestones: Significant life events mentioned with dates.

OUTPUT JSON ONLY:
{
  "identity": { "name": "...", "pronouns": "...", "roles": ["..."] },
  "coreThemes": ["..."],
  "longTermGoals": ["..."],
  "emotionalBaseline": { "typicalMood": 7, "dominantEmotions": ["..."] },
  "keyMilestones": [{ "title": "...", "date": "YYYY-MM" }]
}
`;

            const response = await runLlamaPrompt(prompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);

            let parsed: Partial<PersonalityContext> = {};
            if (jsonMatch) {
                try {
                    parsed = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.error('[PersonalityContext] JSON parse failed', e);
                }
            }

            // 3. Construct Context Object
            const newContext: PersonalityContext = {
                identity: parsed.identity || {},
                coreThemes: parsed.coreThemes || [],
                longTermGoals: parsed.longTermGoals || [],
                emotionalBaseline: parsed.emotionalBaseline || {},
                keyMilestones: parsed.keyMilestones || [],
                lastUpdated: new Date().toISOString()
            };

            // 4. Save
            await db.collection(COLLECTION_NAME).doc(userId).set(newContext);

            // Log update details
            console.log(`[PersonalityContext] Rebuilt for ${userId} at ${newContext.lastUpdated}`);
            console.log(`[PersonalityContext] Stats: Themes=${newContext.coreThemes.length}, Goals=${newContext.longTermGoals.length}, Milestones=${newContext.keyMilestones.length}`);
            console.log(`[PersonalityContext] Identity: ${newContext.identity.name || 'Unknown'}, Roles: ${newContext.identity.roles?.join(', ') || 'None'}`);

            return newContext;

        } catch (error) {
            console.error('[PersonalityContext] Rebuild failed:', error);
            return this.createEmptyContext();
        }
    }

    static serialize(ctx: PersonalityContext): string {
        const parts = [];

        // Identity
        let idStr = "Identity: ";
        const idParts = [];
        if (ctx.identity.name) idParts.push(ctx.identity.name);
        if (ctx.identity.roles?.length) idParts.push(ctx.identity.roles.join(', '));
        if (idParts.length) parts.push(idStr + idParts.join(', ') + ".");

        // Themes
        if (ctx.coreThemes.length) {
            parts.push(`Core themes: ${ctx.coreThemes.join(', ')}.`);
        }

        // Goals
        if (ctx.longTermGoals.length) {
            parts.push(`Long-term goals: ${ctx.longTermGoals.join(', ')}.`);
        }

        // Emotional
        if (ctx.emotionalBaseline.typicalMood || ctx.emotionalBaseline.dominantEmotions?.length) {
            let emoStr = "Emotional baseline: ";
            if (ctx.emotionalBaseline.typicalMood) emoStr += `typical mood ${ctx.emotionalBaseline.typicalMood}/10`;
            if (ctx.emotionalBaseline.dominantEmotions?.length) {
                emoStr += `, often ${ctx.emotionalBaseline.dominantEmotions.join('/')}`;
            }
            parts.push(emoStr + ".");
        }

        // Milestones
        if (ctx.keyMilestones.length) {
            const ms = ctx.keyMilestones.map(m => `${m.title} (${m.date || 'unknown'})`).join(', ');
            parts.push(`Key milestones: ${ms}.`);
        }

        return parts.join(' ');
    }

    private static createEmptyContext(): PersonalityContext {
        return {
            identity: {},
            coreThemes: [],
            longTermGoals: [],
            emotionalBaseline: {},
            keyMilestones: [],
            lastUpdated: new Date().toISOString()
        };
    }
}
