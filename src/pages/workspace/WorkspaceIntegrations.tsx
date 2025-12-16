import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { CalendarIntegrationCard } from '@/components/integrations/CalendarIntegrationCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plug, Zap, Mail, CalendarCheck } from 'lucide-react';

interface ClientIntegrationData {
  name: string;
  calendar_connected: boolean;
  calendar_provider: string | null;
  sync_enabled: boolean;
  last_synced_at: string | null;
  watched_calendars: string[];
}

export default function WorkspaceIntegrations() {
  const { clientId } = useParams<{ clientId: string }>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [clientData, setClientData] = useState<ClientIntegrationData | null>(null);

  useEffect(() => {
    async function fetchClientData() {
      if (!clientId) return;

      try {
        const { data, error } = await supabase
          .from('clients')
          .select('name, calendar_connected, calendar_provider, sync_enabled, last_synced_at, watched_calendars')
          .eq('id', clientId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setClientData({
            ...data,
            watched_calendars: Array.isArray(data.watched_calendars) 
              ? (data.watched_calendars as string[]) 
              : [],
          });
        }
      } catch (error) {
        console.error('Failed to fetch client data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load integration settings.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchClientData();
  }, [clientId, toast]);

  const handleCalendarUpdate = (data: {
    connected: boolean;
    provider: string | null;
    syncEnabled: boolean;
    lastSyncedAt: string | null;
    watchedCalendars: string[];
  }) => {
    setClientData(prev => prev ? {
      ...prev,
      calendar_connected: data.connected,
      calendar_provider: data.provider,
      sync_enabled: data.syncEnabled,
      last_synced_at: data.lastSyncedAt,
      watched_calendars: data.watchedCalendars,
    } : null);
  };

  if (isLoading) {
    return (
      <AppLayout sidebarItems={workspaceSidebarItems(clientId!)} clientId={clientId}>
        <div className="space-y-6 animate-fade-in">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      sidebarItems={workspaceSidebarItems(clientId!)} 
      clientName={clientData?.name}
      clientId={clientId}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect your calendar and manage third-party integrations.
          </p>
        </div>

        {/* Integration Status Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Calendar Sync</p>
                  <p className="font-medium">
                    {clientData?.calendar_connected ? 'Connected' : 'Not Connected'}
                  </p>
                </div>
                {clientData?.calendar_connected && (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                    Active
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Email Reminders</p>
                  <p className="font-medium">Auto-Enabled</p>
                </div>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Two-Way Sync</p>
                  <p className="font-medium">
                    {clientData?.sync_enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                {clientData?.sync_enabled && (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                    Active
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Integration Card */}
        {clientId && clientData && (
          <CalendarIntegrationCard
            clientId={clientId}
            calendarConnected={clientData.calendar_connected}
            calendarProvider={clientData.calendar_provider}
            syncEnabled={clientData.sync_enabled}
            lastSyncedAt={clientData.last_synced_at}
            watchedCalendars={clientData.watched_calendars}
            onUpdate={handleCalendarUpdate}
          />
        )}

        {/* Email Automation Info */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Automated Email Reminders</CardTitle>
                <CardDescription>
                  Contacts receive automatic reminders for scheduled meetings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Immediate</p>
                  <p className="font-medium text-sm">Confirmation Email</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    With calendar invitation (.ics)
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">24 Hours Before</p>
                  <p className="font-medium text-sm">Meeting Reminder</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    "See you tomorrow" email
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">1 Hour Before</p>
                  <p className="font-medium text-sm">Starting Soon</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Includes meeting link
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Email reminders are automatically scheduled when meetings are booked through your booking links.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon */}
        <Card className="glass-card border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <Plug className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">More Integrations Coming Soon</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  CRM sync, Slack notifications, and more integrations are on the roadmap.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
