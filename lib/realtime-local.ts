/**
 * Local Real-time Implementation
 * Uses Server-Sent Events (SSE) for localhost - no external services needed!
 * 
 * SSE is simpler than WebSockets and works perfectly for one-way server->client updates
 */

import { NextRequest } from 'next/server';

// In-memory store for SSE connections (in production, use Redis)
const sseConnections = new Map<string, Set<ReadableStreamDefaultController>>();

/**
 * Create an SSE endpoint for real-time updates
 */
export function createSSEEndpoint(channel: string) {
  return new ReadableStream({
    start(controller) {
      // Add connection to channel
      if (!sseConnections.has(channel)) {
        sseConnections.set(channel, new Set());
      }
      sseConnections.get(channel)!.add(controller);

      // Send initial connection message
      const data = JSON.stringify({ type: 'connected', channel });
      controller.enqueue(`data: ${data}\n\n`);

      // Handle client disconnect
      const cleanup = () => {
        const connections = sseConnections.get(channel);
        if (connections) {
          connections.delete(controller);
          if (connections.size === 0) {
            sseConnections.delete(channel);
          }
        }
      };

      // Cleanup on close
      controller.signal?.addEventListener('abort', cleanup);
    },
  });
}

/**
 * Broadcast message to all SSE connections on a channel
 */
export function broadcastSSE(channel: string, event: string, data: unknown) {
  const connections = sseConnections.get(channel);
  if (!connections || connections.size === 0) return;

  const message = JSON.stringify({ type: event, data });
  const sseData = `data: ${message}\n\n`;

  connections.forEach((controller) => {
    try {
      controller.enqueue(sseData);
    } catch (error) {
      // Connection closed, remove it
      connections.delete(controller);
    }
  });
}

/**
 * Notify contact channel (local SSE version)
 */
export async function notifyContactLocal(
  contactId: string,
  event: string,
  data: unknown
) {
  broadcastSSE(`contact-${contactId}`, event, data);
  
  // Also broadcast to user channels for personal updates
  if (data && typeof data === 'object' && 'userId' in data) {
    broadcastSSE(`user-${data.userId}`, event, data);
  }
  
  // Broadcast to all users subscribed to this contact (wildcard)
  broadcastSSE(`user-*`, event, { ...data, contactId });
}

