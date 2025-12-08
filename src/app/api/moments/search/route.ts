import { NextRequest, NextResponse } from 'next/server';
import { momentVectorService } from '@/lib/momentVectorService';
import { Moment } from '@/lib/moments';
import { SearchMomentsSchema } from '@/lib/validation/schemas';

// Search moments using vector similarity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body with Zod
    const validatedData = SearchMomentsSchema.parse(body);
    const { 
      userId, 
      query, 
      topK = 10, 
      type, 
      emotions, 
      dateRange, 
      moodRange 
    } = validatedData;

    const options: any = { topK };
    if (type) options.type = type as Moment['type'];
    if (emotions) options.emotions = emotions;
    if (dateRange) options.dateRange = dateRange;
    if (moodRange) options.moodRange = moodRange;

    const results = await momentVectorService.searchMoments(userId, query, options);
    
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Error searching moments:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// Find similar moments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const referenceId = searchParams.get('referenceId');
    const type = searchParams.get('type') as Moment['type'] | null;
    const topK = parseInt(searchParams.get('topK') || '5');

    if (!userId || !referenceId) {
      return NextResponse.json(
        { success: false, error: 'userId and referenceId are required' }, 
        { status: 400 }
      );
    }

    const results = await momentVectorService.findSimilarMoments(
      userId, 
      referenceId, 
      type || undefined, 
      topK
    );
    
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Error finding similar moments:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}