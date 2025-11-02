/**
 * API Route: Send Message Across Channels
 * POST /api/messages/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSender, getChannelConfig } from '@/lib/integrations';
import { notifyContact, RealtimeEvent } from '@/lib/realtime';
import { z } from 'zod';
import { Channel } from '@prisma/client';

const SendMessageSchema = z.object({
  contactId: z.string(),
  channel: z.nativeEnum(Channel),
  body: z.string().min(1),
  mediaUrls: z.array(z.string()).optional(),
  scheduledFor: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = SendMessageSchema.parse(body);

    // Get contact
    const contact = await prisma.contact.findUnique({
      where: { id: validatedData.contactId },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Get destination based on channel
    let destination: string | undefined;
    switch (validatedData.channel) {
      case 'SMS':
      case 'WHATSAPP':
        destination = contact.phoneNumber || undefined;
        break;
      case 'EMAIL':
        destination = contact.email || undefined;
        break;
      case 'TWITTER':
        destination = contact.twitterHandle || undefined;
        break;
      case 'FACEBOOK':
        destination = contact.facebookId || undefined;
        break;
    }

    if (!destination) {
      return NextResponse.json(
        { error: `Contact missing ${validatedData.channel} information` },
        { status: 400 }
      );
    }

    // If scheduled, create scheduled message
    if (validatedData.scheduledFor) {
      const scheduledMessage = await prisma.scheduledMessage.create({
        data: {
          contactId: validatedData.contactId,
          channel: validatedData.channel,
          body: validatedData.body,
          mediaUrls: validatedData.mediaUrls || [],
          scheduledFor: new Date(validatedData.scheduledFor),
          createdBy: session.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        messageId: scheduledMessage.id,
        scheduled: true,
      });
    }

    // Send immediately
    const config = getChannelConfig(validatedData.channel);
    const sender = createSender(validatedData.channel, config);

    const result = await sender.send({
      to: destination,
      body: validatedData.body,
      mediaUrls: validatedData.mediaUrls,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send message' },
        { status: 500 }
      );
    }

    // Save to database
    const message = await prisma.message.create({
      data: {
        channel: validatedData.channel,
        direction: 'OUTBOUND',
        body: validatedData.body,
        mediaUrls: validatedData.mediaUrls || [],
        externalId: result.externalId,
        status: 'sent',
        contactId: validatedData.contactId,
        userId: session.user.id,
        sentAt: new Date(),
      },
      include: {
        contact: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Trigger real-time event
    await notifyContact(validatedData.contactId, RealtimeEvent.MESSAGE_CREATED, {
      message,
      type: 'outbound',
    });

    return NextResponse.json({
      success: true,
      messageId: message.id,
      externalId: result.externalId,
    });
  } catch (error) {
    console.error('[Send Message] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

