import { NextRequest, NextResponse } from 'next/server';
import { createMomentServer, getMomentsServer, getMomentServer } from '@/lib/dbHelpersServer';
import { authenticateRequest } from '@/lib/firebaseServerAuth';
import ServerVectorService from '@/lib/serverVectorService';
import { Moment } from '@/lib/moments';

// Create a new moment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { momentData, indexForSearch = true } = body;

    // Authenticate the request
    const auth = await authenticateRequest(request, body);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized - missing or invalid authentication' },
        { status: 401 }
      );
    }

    // Verify user can only create their own moments
    if (auth.uid !== momentData?.userId) {
      return NextResponse.json(
        { error: 'Forbidden - can only create your own moments' },
        { status: 403 }
      );
    }

    if (!momentData) {
      return NextResponse.json(
        { error: 'Missing momentData' },
        { status: 400 }
      );
    }

    console.log(`[API] Creating moment for authenticated user: ${momentData.userId}`);
    
    // Create the moment using server helpers
    const momentId = await createMomentServer(momentData);

    // Index for vector search if requested
    if (indexForSearch && momentId) {
      try {
        const moment = await getMomentServer(momentData.userId, momentId);
        if (moment) {
          await ServerVectorService.indexMoment(moment);
        }
      } catch (indexError) {
        console.error('Error indexing moment:', indexError);
        // Don't fail the creation if indexing fails
      }
    }

    return NextResponse.json({ success: true, momentId });
  } catch (error) {
    console.error('Error creating moment:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// Get moments for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') as Moment['type'] | null;
    const limit = parseInt(searchParams.get('limit') || '50');

    // Authenticate the request
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized - missing or invalid authentication' },
        { status: 401 }
      );
    }

    // Verify user can only access their own data
    if (auth.uid !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - can only access your own data' },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    console.log(`[API] Getting moments for authenticated user: ${userId}`);
    
    // Use server helpers to get moments
    const moments = await getMomentsServer(userId, limit);
    console.log(`[API] Retrieved ${moments.length} raw moments from database`);
    
    // Filter by type if specified
    const filteredMoments = type ? moments.filter(m => m.type === type) : moments;
    console.log(`[API] After filtering: ${filteredMoments.length} moments`);
    
    // Serialize Firestore Timestamps to ISO strings for frontend consumption
    const serializedMoments = filteredMoments.map(moment => ({
      ...moment,
      timestamp: moment.timestamp?.toDate?.() ? moment.timestamp.toDate().toISOString() : moment.timestamp,
      createdAt: moment.createdAt?.toDate?.() ? moment.createdAt.toDate().toISOString() : moment.createdAt,
      updatedAt: moment.updatedAt?.toDate?.() ? moment.updatedAt.toDate().toISOString() : moment.updatedAt,
    }));
    
    console.log(`[API] Returning ${serializedMoments.length} serialized moments to frontend`);
    console.log(`[API] Sample moment structure:`, serializedMoments[0] ? {
      id: serializedMoments[0].id,
      type: serializedMoments[0].type,
      timestamp: serializedMoments[0].timestamp,
      title: serializedMoments[0].title,
      hasContent: !!serializedMoments[0].content
    } : 'No moments to sample');
    
    return NextResponse.json({ success: true, moments: serializedMoments });
  } catch (error) {
    console.error('Error fetching moments:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}