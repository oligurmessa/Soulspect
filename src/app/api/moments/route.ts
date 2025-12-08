import { NextRequest, NextResponse } from 'next/server';
import { createMomentServer, getMomentsServer, getMomentServer } from '@/lib/data/server/moments';
import { authenticateRequest } from '@/lib/firebaseServerAuth';
import { momentVectorService } from '@/lib/momentVectorService';
import { Moment } from '@/lib/moments';
import { CreateMomentSchema } from '@/lib/validation/schemas';
import { serverTimestamp } from 'firebase/firestore';

// Create a new moment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validatedData = CreateMomentSchema.parse(body);
    const { momentData, indexForSearch = true } = validatedData;

    // Authenticate the request
    const auth = await authenticateRequest(request, body);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized - missing or invalid authentication' },
        { status: 401 }
      );
    }

    // Verify user can only create their own moments
    if (auth.uid !== momentData.userId) {
      return NextResponse.json(
        { error: 'Forbidden - can only create your own moments' },
        { status: 403 }
      );
    }

    console.log(`[API] Creating moment for authenticated user: ${momentData.userId}`);

    // Ensure timestamp exists (add if missing)
    const momentDataWithTimestamp = {
      ...momentData,
      timestamp: momentData.timestamp || serverTimestamp()
    };

    // Create the moment using server helpers
    const momentId = await createMomentServer(momentDataWithTimestamp);

    // Index for vector search if requested
    if (indexForSearch && momentId) {
      try {
        const moment = await getMomentServer(momentData.userId, momentId);
        if (moment) {
          await momentVectorService.indexMoment(moment);
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
    const moments = await getMomentsServer(userId, { limit });
    console.log(`[API] Retrieved ${moments.length} raw moments from database`);

    // Filter by type if specified
    const filteredMoments = type ? moments.filter(m => m.type === type) : moments;
    console.log(`[API] After filtering: ${filteredMoments.length} moments`);

    // Serialize Firestore Timestamps to ISO strings for frontend consumption
    const serializedMoments = filteredMoments.map(moment => {
      const serialized = { ...moment } as any;

      // Handle Firestore Timestamp objects or plain objects with seconds/nanoseconds
      if (moment.timestamp) {
        if (typeof moment.timestamp.toDate === 'function') {
          serialized.timestamp = moment.timestamp.toDate().toISOString();
        } else if (moment.timestamp.seconds) {
          serialized.timestamp = new Date(moment.timestamp.seconds * 1000).toISOString();
        }
      }

      if (moment.createdAt) {
        if (typeof moment.createdAt.toDate === 'function') {
          serialized.createdAt = moment.createdAt.toDate().toISOString();
        } else if (moment.createdAt.seconds) {
          serialized.createdAt = new Date(moment.createdAt.seconds * 1000).toISOString();
        }
      }

      if (moment.updatedAt) {
        if (typeof moment.updatedAt.toDate === 'function') {
          serialized.updatedAt = moment.updatedAt.toDate().toISOString();
        } else if (moment.updatedAt.seconds) {
          serialized.updatedAt = new Date(moment.updatedAt.seconds * 1000).toISOString();
        }
      }

      return serialized;
    });

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