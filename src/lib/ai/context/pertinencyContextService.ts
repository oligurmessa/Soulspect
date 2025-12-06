import { momentVectorService } from '@/lib/momentVectorService';
import { PertinencyContext, PertinentContextItem } from './types';
import { embeddingService } from '@/lib/embeddingService';

const DEFAULT_TOP_K = 5;
const RELEVANCE_THRESHOLD = 0.7;

export class PertinencyContextService {

    static async getPertinencyContext(
        userId: string,
        query: string,
        intent: string,
        options: { topK?: number; threshold?: number } = {}
    ): Promise<PertinencyContext> {
        try {
            const topK = options.topK || DEFAULT_TOP_K;
            const threshold = options.threshold || RELEVANCE_THRESHOLD;

            // 1. Generate embedding
            const queryEmbedding = await embeddingService.createEmbedding(query);

            // 2. Search Moments
            // Note: momentVectorService.searchMomentsByVector returns { moment, score }[]
            const results = await momentVectorService.searchMomentsByVector(userId, queryEmbedding, { topK });

            // 3. Filter and Map
            const pertinentItems: PertinentContextItem[] = results
                .filter(r => r.score >= threshold && r.moment && r.moment.id)
                .map(r => ({
                    id: r.moment!.id!,
                    timestamp: r.moment!.timestamp as any, // Cast to any to satisfy type if mismatch
                    preview: this.createPreview(r.moment!.content),
                    score: r.score
                }));

            // Log selection
            if (pertinentItems.length > 0) {
                console.log(`[PertinencyContext] Selected ${pertinentItems.length} items for "${query}" (Top score: ${pertinentItems[0].score.toFixed(3)})`);
                console.log(`[PertinencyContext] Top Items: ${pertinentItems.map(i => `${i.id} (${i.score.toFixed(2)})`).join(', ')}`);
            } else {
                console.log(`[PertinencyContext] No items met threshold ${threshold} for "${query}"`);
            }

            return pertinentItems;

        } catch (error) {
            console.error('[PertinencyContext] Retrieval failed:', error);
            return [];
        }
    }

    private static createPreview(content: string): string {
        // Simple truncation for now. 
        // Could be smarter (extract relevant sentence).
        const maxLen = 120;
        const clean = content.replace(/\s+/g, ' ').trim();
        if (clean.length <= maxLen) return clean;
        return clean.substring(0, maxLen) + '...';
    }
}
