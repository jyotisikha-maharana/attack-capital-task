'use client';

interface ChannelFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

const channels = ['SMS', 'WHATSAPP', 'EMAIL', 'TWITTER', 'FACEBOOK'];

export function ChannelFilter({ value, onChange }: ChannelFilterProps) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="text-sm border border-gray-300 rounded px-2 py-1"
    >
      <option value="">All Channels</option>
      {channels.map((channel) => (
        <option key={channel} value={channel}>
          {channel}
        </option>
      ))}
    </select>
  );
}

