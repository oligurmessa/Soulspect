import { NextResponse } from 'next/server';
import { enhancedAI } from '@/lib/enhancedAi';

export async function POST(request: Request) {
    try {
        const { userId, query, stream } = await request.json();

        if (!userId || !query) {
            return NextResponse.json({ error: 'Missing userId or query' }, { status: 400 });
        }

        console.log(`[VerifyOptimization] Starting test for user ${userId} with query: "${query}" (stream: ${stream})`);
        const startTime = Date.now();

        if (stream) {
            const streamResponse = await enhancedAI.generateEnhancedResponseStream({
                userId,
                currentQuery: query,
                mode: 'normal',
                source: 'verify_optimization'
            });

            return new NextResponse(streamResponse, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }

        const response = await enhancedAI.generateEnhancedResponse({
            userId,
            currentQuery: query,
            mode: 'normal',
            source: 'verify_optimization'
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`[VerifyOptimization] Completed in ${duration}ms`);

        return NextResponse.json({
            success: true,
            duration,
            response
        });
    } catch (error) {
        console.error('[VerifyOptimization] Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
