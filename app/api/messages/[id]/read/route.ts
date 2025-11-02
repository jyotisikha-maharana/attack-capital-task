/**
 * API Route: Mark Message as Read
 * POST /api/messages/[id]/read
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyContact, RealtimeEvent } from '@/lib/realtime';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const message = await prisma.message.update({
      where: { id: params.id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
      include: {
        contact: true,
      },
    });

    // Trigger real-time event
    await notifyContact(message.contactId, RealtimeEvent.MESSAGE_READ, {
      messageId: message.id,
      contactId: message.contactId,
      readBy: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Mark Read] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

