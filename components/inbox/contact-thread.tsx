'use client';

import { formatRelativeTime, getChannelColor } from '@/lib/utils';
import { formatPhoneNumber } from '@/lib/utils';

interface ContactThreadProps {
  contact: {
    id: string;
    name: string | null;
    phoneNumber: string | null;
    email: string | null;
    lastMessage?: {
      body: string;
      channel: string;
      createdAt: string;
      isRead: boolean;
    };
    unreadCount?: number;
  };
  isSelected: boolean;
  onClick: () => void;
}

export function ContactThread({ contact, isSelected, onClick }: ContactThreadProps) {
  const displayName = contact.name || contact.phoneNumber || contact.email || 'Unknown';
  const lastMessage = contact.lastMessage;

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
      } ${contact.unreadCount && contact.unreadCount > 0 ? 'font-semibold' : ''}`}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{displayName}</h3>
            {contact.unreadCount && contact.unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {contact.unreadCount}
              </span>
            )}
          </div>
          {contact.phoneNumber && (
            <p className="text-sm text-gray-500">{formatPhoneNumber(contact.phoneNumber)}</p>
          )}
        </div>
        {lastMessage && (
          <span className="text-xs text-gray-400 ml-2">
            {formatRelativeTime(new Date(lastMessage.createdAt))}
          </span>
        )}
      </div>

      {lastMessage && (
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded ${getChannelColor(lastMessage.channel)}`}
          >
            {lastMessage.channel}
          </span>
          <p className={`text-sm text-gray-600 truncate flex-1 ${!lastMessage.isRead ? 'font-semibold' : ''}`}>
            {lastMessage.body}
          </p>
        </div>
      )}
    </div>
  );
}

