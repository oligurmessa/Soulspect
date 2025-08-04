import { NextRequest, NextResponse } from 'next/server';
import VectorEngine from '@/lib/vectorEngine';
import { getMoments } from '@/lib/moments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, force = true } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Starting reindex for user ${userId}`);
    const startTime = Date.now();

    // Get all moments for the user
    const moments = await getMoments(userId, { limit: 1000 });
    
    if (moments.length === 0) {
      return NextResponse.json({
        success: true,
        reindexResult: {
          total: 0,
          indexed: 0,
          failed: 0,
          duration: Date.now() - startTime,
        },
      });
    }

    // Batch reindex all moments
    const batchResult = await VectorEngine.batchIndexMoments(moments, force);
    
    const reindexResult = {
      total: moments.length,
      indexed: batchResult.successful,
      failed: batchResult.failed,
      duration: Date.now() - startTime,
    };

    console.log(`✅ Reindex complete for user ${userId}:`, reindexResult);

    return NextResponse.json({
      success: true,
      reindexResult,
    });

  } catch (error) {
    console.error('Error reindexing user:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}