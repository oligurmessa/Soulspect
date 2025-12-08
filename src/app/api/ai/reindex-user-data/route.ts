import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebaseServerAuth';
import { momentVectorService } from '@/lib/momentVectorService';
import { getMomentsServer } from '@/lib/data/server/moments';
import { chromaService } from '@/lib/chromaService';
import { normalizeTimestampToMs } from '@/lib/timestampUtils';
import { IndexUserDataSchema } from '@/lib/validation/schemas';

// Reindex all user moments into ChromaDB+Qwen with full consistency checks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod - use auth.uid for userId
    const auth = await authenticateRequest(request, body);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized - missing or invalid authentication' },
        { status: 401 }
      );
    }

    const validatedData = IndexUserDataSchema.parse({ userId: auth.uid, ...body });
    const { force = false } = validatedData;

    const userId = auth.uid;
    console.log(`[REINDEX] Starting full reindex for user: ${userId}`);

    // STEP 1: Get all moments from Firestore
    const allMoments = await getMomentsServer(userId, { limit: 1000 }); // Get up to 1000 moments
    console.log(`[REINDEX] Found ${allMoments.length} total moments in Firestore`);

    // Filter moments that have content to index
    const indexableMoments = allMoments.filter(moment =>
      moment.content && moment.content.trim().length > 0
    );

    console.log(`[REINDEX] ${indexableMoments.length} moments have content to index`);

    if (indexableMoments.length === 0) {
      // Still perform consistency check even with no indexable moments
      const vectorCount = await chromaService.getUserVectorCount(userId);

      return NextResponse.json({
        success: true,
        userId,
        message: 'No moments with content found to reindex',
        momentsInFirestore: allMoments.length,
        vectorsInChroma: vectorCount.count,
        dimensions: 4096,
        embeddingModel: 'Qwen/Qwen3-Embedding-8B',
        issues: vectorCount.count > 0 ? ['Vectors exist but no indexable moments found - may need cleanup'] : []
      });
    }

    // STEP 2: Clear old vectors before reindexing
    console.log(`[REINDEX] Clearing existing vectors for user: ${userId}`);
    const clearResult = await chromaService.clearUserVectors(userId);
    console.log(`[REINDEX] Cleared ${clearResult.deletedCount} existing vectors`);

    // STEP 3: Batch reindex all moments using ChromaDB+Qwen
    console.log(`[REINDEX] Starting batch indexing of ${indexableMoments.length} moments`);
    const result = await momentVectorService.batchIndexMoments(userId, indexableMoments);

    console.log(`[REINDEX] Indexing completed: ${result.successful} successful, ${result.failed} failed`);

    // STEP 4: Consistency checks after reindex
    console.log(`[REINDEX] Performing consistency checks...`);

    const finalVectorCount = await chromaService.getUserVectorCount(userId);
    const issues: string[] = [];

    // Check if counts match (accounting for indexing failures)
    const expectedVectorCount = result.successful;
    if (finalVectorCount.count !== expectedVectorCount) {
      issues.push(`Vector count mismatch: expected ${expectedVectorCount}, found ${finalVectorCount.count}`);
    }

    // Check vector metadata consistency
    let dimensionMismatches = 0;
    let modelMismatches = 0;
    let missingRequiredFields = 0;

    for (const vector of finalVectorCount.vectors) {
      const metadata = vector.metadata;

      // Check dimensions
      if (metadata.dimensions !== 4096) {
        dimensionMismatches++;
      }

      // Check model
      if (metadata.embeddingModel !== 'Qwen/Qwen3-Embedding-8B') {
        modelMismatches++;
      }

      // Check required fields
      const requiredFields = ['userId', 'momentId', 'type', 'timestamp', 'preview', 'embeddingModel', 'dimensions'];
      const missingFields = requiredFields.filter(field => !(field in metadata));
      if (missingFields.length > 0) {
        missingRequiredFields++;
        issues.push(`Vector ${vector.id} missing fields: ${missingFields.join(', ')}`);
      }
    }

    if (dimensionMismatches > 0) {
      issues.push(`${dimensionMismatches} vectors have incorrect dimensions (not 4096)`);
    }

    if (modelMismatches > 0) {
      issues.push(`${modelMismatches} vectors have incorrect embedding model`);
    }

    // Log summary
    const summary = {
      userId,
      momentsInFirestore: allMoments.length,
      indexableMoments: indexableMoments.length,
      vectorsCleared: clearResult.deletedCount,
      vectorsIndexed: result.successful,
      indexingFailed: result.failed,
      vectorsInChroma: finalVectorCount.count,
      dimensions: 4096,
      embeddingModel: 'Qwen/Qwen3-Embedding-8B',
      status: issues.length === 0 ? 'ok' : 'mismatch'
    };

    console.log('[REINDEX] Final summary:', JSON.stringify(summary, null, 2));

    return NextResponse.json({
      success: true,
      userId,
      momentsInFirestore: allMoments.length,
      vectorsInChroma: finalVectorCount.count,
      dimensions: 4096,
      embeddingModel: 'Qwen/Qwen3-Embedding-8B',
      issues,
      details: {
        indexableMoments: indexableMoments.length,
        vectorsCleared: clearResult.deletedCount,
        indexingSuccessful: result.successful,
        indexingFailed: result.failed,
        indexingErrors: result.errors.length > 0 ? result.errors.slice(0, 5) : []
      }
    });

  } catch (error) {
    console.error('[REINDEX] Error during reindexing:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Reindexing failed',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}

// Get reindexing status/stats with detailed consistency checks
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized - missing or invalid authentication' },
        { status: 401 }
      );
    }

    const userId = auth.uid;

    // Get counts of moments vs vector metadata
    const allMoments = await getMomentsServer(userId, { limit: 1000 });
    const indexableMoments = allMoments.filter(moment =>
      moment.content && moment.content.trim().length > 0
    );

    // Get user-specific vector count and metadata
    const userVectorData = await chromaService.getUserVectorCount(userId);

    // Get overall collection stats
    const collectionStats = await chromaService.getCollectionStats();

    // Analyze user's vector metadata for consistency
    const issues: string[] = [];
    let dimensionMismatches = 0;
    let modelMismatches = 0;

    for (const vector of userVectorData.vectors) {
      const metadata = vector.metadata;

      if (metadata.dimensions !== 4096) {
        dimensionMismatches++;
      }

      if (metadata.embeddingModel !== 'Qwen/Qwen3-Embedding-8B') {
        modelMismatches++;
      }
    }

    if (dimensionMismatches > 0) {
      issues.push(`${dimensionMismatches} vectors have incorrect dimensions`);
    }

    if (modelMismatches > 0) {
      issues.push(`${modelMismatches} vectors have incorrect embedding model`);
    }

    const countMismatch = userVectorData.count !== indexableMoments.length;
    if (countMismatch) {
      issues.push(`Count mismatch: ${indexableMoments.length} indexable moments vs ${userVectorData.count} vectors`);
    }

    return NextResponse.json({
      success: true,
      userId,
      stats: {
        momentsInFirestore: allMoments.length,
        indexableMoments: indexableMoments.length,
        userVectorsInChroma: userVectorData.count,
        totalVectorsInCollection: collectionStats.count,
        embeddingModel: collectionStats.model,
        vectorDimensions: collectionStats.dimensions,
        consistencyStatus: issues.length === 0 ? 'consistent' : 'inconsistent'
      },
      consistency: {
        issues,
        needsReindexing: countMismatch || issues.length > 0,
        missingVectors: Math.max(0, indexableMoments.length - userVectorData.count),
        extraVectors: Math.max(0, userVectorData.count - indexableMoments.length)
      }
    });

  } catch (error) {
    console.error('[REINDEX] Error getting status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get reindex status'
      },
      { status: 500 }
    );
  }
}