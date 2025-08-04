import { NextRequest, NextResponse } from 'next/server';
import { enhancedAI } from '@/lib/enhancedAi';
import { authenticateRequest } from '@/lib/firebaseServerAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    // Authenticate the request
    const auth = await authenticateRequest(request, body);
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
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    console.log(`[API] Indexing user data for authenticated user: ${userId}`);
    await enhancedAI.indexUserData(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error indexing user data:', error);
    return NextResponse.json(
      { error: 'Failed to index user data' },
      { status: 500 }
    );
  }
}