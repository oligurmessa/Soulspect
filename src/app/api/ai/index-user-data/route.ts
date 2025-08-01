import { NextRequest, NextResponse } from 'next/server';
import { enhancedAI } from '@/lib/enhancedAi';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

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