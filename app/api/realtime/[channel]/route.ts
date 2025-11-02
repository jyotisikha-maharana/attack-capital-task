/**
 * Server-Sent Events (SSE) Endpoint for Real-time Updates
 * Works entirely on localhost - no external services needed!
 * 
 * GET /api/realtime/[channel]
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createSSEEndpoint } from '@/lib/realtime-local';

export async function GET(
  request: NextRequest,
  { params }: { params: { channel: string } }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const channel = params.channel;

    // Create SSE stream
    const stream = createSSEEndpoint(channel);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering in nginx
      },
    });
  } catch (error) {
    console.error('[SSE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to establish SSE connection' },
      { status: 500 }
    );
  }
}

