/**
 * Custom WebSocket Server (Local Development)
 * Alternative to Pusher - runs entirely on localhost
 * 
 * Note: This requires a separate WebSocket server process
 * For Next.js, consider using Server-Sent Events or upgrading to a custom server
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface WebSocketMessage {
  type: string;
  channel: string;
  data: unknown;
}

class LocalWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<WebSocket>> = new Map();

  start(server: Server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('[WebSocket] New connection');

      ws.on('message', (message: string) => {
        try {
          const msg: WebSocketMessage = JSON.parse(message.toString());

          if (msg.type === 'subscribe') {
            this.subscribe(ws, msg.channel);
          } else if (msg.type === 'unsubscribe') {
            this.unsubscribe(ws, msg.channel);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
    });

    console.log('[WebSocket] Server started');
  }

  private subscribe(ws: WebSocket, channel: string) {
    if (!this.clients.has(channel)) {
      this.clients.set(channel, new Set());
    }
    this.clients.get(channel)!.add(ws);
    console.log(`[WebSocket] Client subscribed to ${channel}`);
  }

  private unsubscribe(ws: WebSocket, channel: string) {
    const clients = this.clients.get(channel);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        this.clients.delete(channel);
      }
    }
  }

  private handleDisconnect(ws: WebSocket) {
    for (const [channel, clients] of this.clients.entries()) {
      clients.delete(ws);
      if (clients.size === 0) {
        this.clients.delete(channel);
      }
    }
    console.log('[WebSocket] Client disconnected');
  }

  broadcast(channel: string, event: string, data: unknown) {
    const clients = this.clients.get(channel);
    if (!clients || clients.size === 0) return;

    const message = JSON.stringify({ event, data });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}

export const wsServer = new LocalWebSocketServer();

