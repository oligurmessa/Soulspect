import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebaseServerAuth';
import { checkUserDataServer } from '@/lib/dbHelpersServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    console.log('[TEST-AUTH] Request received with userId:', userId);

    // Test authentication
    const auth = await authenticateRequest(request, body);
    console.log('[TEST-AUTH] Authentication result:', auth);

    if (!auth) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        details: 'No valid authentication found'
      }, { status: 401 });
    }

    // Verify user can only access their own data
    if (auth.uid !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Authorization failed',
        details: `Token UID (${auth.uid}) does not match requested userId (${userId})`
      }, { status: 403 });
    }

    // Test database access
    let dataCheck;
    try {
      dataCheck = await checkUserDataServer(userId);
      console.log('[TEST-AUTH] Data check result:', dataCheck);
    } catch (dbError) {
      console.error('[TEST-AUTH] Database access error:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database access failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication and database access successful',
      auth: {
        uid: auth.uid,
        email: auth.email
      },
      dataCheck
    });

  } catch (error) {
    console.error('[TEST-AUTH] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('[TEST-AUTH] GET request received with userId:', userId);

    // Test authentication
    const auth = await authenticateRequest(request);
    console.log('[TEST-AUTH] Authentication result:', auth);

    if (!auth) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        details: 'No valid authentication found'
      }, { status: 401 });
    }

    // Verify user can only access their own data
    if (auth.uid !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Authorization failed',
        details: `Token UID (${auth.uid}) does not match requested userId (${userId})`
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: 'GET authentication successful',
      auth: {
        uid: auth.uid,
        email: auth.email
      }
    });

  } catch (error) {
    console.error('[TEST-AUTH] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}