import { NextRequest, NextResponse } from 'next/server';
import { enhancedAI } from '@/lib/enhancedAi';
import { authenticateRequest } from '@/lib/firebaseServerAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, query, mode = 'normal', source = 'inline_insight' } = body;

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

    if (!userId || !query) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`[API] Enhanced response request - User: ${userId}, Source: ${source}, Mode: ${mode}, Stream: ${body.stream}`);

    if (body.stream) {
      const streamResponse = await enhancedAI.generateEnhancedResponseStream({
        userId,
        currentQuery: query,
        mode,
        source,
      });

      return new NextResponse(streamResponse, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const insight = await enhancedAI.generateEnhancedResponse({
      userId,
      currentQuery: query,
      mode,
      source,
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