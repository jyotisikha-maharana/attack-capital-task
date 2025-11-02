/**
 * Pusher Authentication Endpoint
 * Authenticates private/presence channels
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { socket_id, channel_name } = body;

    // Authenticate private channels
    if (channel_name.startsWith('private-')) {
      const auth = pusherServer.authorizeChannel(socket_id, channel_name);
      return NextResponse.json(auth);
    }

    // Authenticate presence channels (for user presence)
    if (channel_name.startsWith('presence-')) {
      const presenceData = {
        user_id: session.user.id,
        user_info: {
          name: session.user.name || session.user.email,
          email: session.user.email,
        },
      };

      const auth = pusherServer.authorizeChannel(
        socket_id,
        channel_name,
        presenceData
      );

      return NextResponse.json(auth);
    }

    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
  } catch (error) {
    console.error('[Pusher Auth] Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

