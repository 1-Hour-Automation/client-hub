import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { PortfolioKPIs } from '@/components/dashboard/PortfolioKPIs';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { RecentActivityFeed, ActivityItem } from '@/components/dashboard/RecentActivityFeed';
import { AccountManagerCard } from '@/components/dashboard/AccountManagerCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { startOfQuarter, endOfQuarter, startOfWeek, endOfWeek, addDays } from 'date-fns';

interface KPIs {
  attendedMeetings: number;
  upcomingMeetings: number;
  activeCampaigns: number;
  contactsReached: number;
}

interface CampaignWithMetrics {
  id: string;
  name: string;
  status: string;
  phase: string | null;
  target: string | null;
  attendedMeetings: number;
  upcomingMeetings: number;
  connectRate: number;
}

interface AccountManagerInfo {
  name: string | null;
  email: string | null;
  meetingLink: string | null;
}

export default function WorkspaceDashboard() {
  const { clientId } = useParams<{ clientId: string }>();
  const [clientName, setClientName] = useState<string>('');
  const [accountManager, setAccountManager] = useState<AccountManagerInfo>({ name: null, email: null, meetingLink: null });
  const [kpis, setKpis] = useState<KPIs>({ attendedMeetings: 0, upcomingMeetings: 0, activeCampaigns: 0, contactsReached: 0 });
  const [campaigns, setCampaigns] = useState<CampaignWithMetrics[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
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
        // Fetch client info including account manager
        const { data: clientData } = await supabase
          .from('clients')
          .select('name, account_manager, primary_contact_email, meeting_link')
          .eq('id', clientId)
          .maybeSingle();

        if (clientData) {
          setClientName(clientData.name);
          setAccountManager({
            name: clientData.account_manager,
            email: clientData.primary_contact_email,
            meetingLink: clientData.meeting_link,
          });
        }

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
          .select('id, name, status, phase, target')
          .eq('client_id', clientId)
          .is('deleted_at', null);

        if (campaignsData) {
          const campaignOverviews: CampaignWithMetrics[] = await Promise.all(
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
                phase: campaign.phase,
                target: campaign.target,
                attendedMeetings: attended ?? 0,
                upcomingMeetings: upcoming ?? 0,
                connectRate: 0, // Placeholder - requires call log data
              };
            })
          );

          setCampaigns(campaignOverviews);
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
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{clientName} Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Combined performance across all your campaigns.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <PortfolioKPIs
              attendedMeetings={kpis.attendedMeetings}
              upcomingMeetings={kpis.upcomingMeetings}
              activeCampaigns={kpis.activeCampaigns}
              contactsReached={kpis.contactsReached}
              isLoading={isLoading}
            />
          </div>
          <div>
            <AccountManagerCard
              name={accountManager.name}
              email={accountManager.email}
              meetingLink={accountManager.meetingLink}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="space-y-5">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Campaign Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded bg-muted" />
                  ))}
                </div>
              ) : campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No campaigns yet. Create your first campaign to see performance data.
                </p>
              ) : (
                campaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    clientId={clientId!}
                  />
                ))
              )}
            </CardContent>
          </Card>
          <RecentActivityFeed activities={activities} isLoading={isLoading} />
        </div>
      </div>
    </AppLayout>
  );
}