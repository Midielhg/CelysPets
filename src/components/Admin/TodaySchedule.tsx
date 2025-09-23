import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardService } from '../../services/dashboardService';

interface ClientInfo { 
  name: string; 
  email: string;
  phone: string;
}

interface AppointmentItem {
  id: number;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  total_amount: number | null;
  services: any;
  groomer_id: number | null;
  clients: ClientInfo | null;
}

function formatTimeLabel(time: string) {
  return time;
}

export default function TodaySchedule() {
  const { isLoading } = useAuth();
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    let mounted = true;
    try {
      if (isLoading) {
        return; // Wait for auth to finish loading
      }
      setLoading(true);
      setError(null);
      
      console.log('TodaySchedule: Fetching schedule from Supabase...');
      const data = await DashboardService.getTodaySchedule();
      console.log('TodaySchedule: Received data:', data);
      if (mounted) setItems(data as any);
    } catch (e: any) {
      console.error('TodaySchedule: Error fetching schedule:', e);
      if (mounted) setError(e?.message || 'Failed to load schedule');
    } finally {
      if (mounted) setLoading(false);
    }
    return () => { mounted = false };
  }, [isLoading]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Today's Schedule</h3>
      </div>
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 sm:h-16 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : error ? (
          <div className="p-3 rounded bg-red-50 text-red-700 text-sm flex items-center justify-between">
            <span className="truncate mr-2">{error}</span>
            <button onClick={fetchSchedule} className="ml-3 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 whitespace-nowrap">Retry</button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">No appointments scheduled for today.</div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {items.map((a) => (
              <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                    {formatTimeLabel(a.time)} - {a.clients?.name || 'Client'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {a.groomer_id ? `Groomer ID: ${a.groomer_id}` : 'No groomer assigned'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {a.clients?.phone || a.clients?.email || ''}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full self-start sm:self-center whitespace-nowrap ${
                  a.status === 'confirmed' ? 'text-blue-800 bg-blue-100' :
                  a.status === 'pending' ? 'text-yellow-800 bg-yellow-100' :
                  a.status === 'completed' ? 'text-green-800 bg-green-100' : 'text-gray-800 bg-gray-100'
                }`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
