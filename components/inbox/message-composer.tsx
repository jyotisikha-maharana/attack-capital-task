'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Channel } from '@prisma/client';

interface MessageComposerProps {
  contactId?: string;
  onClose: () => void;
  onSent: () => void;
}

export function MessageComposer({ contactId, onClose, onSent }: MessageComposerProps) {
  const [selectedChannel, setSelectedChannel] = useState<Channel>('SMS');
  const [body, setBody] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [scheduledFor, setScheduledFor] = useState('');
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send message');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      onSent();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      alert('Please enter a message');
      return;
    }
    
    if (!contactId) {
      alert('Please select a contact first');
      return;
    }

    sendMutation.mutate({
      contactId,
      channel: selectedChannel,
      body,
      mediaUrls: mediaUrls.filter(Boolean),
      ...(scheduledFor && { scheduledFor: new Date(scheduledFor).toISOString() }),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Compose Message</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Channel Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Channel</label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value as Channel)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
              <option value="TWITTER">Twitter</option>
              <option value="FACEBOOK">Facebook</option>
            </select>
          </div>

          {/* Message Body */}
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Type your message..."
              required
            />
          </div>

          {/* Schedule (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Schedule (optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {/* Error Message */}
          {sendMutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {sendMutation.error instanceof Error
                ? sendMutation.error.message
                : 'Failed to send message'}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sendMutation.isPending || !body.trim() || !contactId}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {sendMutation.isPending
                ? 'Sending...'
                : scheduledFor
                ? 'Schedule'
                : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

