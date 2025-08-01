import { NextRequest, NextResponse } from 'next/server';
import { enhancedAI } from '@/lib/enhancedAi';

export async function POST(request: NextRequest) {
  try {
    const { userId, query, mode = 'normal' } = await request.json();

    if (!userId || !query) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const insight = await enhancedAI.generateEnhancedResponse({
      userId,
      currentQuery: query,
      mode,
    });

    return NextResponse.json(insight);
  } catch (error) {
    console.error('Error generating enhanced response:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}