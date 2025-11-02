'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface SSEProviderProps {
  children: React.ReactNode;
  userId?: string;
  channels?: string[];
}

/**
 * Server-Sent Events Provider
 * Uses native browser EventSource API - no external dependencies!
 */
export function SSEProvider({ children, userId, channels = [] }: SSEProviderProps) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const eventSources: EventSource[] = [];

    // Default channels for user
    const defaultChannels = [`user-${userId}`, ...channels];

    defaultChannels.forEach((channel) => {
      try {
        const eventSource = new EventSource(`/api/realtime/${channel}`);

        eventSource.onopen = () => {
          setIsConnected(true);
          console.log(`[SSE] Connected to channel: ${channel}`);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Handle different event types
            switch (data.type) {
              case 'connected':
                console.log(`[SSE] Subscribed to ${data.channel}`);
                break;

              case 'message:created':
                console.log('[SSE] New message:', data.data);
                queryClient.invalidateQueries({ queryKey: ['contacts'] });
                queryClient.invalidateQueries({ queryKey: ['messages'] });
                queryClient.invalidateQueries({ queryKey: ['unread-count'] });
                break;

              case 'message:updated':
                console.log('[SSE] Message updated:', data.data);
                queryClient.invalidateQueries({ queryKey: ['messages'] });
                break;

              case 'message:read':
                console.log('[SSE] Message read:', data.data);
                queryClient.invalidateQueries({ queryKey: ['messages'] });
                queryClient.invalidateQueries({ queryKey: ['unread-count'] });
                break;

              default:
                console.log('[SSE] Event:', data);
            }
          } catch (error) {
            console.error('[SSE] Error parsing message:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error(`[SSE] Error on channel ${channel}:`, error);
          setIsConnected(false);
        };

        eventSources.push(eventSource);
      } catch (error) {
        console.error(`[SSE] Failed to connect to ${channel}:`, error);
      }
    });

    return () => {
      eventSources.forEach((es) => es.close());
      setIsConnected(false);
    };
  }, [userId, queryClient, channels.join(',')]);

  return <>{children}</>;
}

