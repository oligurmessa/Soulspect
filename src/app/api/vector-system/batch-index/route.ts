import { NextRequest, NextResponse } from 'next/server';
import VectorEngine from '@/lib/vectorEngine';
import { Moment } from '@/lib/moments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { moments, force = false } = body;

    if (!Array.isArray(moments) || moments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid moments array' },
        { status: 400 }
      );
    }

    // Validate moments
    const validMoments = moments.filter((m: any) => m?.id && m?.userId);
    if (validMoments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid moments to index' },
        { status: 400 }
      );
    }

    const batchResult = await VectorEngine.batchIndexMoments(validMoments as Moment[], force);
    
    return NextResponse.json({
      success: true,
      batchResult,
    });
  } catch (error) {
    console.error('Error batch indexing moments:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}