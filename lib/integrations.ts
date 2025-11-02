/**
 * Integration Factory Pattern
 * Centralized factory for creating channel-specific senders
 * Supports: SMS, WhatsApp, Email, Twitter, Facebook
 */

import { Channel } from '@prisma/client';
import twilio from 'twilio';

// Type definitions
export interface SendMessagePayload {
  to: string;
  body: string;
  mediaUrls?: string[];
  metadata?: Record<string, unknown>;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  externalId?: string;
  error?: string;
}

export interface IntegrationSender {
  send(payload: SendMessagePayload): Promise<SendMessageResult>;
  validate(payload: SendMessagePayload): boolean;
}

// Twilio SMS/WhatsApp Integration
class TwilioSmsSender implements IntegrationSender {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.client = twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
  }

  async send(payload: SendMessagePayload): Promise<SendMessageResult> {
    try {
      const message = await this.client.messages.create({
        body: payload.body,
        from: this.fromNumber,
        to: payload.to,
        ...(payload.mediaUrls && payload.mediaUrls.length > 0 && {
          mediaUrl: payload.mediaUrls,
        }),
      });

      return {
        success: true,
        messageId: message.sid,
        externalId: message.sid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  validate(payload: SendMessagePayload): boolean {
    return !!(payload.to && payload.body);
  }
}

// Twilio WhatsApp Integration
class TwilioWhatsAppSender implements IntegrationSender {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.client = twilio(accountSid, authToken);
    // WhatsApp format: whatsapp:+1234567890
    this.fromNumber = fromNumber.startsWith('whatsapp:')
      ? fromNumber
      : `whatsapp:${fromNumber}`;
  }

  async send(payload: SendMessagePayload): Promise<SendMessageResult> {
    try {
      const to = payload.to.startsWith('whatsapp:')
        ? payload.to
        : `whatsapp:${payload.to}`;

      const message = await this.client.messages.create({
        body: payload.body,
        from: this.fromNumber,
        to,
        ...(payload.mediaUrls && payload.mediaUrls.length > 0 && {
          mediaUrl: payload.mediaUrls,
        }),
      });

      return {
        success: true,
        messageId: message.sid,
        externalId: message.sid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  validate(payload: SendMessagePayload): boolean {
    return !!(payload.to && payload.body);
  }
}

// Email Integration (Resend)
class EmailSender implements IntegrationSender {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async send(payload: SendMessagePayload): Promise<SendMessageResult> {
    try {
      // Using Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: payload.to,
          subject: payload.metadata?.subject as string || 'Message',
          html: payload.body,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      return {
        success: true,
        messageId: data.id,
        externalId: data.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  validate(payload: SendMessagePayload): boolean {
    return !!(payload.to && payload.body && this.isValidEmail(payload.to));
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

// Twitter/X DM Integration (placeholder - requires OAuth)
class TwitterSender implements IntegrationSender {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async send(payload: SendMessagePayload): Promise<SendMessageResult> {
    try {
      // Twitter API v2 Direct Message endpoint
      const response = await fetch('https://api.twitter.com/2/dm_conversations/with/:participant_id/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: payload.body,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send Twitter DM');
      }

      return {
        success: true,
        messageId: data.event_id,
        externalId: data.event_id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  validate(payload: SendMessagePayload): boolean {
    return !!(payload.to && payload.body);
  }
}

// Facebook Messenger Integration (placeholder - requires webhook setup)
class FacebookSender implements IntegrationSender {
  private pageAccessToken: string;

  constructor(pageAccessToken: string) {
    this.pageAccessToken = pageAccessToken;
  }

  async send(payload: SendMessagePayload): Promise<SendMessageResult> {
    try {
      // Facebook Graph API Send Message endpoint
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${this.pageAccessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: { id: payload.to },
            message: { text: payload.body },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send Facebook message');
      }

      return {
        success: true,
        messageId: data.message_id,
        externalId: data.message_id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  validate(payload: SendMessagePayload): boolean {
    return !!(payload.to && payload.body);
  }
}

/**
 * Factory function to create a sender for a specific channel
 */
export function createSender(
  channel: Channel,
  config: Record<string, string>
): IntegrationSender {
  switch (channel) {
    case 'SMS':
      return new TwilioSmsSender(
        config.accountSid!,
        config.authToken!,
        config.fromNumber!
      );

    case 'WHATSAPP':
      return new TwilioWhatsAppSender(
        config.accountSid!,
        config.authToken!,
        config.fromNumber!
      );

    case 'EMAIL':
      return new EmailSender(
        config.apiKey!,
        config.fromEmail!
      );

    case 'TWITTER':
      return new TwitterSender(config.accessToken!);

    case 'FACEBOOK':
      return new FacebookSender(config.pageAccessToken!);

    default:
      throw new Error(`Unsupported channel: ${channel}`);
  }
}

/**
 * Get channel configuration from environment variables
 */
export function getChannelConfig(channel: Channel): Record<string, string> {
  switch (channel) {
    case 'SMS':
    case 'WHATSAPP':
      return {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        fromNumber: process.env.TWILIO_PHONE_NUMBER || '',
      };

    case 'EMAIL':
      return {
        apiKey: process.env.RESEND_API_KEY || '',
        fromEmail: process.env.FROM_EMAIL || 'noreply@example.com',
      };

    case 'TWITTER':
      return {
        accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
      };

    case 'FACEBOOK':
      return {
        pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '',
      };

    default:
      return {};
  }
}

