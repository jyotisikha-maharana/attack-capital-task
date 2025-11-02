/**
 * API Route: Scheduled Messages
 * GET /api/scheduled-messages - Get scheduled messages
 * This should be called by a cron job to process scheduled messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSender, getChannelConfig } from '@/lib/integrations';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pending scheduled messages that are due
    const now = new Date();
    const scheduledMessages = await prisma.scheduledMessage.findMany({
      where: {
        status: 'pending',
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        contact: true,
      },
    });

    return NextResponse.json(scheduledMessages);
  } catch (error) {
    console.error('[Get Scheduled Messages] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process scheduled messages (should be called by cron)
 */
export async function processScheduledMessages() {
  const now = new Date();
  const scheduledMessages = await prisma.scheduledMessage.findMany({
    where: {
      status: 'pending',
      scheduledFor: {
        lte: now,
      },
    },
    include: {
      contact: true,
    },
  });

  for (const scheduled of scheduledMessages) {
    try {
      // Get destination
      let destination: string | undefined;
      switch (scheduled.channel) {
        case 'SMS':
        case 'WHATSAPP':
          destination = scheduled.contact.phoneNumber || undefined;
          break;
        case 'EMAIL':
          destination = scheduled.contact.email || undefined;
          break;
        case 'TWITTER':
          destination = scheduled.contact.twitterHandle || undefined;
          break;
        case 'FACEBOOK':
          destination = scheduled.contact.facebookId || undefined;
          break;
      }

      if (!destination) {
        await prisma.scheduledMessage.update({
          where: { id: scheduled.id },
          data: { status: 'failed' },
        });
        continue;
      }

      // Send message
      const config = getChannelConfig(scheduled.channel);
      const sender = createSender(scheduled.channel, config);
      const result = await sender.send({
        to: destination,
        body: scheduled.body,
        mediaUrls: scheduled.mediaUrls,
      });

      if (result.success) {
        // Create message record
        await prisma.message.create({
          data: {
            channel: scheduled.channel,
            direction: 'OUTBOUND',
            body: scheduled.body,
            mediaUrls: scheduled.mediaUrls,
            externalId: result.externalId,
            status: 'sent',
            contactId: scheduled.contactId,
            userId: scheduled.createdBy,
            sentAt: new Date(),
          },
        });

        // Update scheduled message
        await prisma.scheduledMessage.update({
          where: { id: scheduled.id },
          data: { status: 'sent' },
        });
      } else {
        await prisma.scheduledMessage.update({
          where: { id: scheduled.id },
          data: { status: 'failed' },
        });
      }
    } catch (error) {
      console.error(`[Process Scheduled] Error for ${scheduled.id}:`, error);
      await prisma.scheduledMessage.update({
        where: { id: scheduled.id },
        data: { status: 'failed' },
      });
    }
  }
}

