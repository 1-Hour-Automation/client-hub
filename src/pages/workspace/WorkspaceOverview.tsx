import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarCheck, 
  CalendarClock, 
  Rows3, 
  Clock, 
  ChevronRight,
  Phone,
  Activity
} from 'lucide-react';
import { startOfQuarter, endOfQuarter, startOfWeek, endOfWeek, subDays, format } from 'date-fns';

interface LaneData {
  id: string;
  name: string;
  status: string;
  meetings30Days: number;
  calls30Days: number;
  hoursDialled30Days: number;
}

export default function WorkspaceOverview() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('name')
        .eq('id', clientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  // Attended Meetings (this quarter)
  const now = new Date();
  const quarterStart = startOfQuarter(now);
  const quarterEnd = endOfQuarter(now);
  
  const { data: attendedMeetingsCount, isLoading: isLoadingAttended } = useQuery({
    queryKey: ['attended-meetings-quarter', clientId],
    queryFn: async () => {
      if (!clientId) return 0;
      const { count, error } = await supabase
        .from('meetings')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('status', 'attended')
        .gte('scheduled_for', quarterStart.toISOString())
        .lte('scheduled_for', quarterEnd.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!clientId,
  });

  // Upcoming Meetings (next 7 days)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const { data: upcomingMeetingsCount, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['upcoming-meetings-week', clientId],
    queryFn: async () => {
      if (!clientId) return 0;
      const { count, error } = await supabase
        .from('meetings')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .neq('status', 'cancelled')
        .gte('scheduled_for', now.toISOString())
        .lte('scheduled_for', sevenDaysFromNow.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!clientId,
  });

  // Active Lanes (campaigns with active status)
  const { data: activeLanesCount, isLoading: isLoadingLanes } = useQuery({
    queryKey: ['active-lanes', clientId],
    queryFn: async () => {
      if (!clientId) return 0;
      const { count, error } = await supabase
        .from('campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('status', 'active')
        .is('deleted_at', null);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!clientId,
  });

  // Hours Dialled (this week) - calculated from call_logs
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  const { data: hoursDialled, isLoading: isLoadingHours } = useQuery({
    queryKey: ['hours-dialled-week', clientId],
    queryFn: async () => {
      if (!clientId) return 0;
      const { count, error } = await supabase
        .from('call_logs')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .gte('call_time', weekStart.toISOString())
        .lte('call_time', weekEnd.toISOString());
      if (error) throw error;
      // Estimate: average call duration ~3 minutes, convert to hours
      const estimatedMinutes = (count ?? 0) * 3;
      return Math.round(estimatedMinutes / 60 * 10) / 10;
    },
    enabled: !!clientId,
  });

  // Lane Overview data (using campaigns as lanes for now)
  const thirtyDaysAgo = subDays(now, 30);
  
  const { data: lanes, isLoading: isLoadingLaneData } = useQuery({
    queryKey: ['lane-overview', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      // Get all campaigns (lanes)
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id, name, status')
        .eq('client_id', clientId)
        .is('deleted_at', null);
      
      if (campaignsError) throw campaignsError;
      
      // Get metrics for each lane
      const lanesWithMetrics: LaneData[] = await Promise.all(
        (campaigns || []).map(async (campaign) => {
          // Meetings in last 30 days
          const { count: meetingsCount } = await supabase
            .from('meetings')
            .select('id', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .gte('scheduled_for', thirtyDaysAgo.toISOString())
            .lte('scheduled_for', now.toISOString());
          
          // Calls in last 30 days
          const { count: callsCount } = await supabase
            .from('call_logs')
            .select('id', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .gte('call_time', thirtyDaysAgo.toISOString())
            .lte('call_time', now.toISOString());
          
          // Hours dialled (estimate: 3 min per call)
          const estimatedHours = Math.round(((callsCount ?? 0) * 3) / 60 * 10) / 10;
          
          return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            meetings30Days: meetingsCount ?? 0,
            calls30Days: callsCount ?? 0,
            hoursDialled30Days: estimatedHours,
          };
        })
      );
      
      return lanesWithMetrics;
    },
    enabled: !!clientId,
  });

  // Recent Activity (latest call logs)
  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['recent-activity', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('call_logs')
        .select('id, contact_name, company, disposition, call_time')
        .eq('client_id', clientId)
        .order('call_time', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!clientId,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'onboarding_required':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Onboarding</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDispositionColor = (disposition: string) => {
    switch (disposition.toLowerCase()) {
      case 'connected':
      case 'positive conversation':
        return 'text-green-600';
      case 'no answer':
      case 'voicemail':
        return 'text-muted-foreground';
      case 'not interested':
      case 'bad number':
      case 'do not call':
        return 'text-red-500';
      default:
        return 'text-foreground';
    }
  };

  return (
    <AppLayout 
      sidebarItems={workspaceSidebarItems(clientId || '')} 
      clientName={client?.name}
      clientId={clientId}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">
            Lane performance and activity across your portfolio.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Attended Meetings"
            value={attendedMeetingsCount ?? 0}
            subtext="This quarter"
            icon={CalendarCheck}
            isLoading={isLoadingAttended}
          />
          <StatCard
            label="Upcoming Meetings"
            value={upcomingMeetingsCount ?? 0}
            subtext="Next 7 days"
            icon={CalendarClock}
            isLoading={isLoadingUpcoming}
          />
          <StatCard
            label="Active Lanes"
            value={activeLanesCount ?? 0}
            subtext="Currently active"
            icon={Rows3}
            isLoading={isLoadingLanes}
          />
          <StatCard
            label="Hours Dialled"
            value={hoursDialled ?? 0}
            subtext="This week"
            icon={Clock}
            isLoading={isLoadingHours}
          />
        </div>

        {/* Lane Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Lane Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingLaneData ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : lanes && lanes.length > 0 ? (
              <div className="space-y-2">
                {lanes.map((lane) => (
                  <div
                    key={lane.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <Rows3 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{lane.name}</p>
                        {getStatusBadge(lane.status)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{lane.meetings30Days}</p>
                        <p className="text-xs text-muted-foreground">Meetings</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{lane.calls30Days}</p>
                        <p className="text-xs text-muted-foreground">Calls</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{lane.hoursDialled30Days}h</p>
                        <p className="text-xs text-muted-foreground">Dialled</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/workspace/${clientId}/lanes`)}
                        className="ml-2"
                      >
                        View Lane
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Rows3 className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No lanes yet</p>
                <p className="text-sm">Your active lanes will appear here once campaigns are set up.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-1">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between py-3 px-2 rounded hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {activity.contact_name}
                          {activity.company && (
                            <span className="text-muted-foreground font-normal"> at {activity.company}</span>
                          )}
                        </p>
                        <p className={`text-xs ${getDispositionColor(activity.disposition)}`}>
                          {activity.disposition}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.call_time), 'MMM d, h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No recent activity</p>
                <p className="text-sm">Call activity will appear here as your lanes progress.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
