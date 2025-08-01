import { NextRequest, NextResponse } from 'next/server';
import { vectorDb } from '@/lib/vectorDb';

export async function POST(request: NextRequest) {
  try {
    const { userId, query, options = {} } = await request.json();

    if (!userId || !query) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const results = await vectorDb.search(userId, query, options);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching vectors:', error);
    return NextResponse.json(
      { error: 'Failed to search vectors' },
      { status: 500 }
    );
  }
}