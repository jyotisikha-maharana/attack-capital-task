'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { MessageHistory } from './message-history';
import { ContactNotes } from './contact-notes';
import { formatPhoneNumber, getChannelColor } from '@/lib/utils';

interface ContactProfileModalProps {
  contactId: string;
  onClose: () => void;
  onCompose: () => void;
}

export function ContactProfileModal({
  contactId,
  onClose,
  onCompose,
}: ContactProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'messages' | 'notes'>('messages');

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (!res.ok) throw new Error('Failed to fetch contact');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading contact...</div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Contact not found</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">{contact.name || 'Unknown Contact'}</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              {contact.phoneNumber && (
                <div>📞 {formatPhoneNumber(contact.phoneNumber)}</div>
              )}
              {contact.email && <div>✉️ {contact.email}</div>}
              {contact.twitterHandle && <div>🐦 @{contact.twitterHandle}</div>}
              {contact.facebookId && <div>👤 Facebook ID: {contact.facebookId}</div>}
            </div>
            {contact.tags && contact.tags.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {contact.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onCompose}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Send Message
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'messages'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'notes'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Notes
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'messages' ? (
          <MessageHistory contactId={contactId} />
        ) : (
          <ContactNotes contactId={contactId} />
        )}
      </div>
    </div>
  );
}

