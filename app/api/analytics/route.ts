/**
 * API Route: Analytics Dashboard
 * GET /api/analytics
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

    // Get date range from query params (default: last 30 days)
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user's team contacts
    const teamMemberships = await prisma.teamMember.findMany({
      where: { userId: session.user.id },
      select: { teamId: true },
    });
    const teamIds = teamMemberships.map((tm) => tm.teamId);

    // Total messages by channel
    const messagesByChannel = await prisma.message.groupBy({
      by: ['channel'],
      where: {
        createdAt: { gte: startDate },
        contact: {
          OR: [
            { teamId: { in: teamIds } },
            { teamId: null },
          ],
        },
      },
      _count: true,
    });

    // Messages by direction
    const messagesByDirection = await prisma.message.groupBy({
      by: ['direction'],
      where: {
        createdAt: { gte: startDate },
        contact: {
          OR: [
            { teamId: { in: teamIds } },
            { teamId: null },
          ],
        },
      },
      _count: true,
    });

    // Response time (average time between inbound and outbound)
    const responseTimeData = await prisma.$queryRaw<Array<{ avg: number }>>`
      SELECT AVG(EXTRACT(EPOCH FROM (outbound.created_at - inbound.created_at))) as avg
      FROM messages outbound
      JOIN messages inbound ON outbound.contact_id = inbound.contact_id
      WHERE outbound.direction = 'OUTBOUND'
        AND inbound.direction = 'INBOUND'
        AND outbound.created_at > inbound.created_at
        AND outbound.created_at >= ${startDate}
        AND EXISTS (
          SELECT 1 FROM contacts
          WHERE contacts.id = outbound.contact_id
            AND (contacts.team_id = ANY(${teamIds}) OR contacts.team_id IS NULL)
        )
      LIMIT 1000
    `;

    const avgResponseTime = responseTimeData[0]?.avg
      ? Math.round(responseTimeData[0].avg / 60) // Convert to minutes
      : 0;

    // Messages by status
    const messagesByStatus = await prisma.message.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate },
        direction: 'OUTBOUND',
        contact: {
          OR: [
            { teamId: { in: teamIds } },
            { teamId: null },
          ],
        },
      },
      _count: true,
    });

    // Engagement metrics
    const totalInbound = await prisma.message.count({
      where: {
        direction: 'INBOUND',
        createdAt: { gte: startDate },
        contact: {
          OR: [
            { teamId: { in: teamIds } },
            { teamId: null },
          ],
        },
      },
    });

    const totalOutbound = await prisma.message.count({
      where: {
        direction: 'OUTBOUND',
        createdAt: { gte: startDate },
        contact: {
          OR: [
            { teamId: { in: teamIds } },
            { teamId: null },
          ],
        },
      },
    });

    const repliedMessages = await prisma.message.count({
      where: {
        direction: 'OUTBOUND',
        createdAt: { gte: startDate },
        contact: {
          OR: [
            { teamId: { in: teamIds } },
            { teamId: null },
          ],
          messages: {
            some: {
              direction: 'INBOUND',
              createdAt: { gte: startDate },
            },
          },
        },
      },
    });

    const responseRate =
      totalOutbound > 0 ? (repliedMessages / totalOutbound) * 100 : 0;

    // Daily message volume
    const dailyVolume = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM messages
      WHERE created_at >= ${startDate}
        AND EXISTS (
          SELECT 1 FROM contacts
          WHERE contacts.id = messages.contact_id
            AND (contacts.team_id = ANY(${teamIds}) OR contacts.team_id IS NULL)
        )
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return NextResponse.json({
      messagesByChannel: messagesByChannel.map((item) => ({
        channel: item.channel,
        count: item._count,
      })),
      messagesByDirection: messagesByDirection.map((item) => ({
        direction: item.direction,
        count: item._count,
      })),
      messagesByStatus: messagesByStatus.map((item) => ({
        status: item.status || 'unknown',
        count: item._count,
      })),
      metrics: {
        totalInbound,
        totalOutbound,
        avgResponseTimeMinutes: avgResponseTime,
        responseRate: Math.round(responseRate * 100) / 100,
        repliedMessages,
      },
      dailyVolume: dailyVolume.map((item) => ({
        date: item.date,
        count: Number(item.count),
      })),
    });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

