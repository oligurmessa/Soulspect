import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { verifyAuthToken } from '@/lib/firebaseServerAuth';

export async function DELETE(request: NextRequest) {
  console.log('[DELETE-ALL-DATA] API endpoint called');
  try {
    if (!adminDb || !adminAuth) {
      console.error('[DELETE-ALL-DATA] Firebase Admin not configured');
      return NextResponse.json(
        { success: false, error: 'Firebase Admin not configured' },
        { status: 500 }
      );
    }

    console.log('[DELETE-ALL-DATA] Firebase Admin available, attempting authentication');
    
    // Authenticate the request using the existing helper
    const authResult = await verifyAuthToken(request);
    if (!authResult) {
      console.error('[DELETE-ALL-DATA] Authentication failed');
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    const userId = authResult.uid;
    console.log(`[DELETE-ALL-DATA] Authenticated user: ${userId}`);

    console.log(`Starting data deletion for user: ${userId}`);

    // 1. Delete all moments from the top-level moments collection
    const momentsSnapshot = await adminDb
      .collection('moments')
      .where('userId', '==', userId)
      .get();
    
    const momentDeletions = momentsSnapshot.docs.map((doc: any) => doc.ref.delete());
    await Promise.all(momentDeletions);
    console.log(`Deleted ${momentsSnapshot.size} moments from top-level collection`);

    // 2. Delete all user subcollections
    const collections = [
      'journalEntries',
      'emotionLogs', 
      'soulspaceItems',
      'analytics',
      'values',
      'moments' // Also delete any moments in user subcollection (if any)
    ];

    for (const collectionName of collections) {
      const collectionRef = adminDb.collection('users').doc(userId).collection(collectionName);
      const snapshot = await collectionRef.get();
      
      if (!snapshot.empty) {
        const deletePromises = snapshot.docs.map((doc: any) => doc.ref.delete());
        await Promise.all(deletePromises);
        console.log(`Deleted ${snapshot.size} documents from ${collectionName}`);
      }
    }

    // 3. Delete vector embeddings (if any exist)
    try {
      // Try to clean up any vector data - but skip if the endpoint doesn't exist
      console.log('Skipping vector cleanup (endpoint not implemented)');
    } catch (error) {
      console.warn('Vector cleanup error (non-critical):', error);
    }

    // 4. Finally, delete the user document itself
    await adminDb.collection('users').doc(userId).delete();
    console.log('Deleted user document');

    // 5. Optionally delete the Firebase Auth user account
    // Uncomment the following lines if you want to also delete the auth account
    /*
    try {
      await adminAuth.deleteUser(userId);
      console.log('Deleted Firebase Auth user');
    } catch (error) {
      console.warn('Failed to delete Firebase Auth user:', error);
    }
    */

    console.log(`Data deletion completed successfully for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'All user data deleted successfully',
      deletedCollections: collections.length,
      deletedMoments: momentsSnapshot.size,
    });

  } catch (error: any) {
    console.error('[DELETE-ALL-DATA] Error deleting user data:', error);
    console.error('[DELETE-ALL-DATA] Error stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete user data',
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}