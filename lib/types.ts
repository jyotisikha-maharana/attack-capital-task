/**
 * Type definitions for the unified inbox system
 */

export enum Channel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  VIEWER = 'VIEWER',
}

export interface TwilioWebhookPayload {
  MessageSid: string;
  AccountSid?: string;
  MessagingServiceSid?: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  MediaUrl0?: string;
  ProfileName?: string;
  WaId?: string;
  MessageStatus?: string;
}

export interface MessageMetadata {
  twilioMessageSid?: string;
  accountSid?: string;
  messagingServiceSid?: string;
  toNumber?: string;
  numMedia?: number;
  mediaUrl?: string;
  waId?: string;
  [key: string]: unknown;
}

