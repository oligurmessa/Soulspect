import { NextRequest, NextResponse } from 'next/server';
import { createMomentServer, getMomentsServer, getMomentServer } from '@/lib/dbHelpersServer';
import { authenticateRequest } from '@/lib/firebaseServerAuth';
import VectorSystem from '@/lib/vectorSystem';
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
          await VectorSystem.indexMoment(moment);
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
    
    // Filter by type if specified
    const filteredMoments = type ? moments.filter(m => m.type === type) : moments;
    
    return NextResponse.json({ success: true, moments: filteredMoments });
  } catch (error) {
    console.error('Error fetching moments:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}