import { NextRequest, NextResponse } from 'next/server';
import ServerVectorService from '@/lib/serverVectorService';
import { Moment } from '@/lib/moments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { moment, force = false } = body;

    if (!moment?.id || !moment?.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid moment data' },
        { status: 400 }
      );
    }

    console.log('Indexing moment:', { id: moment.id, timestamp: moment.timestamp });
    const result = await ServerVectorService.indexMoment(moment as Moment, force);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vectorId: result.vectorId,
      skipped: result.skipped || false,
    });
  } catch (error) {
    console.error('Error indexing moment:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}