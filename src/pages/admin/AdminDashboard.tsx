import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminSidebarItems } from '@/components/layout/Sidebar';
import { StatCard } from '@/components/shared/StatCard';
import { supabase } from '@/integrations/supabase/client';
import { Users, Megaphone, Calendar } from 'lucide-react';

interface Stats {
  totalClients: number;
  totalCampaigns: number;
  totalMeetings: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalClients: 0, totalCampaigns: 0, totalMeetings: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [clientsRes, campaignsRes, meetingsRes] = await Promise.all([
          supabase.from('clients').select('id', { count: 'exact', head: true }),
          supabase.from('campaigns').select('id', { count: 'exact', head: true }),
          supabase.from('meetings').select('id', { count: 'exact', head: true }),
        ]);

        setStats({
          totalClients: clientsRes.count ?? 0,
          totalCampaigns: campaignsRes.count ?? 0,
          totalMeetings: meetingsRes.count ?? 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <AppLayout sidebarItems={adminSidebarItems}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of all clients and agency performance.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Total Clients"
            value={stats.totalClients}
            subtext="All time"
            icon={Users}
            isLoading={isLoading}
          />
          <StatCard
            label="Total Campaigns"
            value={stats.totalCampaigns}
            subtext="All time"
            icon={Megaphone}
            isLoading={isLoading}
          />
          <StatCard
            label="Meetings Booked"
            value={stats.totalMeetings}
            subtext="All time"
            icon={Calendar}
            isLoading={isLoading}
          />
        </div>
      </div>
    </AppLayout>
  );
}
