import { NextRequest, NextResponse } from 'next/server';
import { updateMomentServer, getMomentServer, deleteMomentServer } from '@/lib/data/server/moments';
import { authenticateRequest } from '@/lib/firebaseServerAuth';
import { momentVectorService } from '@/lib/momentVectorService';
import { Moment } from '@/lib/moments';
import { UpdateMomentSchema } from '@/lib/validation/schemas';
import { serverTimestamp } from 'firebase/firestore';

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

    // Validate request body with Zod
    const validatedData = UpdateMomentSchema.parse(body);
    const { momentData, indexForSearch = true } = validatedData;

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

    console.log(`[API] Updating moment ${params.id} for authenticated user: ${momentData.userId}`);

    // Update the moment using server helpers
    await updateMomentServer(momentData.userId, params.id, {
      ...momentData,
      updatedAt: serverTimestamp() as any
    });

    // Index for vector search if requested (controlled by indexForSearch flag)
    // Autosave should send indexForSearch: false to avoid spamming ChromaDB
    // Final save should send indexForSearch: true to update the vector index
    if (indexForSearch) {
      try {
        const moment = await getMomentServer(momentData.userId, params.id);
        if (moment) {
          // OPTIMIZATION: Check content hash to avoid redundant indexing
          const crypto = require('crypto');
          const contentToHash = `${moment.title || ''}|${moment.content || ''}|${(moment.tags || []).join(',')}|${(moment.emotions || []).join(',')}`;
          const newHash = crypto.createHash('sha256').update(contentToHash).digest('hex');

          if (moment.lastIndexedContentHash === newHash) {
            console.log(`[API] Content hash matched (${newHash.substring(0, 8)}), skipping redundant indexing for moment ${params.id}`);
          } else {
            // Use force=false to avoid unnecessary delete+recreate operations
            // This will only update the vector if the ID exists, or create if new
            await momentVectorService.indexMoment(moment, false);

            // Update the hash
            await updateMomentServer(momentData.userId, params.id, {
              lastIndexedContentHash: newHash
            });
            console.log(`[API] Reindexed moment ${params.id} (hash updated: ${newHash.substring(0, 8)})`);
          }
        }
      } catch (indexError) {
        console.error('[API] Error reindexing moment after update:', indexError);
        // Don't fail the update if indexing fails
      }
    } else {
      console.log(`[API] Skipping vector indexing for moment ${params.id} (indexForSearch=false)`);
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

    // Vector deletion disabled - Pinecone/OpenAI services removed
    // TODO: Re-enable with ChromaDB/Qwen deletion service

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting moment:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}