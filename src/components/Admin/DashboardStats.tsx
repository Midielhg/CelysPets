import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardService, type DashboardStats as Stats } from '../../services/dashboardService';

const numberFmt = (n: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
const currencyFmt = (n: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);

export default function DashboardStats() {
  const { isLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    console.log('DashboardStats: fetchStats called with Supabase');
    if (isLoading) {
      console.log('DashboardStats: Skipping fetch - still loading');
      return;
    }
    let isMounted = true;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await DashboardService.getStats();
      console.log('DashboardStats: Received data from Supabase:', data);
      if (isMounted) setStats(data);
    } catch (e: any) {
      console.error('DashboardStats: Error fetching stats:', e);
      if (isMounted) setError(e?.message || 'Failed to load stats');
    } finally {
      if (isMounted) setLoading(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [isLoading]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-3 sm:p-4 rounded-lg bg-gray-100 animate-pulse h-20 sm:h-24" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded bg-red-50 text-red-700 text-sm flex items-center justify-between">
        <span>{error}</span>
        <button onClick={fetchStats} className="ml-3 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200">Retry</button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard title="Total Revenue" value={currencyFmt(stats.totalRevenue)} subtitle="This month" />
      <StatCard title="Appointments" value={numberFmt(stats.appointmentsThisMonth)} subtitle="This month" />
      <StatCard title="Total Clients" value={numberFmt(stats.totalClients)} subtitle="All time" />
      <StatCard title="Avg. Rating" value={stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'} subtitle="Customer reviews" />
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div className="p-3 sm:p-4 rounded-lg bg-white shadow border border-gray-100">
      <div className="text-xs sm:text-sm text-gray-500 truncate">{title}</div>
      <div className="text-lg sm:text-2xl font-semibold mt-1 break-all">{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1 truncate">{subtitle}</div>}
    </div>
  );
}
