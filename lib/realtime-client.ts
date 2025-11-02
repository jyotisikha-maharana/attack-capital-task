/**
 * Client-side Real-time Configuration
 */

import PusherClient from 'pusher-js';

// Client-side Pusher instance (only if Pusher is configured)
export const pusherClient = typeof window !== 'undefined' && 
                            process.env.NEXT_PUBLIC_PUSHER_KEY
  ? new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    })
  : null;

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

