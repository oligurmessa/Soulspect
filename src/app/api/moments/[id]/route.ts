import { NextRequest, NextResponse } from 'next/server';
import { updateMomentServer, getMomentServer, deleteMomentServer } from '@/lib/dbHelpersServer';
import { authenticateRequest } from '@/lib/firebaseServerAuth';
import ServerVectorService from '@/lib/serverVectorService';
import { vectorDb } from '@/lib/vectorDb';
import { Moment } from '@/lib/moments';

// Get a specific moment
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

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

    console.log(`[API] Getting moment ${params.id} for authenticated user: ${userId}`);
    
    // Use server helpers to get moment
    const moment = await getMomentServer(userId, params.id);
    
    if (!moment) {
      return NextResponse.json({ success: false, error: 'Moment not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, moment });
  } catch (error) {
    console.error('Error fetching moment:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// Update a specific moment
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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

    // Verify user can only update their own moments
    if (auth.uid !== momentData?.userId) {
      return NextResponse.json(
        { error: 'Forbidden - can only update your own moments' },
        { status: 403 }
      );
    }

    if (!momentData) {
      return NextResponse.json(
        { error: 'Missing momentData' },
        { status: 400 }
      );
    }

    console.log(`[API] Updating moment ${params.id} for authenticated user: ${momentData.userId}`);
    
    // Update the moment using server helpers
    await updateMomentServer(momentData.userId, params.id, {
      ...momentData,
      updatedAt: new Date()
    });

    // Re-index for vector search if requested
    if (indexForSearch) {
      try {
        const updatedMoment = await getMomentServer(momentData.userId, params.id);
        if (updatedMoment) {
          await ServerVectorService.indexMoment(updatedMoment);
        }
      } catch (indexError) {
        console.error('Error re-indexing moment:', indexError);
        // Don't fail the update if indexing fails
      }
    }

    return NextResponse.json({ success: true, momentId: params.id });
  } catch (error) {
    console.error('Error updating moment:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// Delete a specific moment
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Authenticate the request
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized - missing or invalid authentication' },
        { status: 401 }
      );
    }

    // Verify user can only delete their own data
    if (auth.uid !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - can only delete your own data' },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    console.log(`[API] Deleting moment ${params.id} for authenticated user: ${userId}`);
    
    // Delete the moment using server helpers
    await deleteMomentServer(userId, params.id);

    // Remove from vector index
    try {
      await vectorDb.deleteVectors(userId, [`moment_${params.id}`]);
    } catch (indexError) {
      console.error('Error removing moment from vector index:', indexError);
      // Don't fail the deletion if index removal fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting moment:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}