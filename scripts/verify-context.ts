import { enhancedAI } from '../src/lib/enhancedAi';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function main() {
    const userId = 'test-user-context-v1';
    const query = "I feel really anxious about my project deadline.";

    console.log('--- Verifying Two-Tier Context System ---');
    console.log(`User: ${userId}`);
    console.log(`Query: "${query}"`);

    try {
        const result = await enhancedAI.debugPipeline({
            userId,
            currentQuery: query,
            source: 'verification-script'
        });

        console.log('\n--- Result ---');
        console.log('Intent:', result.intent.intent);

        console.log('\n[Personality Context]');
        console.log(JSON.stringify(result.personalityContext, null, 2));

        console.log('\n[Pertinency Context]');
        console.log(JSON.stringify(result.pertinencyContext, null, 2));

        console.log('\n[Constructed Prompt Preview]');
        console.log(result.constructedPrompt.substring(0, 500) + '...');

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

main();
