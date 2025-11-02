'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ContactThread } from './contact-thread';
import { ContactProfileModal } from './contact-profile-modal';
import { MessageComposer } from './message-composer';
import { SearchBar } from './search-bar';
import { ChannelFilter } from './channel-filter';

interface UnifiedInboxProps {
  userId: string;
}

export function UnifiedInbox({ userId }: UnifiedInboxProps) {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch contacts with recent messages (threaded)
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', searchQuery, channelFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (channelFilter) params.append('channel', channelFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/contacts?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch contacts');
      return res.json();
    },
  });

  // Fetch unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/messages/unread-count');
      if (!res.ok) throw new Error('Failed to fetch unread count');
      return res.json();
    },
  });

  return (
    <div className="flex h-full">
      {/* Sidebar - Contact Threads */}
      <div className="w-96 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Inbox</h1>
            {unreadCount && unreadCount.count > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount.count}
              </span>
            )}
          </div>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <div className="mt-2 flex gap-2">
            <ChannelFilter value={channelFilter} onChange={setChannelFilter} />
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          <button
            onClick={() => setIsComposerOpen(true)}
            className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + New Message
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : contacts?.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No contacts found</div>
          ) : (
            contacts?.map((contact: any) => (
              <ContactThread
                key={contact.id}
                contact={contact}
                isSelected={selectedContactId === contact.id}
                onClick={() => setSelectedContactId(contact.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {selectedContactId ? (
          <ContactProfileModal
            contactId={selectedContactId}
            onClose={() => setSelectedContactId(null)}
            onCompose={() => setIsComposerOpen(true)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a contact to view messages
          </div>
        )}
      </div>

      {/* Message Composer Modal */}
      {isComposerOpen && (
        <MessageComposer
          contactId={selectedContactId || undefined}
          onClose={() => setIsComposerOpen(false)}
          onSent={() => {
            setIsComposerOpen(false);
            // Refetch contacts to update the list
          }}
        />
      )}
    </div>
  );
}

