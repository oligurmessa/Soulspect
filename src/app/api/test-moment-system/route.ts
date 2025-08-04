import { NextRequest, NextResponse } from 'next/server';
import { createMomentServer, getMomentsServer } from '@/lib/dbHelpersServer';
import ServerVectorService from '@/lib/serverVectorService';
import { Moment } from '@/lib/moments';
import { Timestamp } from '@firebase/firestore';

/**
 * Test endpoint to validate the moment creation and vector indexing system
 * This endpoint creates a test moment and attempts to index it
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, testContent } = body;

    if (!userId || !testContent) {
      return NextResponse.json(
        { success: false, error: 'userId and testContent are required' },
        { status: 400 }
      );
    }

    console.log(`[TEST] Starting moment system test for user: ${userId}`);

    // Step 1: Create a test moment
    const momentData: Omit<Moment, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      type: 'journal',
      title: 'Test Moment',
      content: testContent,
      timestamp: Timestamp.fromDate(new Date()),
    };

    const momentId = await createMomentServer(momentData);
    console.log(`[TEST] Created moment: ${momentId}`);

    // Step 2: Test vector indexing
    const moment = { ...momentData, id: momentId } as Moment;
    const indexResult = await ServerVectorService.indexMoment(moment, true);
    console.log(`[TEST] Vector indexing result:`, indexResult);

    // Step 3: Test retrieval
    const retrievedMoments = await getMomentsServer(userId, 10);
    const createdMoment = retrievedMoments.find(m => m.id === momentId);
    console.log(`[TEST] Retrieved moment:`, createdMoment ? 'Found' : 'Not found');

    // Step 4: Test vector system status
    const vectorStatus = await ServerVectorService.getSystemStatus(userId);
    console.log(`[TEST] Vector system status:`, vectorStatus);

    return NextResponse.json({
      success: true,
      testResults: {
        momentCreated: !!momentId,
        momentId,
        vectorIndexed: indexResult.success,
        vectorError: indexResult.error,
        momentRetrieved: !!createdMoment,
        vectorSystemStatus: vectorStatus,
      },
    });
  } catch (error) {
    console.error('[TEST] Error in moment system test:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        testResults: {
          momentCreated: false,
          vectorIndexed: false,
          momentRetrieved: false,
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Get test status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check user's moments
    const moments = await getMomentsServer(userId, 5);
    
    // Check vector system status
    const vectorStatus = await ServerVectorService.getSystemStatus(userId);

    return NextResponse.json({
      success: true,
      status: {
        momentsCount: moments.length,
        latestMoments: moments.map(m => ({
          id: m.id,
          type: m.type,
          title: m.title,
          createdAt: m.createdAt,
        })),
        vectorSystemStatus: vectorStatus,
      },
    });
  } catch (error) {
    console.error('[TEST] Error getting test status:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}