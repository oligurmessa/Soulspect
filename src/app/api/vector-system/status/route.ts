import { NextRequest, NextResponse } from 'next/server';
import ServerVectorService from '@/lib/serverVectorService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const status = await ServerVectorService.getSystemStatus(userId || undefined);
    
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Error getting vector system status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        status: {
          available: false,
          provider: 'none',
          indexed: 0,
          health: 'unavailable',
          errors: ['System error']
        }
      }, 
      { status: 500 }
    );
  }
}