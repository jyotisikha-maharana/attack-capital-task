'use client';

import { useEffect, useState } from 'react';
import { pusherClient } from '@/lib/realtime-client';

interface PresenceIndicatorProps {
  contactId: string;
}

interface PresenceUser {
  id: string;
  info: {
    name?: string;
    email: string;
  };
}

export function PresenceIndicator({ contactId }: PresenceIndicatorProps) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!pusherClient) return;

    const channel = pusherClient.subscribe(`presence-contact-${contactId}`);

    channel.bind('pusher:subscription_succeeded', (members: any) => {
      const memberList = Object.values(members.members).map((member: any) => ({
        id: member.user_id,
        info: member.user_info,
      })) as PresenceUser[];
      setUsers(memberList);
    });

    channel.bind('pusher:member_added', (member: any) => {
      setUsers((prev) => [
        ...prev,
        {
          id: member.user_id,
          info: member.user_info,
        },
      ]);
    });

    channel.bind('pusher:member_removed', (member: any) => {
      setUsers((prev) => prev.filter((u) => u.id !== member.user_id));
    });

    return () => {
      pusherClient.unsubscribe(`presence-contact-${contactId}`);
    };
  }, [contactId]);

  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <div className="flex -space-x-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border-2 border-white"
            title={user.info.name || user.info.email}
          >
            {(user.info.name || user.info.email || 'U')[0].toUpperCase()}
          </div>
        ))}
      </div>
      <span>
        {users.length} {users.length === 1 ? 'person' : 'people'} viewing
      </span>
    </div>
  );
}

