import { NextRequest, NextResponse } from 'next/server';
import { vectorDb } from '@/lib/vectorDb';

export async function POST(request: NextRequest) {
  try {
    const { userId, itemId, data, dataType } = await request.json();

    if (!userId || !itemId || !data || !dataType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await vectorDb.indexItem(userId, itemId, data, dataType);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error indexing item:', error);
    return NextResponse.json(
      { error: 'Failed to index item' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, items } = await request.json();

    if (!userId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await vectorDb.batchIndex(userId, items);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error batch indexing:', error);
    return NextResponse.json(
      { error: 'Failed to batch index' },
      { status: 500 }
    );
  }
}