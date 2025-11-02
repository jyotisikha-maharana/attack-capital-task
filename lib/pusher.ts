/**
 * Pusher Client Configuration
 * Real-time messaging and collaboration
 * Only used if Pusher is configured
 */

import PusherServer from 'pusher';

// Server-side Pusher instance (only if configured)
export const pusherServer = process.env.PUSHER_APP_ID
  ? new PusherServer({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
      secret: process.env.PUSHER_SECRET || '',
      cluster: process.env.PUSHER_CLUSTER || 'us2',
      useTLS: true,
    })
  : null;

