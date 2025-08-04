import { NextRequest, NextResponse } from 'next/server';
import VectorEngine from '@/lib/vectorEngine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, referenceId, options = {} } = body;

    if (!userId || !referenceId) {
      return NextResponse.json(
        { success: false, error: 'userId and referenceId are required' },
        { status: 400 }
      );
    }

    const results = await VectorEngine.findSimilarMoments(userId, referenceId, options);
    
    // Convert to consistent format
    const formattedResults = results.map(result => ({
      moment: null, // Could fetch full moment data if needed
      score: result.score,
      metadata: result.metadata,
      momentId: result.momentId,
    }));

    return NextResponse.json({
      success: true,
      results: formattedResults,
    });

  } catch (error) {
    console.error('Error finding similar moments:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}