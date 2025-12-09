import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Phone, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface Meeting {
  id: string;
  title: string;
  scheduled_for: string | null;
  status: string;
}

interface Stats {
  meetingsBooked: number;
  callsMade: number;
  interestedConversations: number;
}

export default function WorkspaceDashboard() {
  const { clientId } = useParams<{ clientId: string }>();
  const [clientName, setClientName] = useState<string>('');
  const [stats, setStats] = useState<Stats>({ meetingsBooked: 0, callsMade: 0, interestedConversations: 0 });
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!clientId) return;

      try {
        // Fetch client name
        const { data: clientData } = await supabase
          .from('clients')
          .select('name')
          .eq('id', clientId)
          .maybeSingle();

        if (clientData) setClientName(clientData.name);

        // Fetch meeting count
        const { count: meetingCount } = await supabase
          .from('meetings')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', clientId);

        // Fetch contact count (as proxy for calls made)
        const { count: contactCount } = await supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', clientId);

        // Fetch recent meetings
        const { data: meetingsData } = await supabase
          .from('meetings')
          .select('id, title, scheduled_for, status')
          .eq('client_id', clientId)
          .order('scheduled_for', { ascending: false })
          .limit(5);

        setStats({
          meetingsBooked: meetingCount ?? 0,
          callsMade: contactCount ?? 0, // Placeholder: using contacts as proxy
          interestedConversations: Math.floor((meetingCount ?? 0) * 1.5), // Placeholder calculation
        });

        setRecentMeetings(meetingsData || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [clientId]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      scheduled: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <AppLayout sidebarItems={workspaceSidebarItems(clientId!)} clientName={clientName}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Client Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your cold calling campaign performance.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Meetings Booked"
            value={stats.meetingsBooked}
            subtext="All time"
            icon={Calendar}
            isLoading={isLoading}
          />
          <StatCard
            label="Contacts Reached"
            value={stats.callsMade}
            subtext="All time"
            icon={Phone}
            isLoading={isLoading}
          />
          <StatCard
            label="Interested Conversations"
            value={stats.interestedConversations}
            subtext="Estimated"
            icon={MessageSquare}
            isLoading={isLoading}
          />
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Recent Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : recentMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No meetings scheduled yet. Book your first meeting to see it here.
              </p>
            ) : (
              <div className="space-y-3">
                {recentMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{meeting.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {meeting.scheduled_for
                          ? format(new Date(meeting.scheduled_for), 'MMM d, yyyy h:mm a')
                          : 'Not scheduled'}
                      </p>
                    </div>
                    {getStatusBadge(meeting.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
