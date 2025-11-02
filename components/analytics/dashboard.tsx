'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export function AnalyticsDashboard() {
  const [days, setDays] = useState(30);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', days],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Inbound"
          value={analytics?.metrics.totalInbound || 0}
        />
        <MetricCard
          title="Total Outbound"
          value={analytics?.metrics.totalOutbound || 0}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${analytics?.metrics.avgResponseTimeMinutes || 0}m`}
        />
        <MetricCard
          title="Response Rate"
          value={`${analytics?.metrics.responseRate || 0}%`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Messages by Channel */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Messages by Channel</h2>
          <div className="space-y-2">
            {analytics?.messagesByChannel?.map((item: any) => (
              <div key={item.channel} className="flex items-center justify-between">
                <span className="font-medium">{item.channel}</span>
                <span className="text-gray-600">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Messages by Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Outbound Status</h2>
          <div className="space-y-2">
            {analytics?.messagesByStatus?.map((item: any) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="font-medium capitalize">{item.status}</span>
                <span className="text-gray-600">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Volume */}
        <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
          <h2 className="text-xl font-bold mb-4">Daily Message Volume</h2>
          <div className="flex items-end gap-2 h-64">
            {analytics?.dailyVolume?.map((item: any, idx: number) => {
              const maxCount = Math.max(
                ...(analytics.dailyVolume.map((d: any) => d.count) || [1])
              );
              const height = (item.count / maxCount) * 100;
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center"
                  style={{ height: '100%' }}
                >
                  <div
                    className="bg-blue-600 w-full rounded-t"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(item.date).getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

