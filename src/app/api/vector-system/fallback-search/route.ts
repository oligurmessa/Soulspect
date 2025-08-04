import { NextRequest, NextResponse } from 'next/server';
import VectorEngine from '@/lib/vectorEngine';
import { getMoments } from '@/lib/moments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, query, options = {} } = body;

    if (!userId || !query) {
      return NextResponse.json(
        { success: false, error: 'userId and query are required' },
        { status: 400 }
      );
    }

    // Get moments for fallback search
    const moments = await getMoments(userId, { 
      limit: 500,
      type: options.type 
    });

    if (moments.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
      });
    }

    // Filter by date range if specified
    let filteredMoments = moments;
    if (options.dateRange) {
      const startTime = new Date(options.dateRange.start).getTime();
      const endTime = new Date(options.dateRange.end).getTime();
      
      filteredMoments = moments.filter(moment => {
        const momentTime = moment.timestamp.toDate().getTime();
        return momentTime >= startTime && momentTime <= endTime;
      });
    }

    // Filter by mood range if specified
    if (options.moodRange) {
      filteredMoments = filteredMoments.filter(moment => {
        return moment.mood !== undefined && 
               moment.mood >= options.moodRange.min && 
               moment.mood <= options.moodRange.max;
      });
    }

    // Perform fallback text similarity search
    const results = await VectorEngine.fallbackSearch(
      userId, 
      query, 
      filteredMoments, 
      { topK: options.topK || 10 }
    );

    // Format results consistently
    const formattedResults = results.map(result => ({
      moment: null, // Could include full moment data if needed
      score: result.score,
      metadata: { momentId: result.momentId },
      preview: result.preview,
      momentId: result.momentId,
    }));

    return NextResponse.json({
      success: true,
      results: formattedResults,
      searchMethod: 'fallback',
    });

  } catch (error) {
    console.error('Error in fallback search:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}