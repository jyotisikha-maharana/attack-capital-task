/**
 * API Route: Get Unread Message Count
 * GET /api/messages/unread-count
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team contacts
    const teamMemberships = await prisma.teamMember.findMany({
      where: { userId: session.user.id },
      select: { teamId: true },
    });
    const teamIds = teamMemberships.map((tm) => tm.teamId);

    const count = await prisma.message.count({
      where: {
        isRead: false,
        direction: 'INBOUND',
        contact: {
          OR: [
            { teamId: { in: teamIds } },
            { teamId: null },
          ],
        },
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('[Unread Count] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

