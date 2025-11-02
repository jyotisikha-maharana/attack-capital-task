'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { SSEProvider } from '@/components/realtime/sse-provider';
import { PusherProvider } from '@/components/realtime/pusher-provider';

interface ProvidersProps {
  children: React.ReactNode;
  userId?: string;
}

export function Providers({ children, userId }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Use Pusher if configured AND installed, otherwise use SSE (local)
  const usePusher = !!(
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_PUSHER_KEY &&
    process.env.NEXT_PUBLIC_PUSHER_KEY !== ''
  );

  return (
    <QueryClientProvider client={queryClient}>
      {usePusher ? (
        <PusherProvider userId={userId}>
          {children}
        </PusherProvider>
      ) : (
        <SSEProvider userId={userId}>
          {children}
        </SSEProvider>
      )}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

