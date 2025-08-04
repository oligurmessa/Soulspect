// Client-side helper for making authenticated API requests
import { auth } from './firebase';

/**
 * Get the current user's ID token for API authentication
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('[AUTH] No authenticated user found');
      return null;
    }

    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error('[AUTH] Error getting ID token:', error);
    return null;
  }
}

/**
 * Make an authenticated API request
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    console.warn('[AUTH] Making API request without authentication token');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Helper for authenticated POST requests with JSON body
 */
export async function authenticatedPost(url: string, data: any): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Helper for authenticated GET requests
 */
export async function authenticatedGet(url: string): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Get current user ID (for backward compatibility)
 */
export function getCurrentUserId(): string | null {
  const user = auth.currentUser;
  return user ? user.uid : null;
}