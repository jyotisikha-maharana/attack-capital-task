'use client';

import { useQuery } from '@tanstack/react-query';
import { formatRelativeTime, getChannelColor } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface MessageHistoryProps {
  contactId: string;
}

export function MessageHistory({ contactId }: MessageHistoryProps) {
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', contactId],
    queryFn: async () => {
      const res = await fetch(`/api/messages?contactId=${contactId}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', contactId] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading messages...</div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {messages.map((message: any) => (
        <div
          key={message.id}
          className={`p-4 rounded-lg ${
            message.direction === 'OUTBOUND'
              ? 'bg-blue-50 ml-auto max-w-[80%]'
              : 'bg-gray-50 mr-auto max-w-[80%]'
          }`}
          onMouseEnter={() => {
            if (!message.isRead && message.direction === 'INBOUND') {
              markAsReadMutation.mutate(message.id);
            }
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs px-2 py-0.5 rounded ${getChannelColor(message.channel)}`}
            >
              {message.channel}
            </span>
            <span className="text-xs text-gray-500">
              {formatRelativeTime(new Date(message.createdAt))}
            </span>
            {message.status && (
              <span className="text-xs text-gray-400">{message.status}</span>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap">{message.body}</p>
          {message.mediaUrls && message.mediaUrls.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {message.mediaUrls.map((url: string, idx: number) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Attachment ${idx + 1}`}
                  className="rounded max-w-full h-auto"
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

