'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pusherClient, RealtimeEvent } from '@/lib/realtime-client';

interface PusherProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export function PusherProvider({ children, userId }: PusherProviderProps) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if Pusher keys are configured
    if (!pusherClient || !userId || !process.env.NEXT_PUBLIC_PUSHER_KEY) {
      console.log('[Pusher] Skipping connection - not configured');
      return;
    }

    pusherClient.connection.bind('connected', () => {
      setIsConnected(true);
      console.log('[Pusher] Connected');
    });

    pusherClient.connection.bind('disconnected', () => {
      setIsConnected(false);
      console.log('[Pusher] Disconnected');
    });

    pusherClient.connection.bind('error', (err: Error) => {
      console.error('[Pusher] Error:', err);
    });

    return () => {
      pusherClient.disconnect();
    };
  }, [userId]);

  // Subscribe to global message events
  useEffect(() => {
    if (!pusherClient || !userId || !isConnected) return;

    const channel = pusherClient.subscribe(`private-user-${userId}`);

    // Listen for new messages
    channel.bind(RealtimeEvent.MESSAGE_CREATED, (data: any) => {
      console.log('[Realtime] New message:', data);
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    });

    channel.bind(RealtimeEvent.MESSAGE_UPDATED, (data: any) => {
      console.log('[Realtime] Message updated:', data);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    });

    channel.bind(RealtimeEvent.MESSAGE_READ, (data: any) => {
      console.log('[Realtime] Message read:', data);
      queryClient.invalidateQueries({ queryKey: ['messages', data.contactId] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    });

    return () => {
      pusherClient.unsubscribe(`private-user-${userId}`);
    };
  }, [userId, isConnected, queryClient]);

  return <>{children}</>;
}

