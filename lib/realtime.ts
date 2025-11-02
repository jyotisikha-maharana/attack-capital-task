/**
 * Real-time Event Helpers
 * Functions to trigger real-time events when data changes
 * 
 * Supports both Pusher (external) and SSE (local) modes
 */

import { pusherServer } from './pusher';
import { notifyContactLocal } from './realtime-local';

export enum RealtimeEvent {
  // Message events
  MESSAGE_CREATED = 'message:created',
  MESSAGE_UPDATED = 'message:updated',
  MESSAGE_READ = 'message:read',
  
  // Contact events
  CONTACT_UPDATED = 'contact:updated',
  
  // Note events
  NOTE_CREATED = 'note:created',
  NOTE_UPDATED = 'note:updated',
  
  // Presence events
  USER_JOINED = 'user:joined',
  USER_LEFT = 'user:left',
  USER_TYPING = 'user:typing',
}

/**
 * Trigger a real-time event for a specific contact
 * Automatically chooses between Pusher (if configured) or SSE (local)
 */
export async function notifyContact(
  contactId: string,
  event: RealtimeEvent,
  data: unknown
) {
  try {
    // Try Pusher first (if configured)
    if (process.env.PUSHER_APP_ID) {
      await pusherServer.trigger(`private-contact-${contactId}`, event, data);
    } else {
      // Fallback to local SSE
      await notifyContactLocal(contactId, event, data);
    }
  } catch (error) {
    console.error(`[Realtime] Failed to notify contact ${contactId}:`, error);
    // Fallback to SSE if Pusher fails
    try {
      await notifyContactLocal(contactId, event, data);
    } catch (sseError) {
      console.error(`[Realtime] SSE fallback also failed:`, sseError);
    }
  }
}

/**
 * Trigger a real-time event for a team
 */
export async function notifyTeam(
  teamId: string,
  event: RealtimeEvent,
  data: unknown
) {
  try {
    await pusherServer.trigger(`private-team-${teamId}`, event, data);
  } catch (error) {
    console.error(`[Realtime] Failed to notify team ${teamId}:`, error);
  }
}

/**
 * Trigger a real-time event for all users viewing a contact
 */
export async function notifyContactViewers(
  contactId: string,
  event: RealtimeEvent,
  data: unknown
) {
  try {
    await pusherServer.trigger(`presence-contact-${contactId}`, event, data);
  } catch (error) {
    console.error(`[Realtime] Failed to notify contact viewers:`, error);
  }
}

