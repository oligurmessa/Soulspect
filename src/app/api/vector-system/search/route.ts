import { NextRequest, NextResponse } from 'next/server';
import ServerVectorService from '@/lib/serverVectorService';
import { getMomentsServer } from '@/lib/moments-server';

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

    let results: any[] = [];
    let searchMethod = 'fallback';

    try {
      // Try server-side vector search first
      const vectorResults = await ServerVectorService.searchMoments(userId, query, options);
      searchMethod = 'vector';
      
      // Convert to consistent format
      results = vectorResults.map((result) => ({
        moment: null, // Can be enriched if needed
        score: result.score,
        metadata: result.metadata,
        preview: result.preview,
        momentId: result.momentId,
      }));

    } catch (vectorError) {
      console.warn('Vector search failed, using fallback:', vectorError);
      
      // Fallback to server-side text similarity search
      try {
        const fallbackResults = await ServerVectorService.fallbackSearch(userId, query, options);
        searchMethod = 'fallback';
        
        results = fallbackResults.map(result => ({
          moment: null, // Fallback doesn't include full moment data
          score: result.score,
          metadata: { momentId: result.momentId },
          preview: result.preview,
          momentId: result.momentId,
        }));
      } catch (fallbackError) {
        console.error('Even fallback search failed:', fallbackError);
        return NextResponse.json(
          { success: false, error: 'All search methods failed' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      results,
      searchMethod,
      total: results.length,
    });

  } catch (error) {
    console.error('Error in vector search:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}