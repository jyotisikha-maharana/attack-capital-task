import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhoneNumber, determineChannel } from '@/lib/utils/phone';
import { notifyContact, RealtimeEvent } from '@/lib/realtime';
import { z } from 'zod';

// Twilio webhook payload validation schema
const TwilioWebhookSchema = z.object({
  MessageSid: z.string(),
  AccountSid: z.string().optional(),
  MessagingServiceSid: z.string().optional(),
  From: z.string(), // Phone number in E.164 format
  To: z.string(), // Your Twilio number
  Body: z.string(),
  NumMedia: z.string().optional(),
  MediaUrl0: z.string().optional(),
  // WhatsApp specific fields
  ProfileName: z.string().optional(),
  WaId: z.string().optional(),
  // Status callbacks
  MessageStatus: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse form data (Twilio sends webhooks as application/x-www-form-urlencoded)
    const formData = await request.formData();
    const payload: Record<string, string> = {};
    
    // Convert FormData to plain object
    for (const [key, value] of formData.entries()) {
      payload[key] = typeof value === 'string' ? value : value.name || '';
    }

    // Validate payload
    const validatedData = TwilioWebhookSchema.parse(payload);

    // Normalize phone numbers
    const fromNumber = normalizePhoneNumber(validatedData.From);
    const toNumber = normalizePhoneNumber(validatedData.To);

    // Determine channel (SMS or WhatsApp)
    const channel = determineChannel(validatedData.From, validatedData.To);

    // Find or create contact
    let contact = await prisma.contact.findUnique({
      where: { phoneNumber: fromNumber },
    });

    if (!contact) {
      // Extract name from WhatsApp profile or use phone number
      const contactName = validatedData.ProfileName || 
                         validatedData.WaId || 
                         fromNumber;

      contact = await prisma.contact.create({
        data: {
          phoneNumber: fromNumber,
          name: contactName,
        },
      });
    } else if (validatedData.ProfileName && contact.name !== validatedData.ProfileName) {
      // Update contact name if WhatsApp profile name is different
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: { name: validatedData.ProfileName },
      });
    }

    // Handle status callbacks (updates to existing messages)
    if (validatedData.MessageStatus) {
      const existingMessage = await prisma.message.findUnique({
        where: { externalId: validatedData.MessageSid },
      });

      if (existingMessage) {
        // Update message status and create event
        await prisma.message.update({
          where: { id: existingMessage.id },
          data: {
            status: validatedData.MessageStatus,
          },
        });

        // Create message event for tracking
        await prisma.messageEvent.create({
          data: {
            messageId: existingMessage.id,
            eventType: validatedData.MessageStatus,
            metadata: {
              timestamp: new Date().toISOString(),
              twilioMessageSid: validatedData.MessageSid,
            },
          },
        });

        return new NextResponse('', { status: 200 });
      }
    }

    // Prepare message metadata
    const metadata: Record<string, unknown> = {
      twilioMessageSid: validatedData.MessageSid,
      accountSid: validatedData.AccountSid,
      messagingServiceSid: validatedData.MessagingServiceSid,
      toNumber,
      numMedia: validatedData.NumMedia ? parseInt(validatedData.NumMedia, 10) : 0,
    };

    // Collect all media URLs
    const mediaUrls: string[] = [];
    if (validatedData.MediaUrl0) {
      mediaUrls.push(validatedData.MediaUrl0);
    }
    // Add more media URLs if present (MediaUrl1, MediaUrl2, etc.)
    for (let i = 1; i < 10; i++) {
      const mediaUrl = payload[`MediaUrl${i}`] as string | undefined;
      if (mediaUrl) {
        mediaUrls.push(mediaUrl);
      }
    }

    if (validatedData.WaId) {
      metadata.waId = validatedData.WaId;
    }

    // Create message record
    const message = await prisma.message.create({
      data: {
        channel,
        direction: 'INBOUND',
        body: validatedData.Body || '',
        externalId: validatedData.MessageSid,
        status: validatedData.MessageStatus || 'received',
        contactId: contact.id,
        mediaUrls,
        metadata,
      },
      include: {
        contact: true,
      },
    });

    // Create initial message event
    await prisma.messageEvent.create({
      data: {
        messageId: message.id,
        eventType: 'received',
        metadata: {
          timestamp: new Date().toISOString(),
          twilioMessageSid: validatedData.MessageSid,
        },
      },
    });

    // Trigger real-time event for new inbound message
    await notifyContact(contact.id, RealtimeEvent.MESSAGE_CREATED, {
      message: {
        ...message,
        contact: contact,
      },
      type: 'inbound',
    });

    // Log success (in production, you might want to use a proper logger)
    console.log(`[Twilio Webhook] Created message ${message.id} from ${fromNumber}`);

    // Return TwiML response (Twilio expects XML)
    // For status callbacks, return empty response
    if (validatedData.MessageStatus) {
      return new NextResponse('', { status: 200 });
    }

    // For incoming messages, return TwiML if you want to auto-respond
    // Otherwise, return empty response
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <!-- Optional: Add auto-reply or action here -->
</Response>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    );
  } catch (error) {
    console.error('[Twilio Webhook] Error processing webhook:', error);

    // If it's a Zod validation error, return 400
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid webhook payload', details: error.errors },
        { status: 400 }
      );
    }

    // For other errors, return 500
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification or testing)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Twilio webhook endpoint is active',
    method: 'POST',
  });
}

