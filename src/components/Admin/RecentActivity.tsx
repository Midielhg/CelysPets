import { useCallback, useEffect, useState } from 'react';
import { apiUrl, API_BASE_URL } from '../../config/api';

interface ActivityItem {
  id: number;
  updatedAt: string;
  client?: { name: string };
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days>1?'s':''} ago`;
}

export default function RecentActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    let mounted = true;
    try {
      setLoading(true);
      setError(null);
      const paths = [
        apiUrl('/appointments/recent'),
        ...(API_BASE_URL.startsWith('http://localhost:5002') ? [] : ['http://localhost:5002/api/appointments/recent'])
      ];
      let lastErr: any = null;
      for (const url of paths) {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
          const data = (await res.json()) as ActivityItem[];
          if (mounted) setItems(data);
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (lastErr) throw lastErr;
    } catch (e: any) {
      if (mounted) setError(e?.message || 'Failed to load activity');
    } finally {
      if (mounted) setLoading(false);
    }
    return () => { mounted = false };
  }, [API_BASE_URL, apiUrl]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-5 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : error ? (
          <div className="p-3 rounded bg-red-50 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchActivity} className="ml-3 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200">Retry</button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500">No recent activity.</div>
        ) : (
          <div className="space-y-4">
            {items.map((a) => (
              <div key={a.id} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">Appointment updated {a.client?.name ? `for ${a.client.name}` : ''}</p>
                  <p className="text-xs text-gray-500">{timeAgo(a.updatedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
