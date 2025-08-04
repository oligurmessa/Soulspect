import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from './firebaseAdmin';

// Re-export the admin instances from the consolidated firebaseAdmin module
export { adminAuth, adminDb };

/**
 * Extract and verify Firebase ID token from Authorization header
 */
export async function verifyAuthToken(request: NextRequest): Promise<{ uid: string; email?: string } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract user ID from request body or query params as fallback
 * This is a temporary solution until proper auth headers are implemented
 */
export function extractUserIdFromRequest(request: NextRequest, body?: any): string | null {
  // Try to get from request body first
  if (body?.userId) {
    return body.userId;
  }

  // Try to get from query params
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (userId) {
    return userId;
  }

  return null;
}

/**
 * Middleware function to authenticate API requests
 */
export async function authenticateRequest(request: NextRequest, body?: any): Promise<{ uid: string; email?: string } | null> {
  // First try proper token verification
  const authResult = await verifyAuthToken(request);
  if (authResult) {
    return authResult;
  }

  // Fallback to userId extraction (for debugging/testing)
  const userId = extractUserIdFromRequest(request, body);
  if (userId) {
    console.warn(`[FALLBACK AUTH] Using userId from request: ${userId}`);
    return { uid: userId };
  }

  return null;
}