/**
 * API Route: Get Contacts (threaded with last message)
 * GET /api/contacts
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

    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('q') || '';
    const channelFilter = searchParams.get('channel');
    const statusFilter = searchParams.get('status');

    // Get user's team memberships
    const teamMemberships = await prisma.teamMember.findMany({
      where: { userId: session.user.id },
      select: { teamId: true },
    });
    const teamIds = teamMemberships.map((tm) => tm.teamId);

    // Build where clause
    const where: any = {
      OR: [
        { teamId: { in: teamIds } },
        { teamId: null }, // Also include contacts without a team
      ],
    };

    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { phoneNumber: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Get contacts with last message
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          ...(channelFilter && {
            where: { channel: channelFilter as any },
          }),
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                direction: 'INBOUND',
                ...(channelFilter && { channel: channelFilter as any }),
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Format response
    const formattedContacts = contacts.map((contact) => {
      const lastMessage = contact.messages[0];
      const unreadCount = contact._count.messages;

      return {
        id: contact.id,
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        email: contact.email,
        twitterHandle: contact.twitterHandle,
        facebookId: contact.facebookId,
        tags: contact.tags,
        lastMessage: lastMessage
          ? {
              body: lastMessage.body,
              channel: lastMessage.channel,
              createdAt: lastMessage.createdAt,
              isRead: lastMessage.isRead,
            }
          : undefined,
        unreadCount,
      };
    });

    // Filter by status if specified
    let filteredContacts = formattedContacts;
    if (statusFilter === 'unread') {
      filteredContacts = formattedContacts.filter((c) => c.unreadCount && c.unreadCount > 0);
    } else if (statusFilter === 'read') {
      filteredContacts = formattedContacts.filter(
        (c) => !c.unreadCount || c.unreadCount === 0
      );
    }

    return NextResponse.json(filteredContacts);
  } catch (error) {
    console.error('[Get Contacts] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

