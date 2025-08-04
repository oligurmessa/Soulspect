import { NextRequest, NextResponse } from 'next/server';
import UnifiedDataSync from '@/lib/unifiedDataSync';
import { authenticateRequest } from '@/lib/firebaseServerAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, options = {} } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Authenticate the request
    const auth = await authenticateRequest(request, body);
    if (!auth || auth.uid !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`Starting data migration for user ${userId}`);
    
    const result = await UnifiedDataSync.migrateUserDataToMoments(userId, {
      batchSize: options.batchSize || 50,
      includeVectorIndexing: options.includeVectorIndexing !== false,
    });

    return NextResponse.json({
      success: true,
      migrationResult: result,
    });
  } catch (error) {
    console.error('Error in data migration:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

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

    const status = await UnifiedDataSync.getSyncStatus(userId);

    return NextResponse.json({
      success: true,
      syncStatus: status,
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}