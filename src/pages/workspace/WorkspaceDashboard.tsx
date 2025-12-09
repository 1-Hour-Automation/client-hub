import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { PortfolioKPIs } from '@/components/dashboard/PortfolioKPIs';
import { CampaignOverviewTable, CampaignOverview } from '@/components/dashboard/CampaignOverviewTable';
import { ActivitySnapshot } from '@/components/dashboard/ActivitySnapshot';
import { RecentActivityFeed, ActivityItem } from '@/components/dashboard/RecentActivityFeed';
import { CampaignHealthIndicator } from '@/components/dashboard/CampaignHealthIndicator';
import { QuickLinks } from '@/components/dashboard/QuickLinks';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { startOfQuarter, endOfQuarter, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { Info } from 'lucide-react';

interface KPIs {
  attendedMeetings: number;
  upcomingMeetings: number;
  activeCampaigns: number;
  contactsReached: number;
}

interface HealthCounts {
  healthy: number;
  moderate: number;
  attention: number;
}

export default function WorkspaceDashboard() {
  const { clientId } = useParams<{ clientId: string }>();
  const [clientName, setClientName] = useState<string>('');
  const [kpis, setKpis] = useState<KPIs>({ attendedMeetings: 0, upcomingMeetings: 0, activeCampaigns: 0, contactsReached: 0 });
  const [campaigns, setCampaigns] = useState<CampaignOverview[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [healthCounts, setHealthCounts] = useState<HealthCounts>({ healthy: 0, moderate: 0, attention: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!clientId) return;

      const now = new Date();
      const quarterStart = startOfQuarter(now).toISOString();
      const quarterEnd = endOfQuarter(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const next7Days = addDays(now, 7).toISOString();

      try {
        // Fetch client name
        const { data: clientData } = await supabase
          .from('clients')
          .select('name')
          .eq('id', clientId)
          .maybeSingle();

        if (clientData) setClientName(clientData.name);

        // Fetch attended meetings this quarter
        const { count: attendedCount } = await supabase
          .from('meetings')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', clientId)
          .eq('status', 'attended')
          .gte('scheduled_for', quarterStart)
          .lte('scheduled_for', quarterEnd);

        // Fetch upcoming meetings (next 7 days, not cancelled)
        const { count: upcomingCount } = await supabase
          .from('meetings')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', clientId)
          .neq('status', 'cancelled')
          .gte('scheduled_for', now.toISOString())
          .lte('scheduled_for', next7Days);

        // Fetch active campaigns
        const { count: activeCampaignsCount } = await supabase
          .from('campaigns')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', clientId)
          .eq('status', 'active');

        // Fetch contacts reached this week (using created_at as proxy)
        // TODO: Track actual "reached" status when call logging is implemented
        const { count: contactsReachedCount } = await supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', clientId)
          .gte('created_at', weekStart)
          .lte('created_at', weekEnd);

        setKpis({
          attendedMeetings: attendedCount ?? 0,
          upcomingMeetings: upcomingCount ?? 0,
          activeCampaigns: activeCampaignsCount ?? 0,
          contactsReached: contactsReachedCount ?? 0,
        });

        // Fetch campaigns with meeting stats
        const { data: campaignsData } = await supabase
          .from('campaigns')
          .select('id, name, status')
          .eq('client_id', clientId);

        if (campaignsData) {
          const campaignOverviews: CampaignOverview[] = await Promise.all(
            campaignsData.map(async (campaign) => {
              const { count: attended } = await supabase
                .from('meetings')
                .select('id', { count: 'exact', head: true })
                .eq('campaign_id', campaign.id)
                .eq('status', 'attended')
                .gte('scheduled_for', quarterStart)
                .lte('scheduled_for', quarterEnd);

              const { count: upcoming } = await supabase
                .from('meetings')
                .select('id', { count: 'exact', head: true })
                .eq('campaign_id', campaign.id)
                .neq('status', 'cancelled')
                .gte('scheduled_for', now.toISOString())
                .lte('scheduled_for', next7Days);

              return {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                attendedThisQuarter: attended ?? 0,
                upcomingMeetings: upcoming ?? 0,
              };
            })
          );

          setCampaigns(campaignOverviews);

          // Calculate health counts
          let healthy = 0, moderate = 0, attention = 0;
          campaignOverviews.forEach((c) => {
            if (c.attendedThisQuarter > 3) healthy++;
            else if (c.attendedThisQuarter >= 1) moderate++;
            else attention++;
          });
          setHealthCounts({ healthy, moderate, attention });
        }

        // Fetch recent meetings for activity feed
        const { data: recentMeetings } = await supabase
          .from('meetings')
          .select(`
            id,
            title,
            status,
            scheduled_for,
            created_at,
            campaigns (name),
            contacts (name, company)
          `)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(8);

        if (recentMeetings) {
          const activityItems: ActivityItem[] = recentMeetings.map((meeting) => {
            const campaignName = (meeting.campaigns as { name: string } | null)?.name || 'Campaign';
            const contactName = (meeting.contacts as { name: string; company: string | null } | null)?.name || 'Contact';
            const company = (meeting.contacts as { name: string; company: string | null } | null)?.company;
            
            let type: ActivityItem['type'] = 'meeting_booked';
            let message = '';

            if (meeting.status === 'attended') {
              type = 'meeting_attended';
              message = `${campaignName} — Meeting attended with ${contactName}${company ? ` at ${company}` : ''}.`;
            } else if (meeting.status === 'scheduled') {
              type = 'meeting_booked';
              message = `Meeting booked with ${contactName}${company ? ` (${company})` : ''} — awaiting confirmation.`;
            } else if (meeting.status === 'confirmed') {
              type = 'confirmation_sent';
              message = `${campaignName} — Meeting confirmed with ${contactName}.`;
            } else {
              message = `${campaignName} — ${meeting.title}`;
            }

            return {
              id: meeting.id,
              type,
              message,
              timestamp: meeting.created_at,
              campaignName,
            };
          });
          setActivities(activityItems);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [clientId]);

  return (
    <AppLayout sidebarItems={workspaceSidebarItems(clientId!)} clientName={clientName}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Portfolio Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Combined performance across all your campaigns.
          </p>
        </div>

        <Alert className="bg-muted/50 border-border">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Holiday season may impact response rates. We're adjusting outreach timing accordingly.
          </AlertDescription>
        </Alert>

        <PortfolioKPIs
          attendedMeetings={kpis.attendedMeetings}
          upcomingMeetings={kpis.upcomingMeetings}
          activeCampaigns={kpis.activeCampaigns}
          contactsReached={kpis.contactsReached}
          isLoading={isLoading}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <CampaignOverviewTable campaigns={campaigns} isLoading={isLoading} />
            <RecentActivityFeed activities={activities} isLoading={isLoading} />
          </div>
          <div className="space-y-6">
            <CampaignHealthIndicator
              healthyCampaigns={healthCounts.healthy}
              moderateCampaigns={healthCounts.moderate}
              attentionCampaigns={healthCounts.attention}
              isLoading={isLoading}
            />
            <ActivitySnapshot
              contactsReached={kpis.contactsReached}
              connects={Math.floor(kpis.contactsReached * 0.4)} // TODO: Track actual connects
              positiveConversations={Math.floor(kpis.contactsReached * 0.15)} // TODO: Track actual conversations
              isLoading={isLoading}
            />
            <QuickLinks clientId={clientId!} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}