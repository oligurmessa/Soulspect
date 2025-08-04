import { NextRequest, NextResponse } from 'next/server';
import { 
  createVectorMetadata, 
  getVectorMetadata, 
  updateVectorMetadata,
  VectorMetadata 
} from '@/lib/moments';
import { Timestamp } from 'firebase/firestore';

// Get vector metadata for a moment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const momentId = searchParams.get('momentId');

    if (!userId || !momentId) {
      return NextResponse.json(
        { success: false, error: 'userId and momentId are required' },
        { status: 400 }
      );
    }

    const metadata = await getVectorMetadata(userId, momentId);
    
    return NextResponse.json({
      success: true,
      metadata,
    });
  } catch (error) {
    console.error('Error getting vector metadata:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Create or update vector metadata
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      momentId,
      vectorId,
      indexed,
      dimensions,
      model,
      contentPreview,
      searchableText,
      momentType,
      emotionContext,
      timeContext,
    } = body;

    if (!userId || !momentId || !vectorId) {
      return NextResponse.json(
        { success: false, error: 'userId, momentId, and vectorId are required' },
        { status: 400 }
      );
    }

    // Check if metadata already exists
    const existingMetadata = await getVectorMetadata(userId, momentId);
    
    let metadataId: string;
    
    if (existingMetadata) {
      // Update existing metadata
      await updateVectorMetadata(userId, existingMetadata.id!, {
        vectorId,
        indexed,
        indexedAt: indexed ? Timestamp.now() : undefined,
        contentPreview,
        searchableText,
        emotionContext,
        timeContext,
      });
      metadataId = existingMetadata.id!;
    } else {
      // Create new metadata
      metadataId = await createVectorMetadata({
        userId,
        momentId,
        vectorId,
        indexed,
        indexedAt: indexed ? Timestamp.now() : undefined,
        dimensions: dimensions || 3072,
        model: model || 'text-embedding-3-large',
        contentPreview,
        searchableText,
        momentType,
        emotionContext,
        timeContext,
      });
    }

    return NextResponse.json({
      success: true,
      metadataId,
      operation: existingMetadata ? 'updated' : 'created',
    });
  } catch (error) {
    console.error('Error creating/updating vector metadata:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}