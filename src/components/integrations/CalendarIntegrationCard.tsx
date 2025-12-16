import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Check, Loader2, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface CalendarIntegrationCardProps {
  clientId: string;
  calendarConnected: boolean;
  calendarProvider: string | null;
  syncEnabled: boolean;
  lastSyncedAt: string | null;
  watchedCalendars: string[];
  onUpdate: (data: {
    connected: boolean;
    provider: string | null;
    syncEnabled: boolean;
    lastSyncedAt: string | null;
    watchedCalendars: string[];
  }) => void;
}

const SAMPLE_CALENDARS = [
  { id: 'primary', name: 'Primary Calendar' },
  { id: 'work', name: 'Work Calendar' },
  { id: 'personal', name: 'Personal Calendar' },
  { id: 'holidays', name: 'Holidays' },
];

export function CalendarIntegrationCard({
  clientId,
  calendarConnected,
  calendarProvider,
  syncEnabled,
  lastSyncedAt,
  watchedCalendars,
  onUpdate,
}: CalendarIntegrationCardProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleConnect(provider: 'google' | 'outlook') {
    setIsConnecting(provider);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          calendar_connected: true,
          calendar_provider: provider,
          sync_enabled: true,
          last_synced_at: new Date().toISOString(),
          watched_calendars: ['primary'],
        })
        .eq('id', clientId);

      if (error) throw error;

      onUpdate({
        connected: true,
        provider,
        syncEnabled: true,
        lastSyncedAt: new Date().toISOString(),
        watchedCalendars: ['primary'],
      });
      toast({
        title: 'Calendar connected',
        description: `${provider === 'google' ? 'Google Calendar' : 'Outlook'} has been connected.`,
      });
    } catch (error) {
      console.error('Failed to connect calendar:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect calendar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(null);
    }
  }

  async function handleDisconnect() {
    setIsConnecting('disconnect');
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          calendar_connected: false,
          calendar_provider: null,
          sync_enabled: false,
          last_synced_at: null,
          watched_calendars: [],
        })
        .eq('id', clientId);

      if (error) throw error;

      onUpdate({
        connected: false,
        provider: null,
        syncEnabled: false,
        lastSyncedAt: null,
        watchedCalendars: [],
      });
      toast({
        title: 'Calendar disconnected',
        description: 'Your calendar has been disconnected.',
      });
    } catch (error) {
      console.error('Failed to disconnect calendar:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect calendar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(null);
    }
  }

  async function handleToggleSync(enabled: boolean) {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ sync_enabled: enabled })
        .eq('id', clientId);

      if (error) throw error;

      onUpdate({
        connected: calendarConnected,
        provider: calendarProvider,
        syncEnabled: enabled,
        lastSyncedAt,
        watchedCalendars,
      });
      toast({
        title: enabled ? 'Two-way sync enabled' : 'Two-way sync disabled',
        description: enabled
          ? 'New meetings will be written to your calendar.'
          : 'Meetings will no longer sync to your calendar.',
      });
    } catch (error) {
      console.error('Failed to toggle sync:', error);
    }
  }

  async function handleToggleWatchedCalendar(calendarId: string, watched: boolean) {
    const newWatched = watched
      ? [...watchedCalendars, calendarId]
      : watchedCalendars.filter(id => id !== calendarId);

    try {
      const { error } = await supabase
        .from('clients')
        .update({ watched_calendars: newWatched })
        .eq('id', clientId);

      if (error) throw error;

      onUpdate({
        connected: calendarConnected,
        provider: calendarProvider,
        syncEnabled,
        lastSyncedAt,
        watchedCalendars: newWatched,
      });
    } catch (error) {
      console.error('Failed to update watched calendars:', error);
    }
  }

  async function handleManualSync() {
    setIsSyncing(true);
    try {
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newSyncTime = new Date().toISOString();
      const { error } = await supabase
        .from('clients')
        .update({ last_synced_at: newSyncTime })
        .eq('id', clientId);

      if (error) throw error;

      onUpdate({
        connected: calendarConnected,
        provider: calendarProvider,
        syncEnabled,
        lastSyncedAt: newSyncTime,
        watchedCalendars,
      });
      toast({
        title: 'Sync complete',
        description: 'Your calendar has been synchronized.',
      });
    } catch (error) {
      console.error('Failed to sync:', error);
      toast({
        title: 'Sync failed',
        description: 'Failed to sync calendar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }

  const getProviderLabel = (provider: string | null) => {
    switch (provider) {
      case 'google':
        return 'Google Calendar';
      case 'outlook':
        return 'Outlook';
      default:
        return provider;
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Calendar Integration</CardTitle>
              <CardDescription>
                Connect your calendar to sync meeting availability
              </CardDescription>
            </div>
          </div>
          {calendarConnected && (
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200/50">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {calendarConnected ? (
          <>
            {/* Sync Status Dashboard */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Provider</p>
                <p className="font-medium text-sm">{getProviderLabel(calendarProvider)} Sync</p>
                <Badge variant="secondary" className="mt-1 bg-emerald-50 text-emerald-700 text-xs">
                  Active
                </Badge>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Last Synced</p>
                <p className="font-medium text-sm">
                  {lastSyncedAt ? format(new Date(lastSyncedAt), 'MMM d, h:mm a') : 'Never'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-6 px-2 text-xs"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Sync Now
                </Button>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Two-Way Sync</p>
                <div className="flex items-center gap-2 mt-1">
                  <Switch
                    checked={syncEnabled}
                    onCheckedChange={handleToggleSync}
                  />
                  <span className="text-sm font-medium">
                    {syncEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Check for Conflicts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Check for Conflicts</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Select which calendars to check for busy times when booking:
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {SAMPLE_CALENDARS.map((cal) => (
                  <div
                    key={cal.id}
                    className="flex items-center space-x-2 p-2 rounded-lg border border-border/50 hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`cal-${cal.id}`}
                      checked={watchedCalendars.includes(cal.id)}
                      onCheckedChange={(checked) =>
                        handleToggleWatchedCalendar(cal.id, checked === true)
                      }
                    />
                    <Label
                      htmlFor={`cal-${cal.id}`}
                      className="flex-1 cursor-pointer text-sm font-normal"
                    >
                      {cal.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Disconnect */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={isConnecting !== null}
              >
                {isConnecting === 'disconnect' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Disconnect Calendar
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Connect your calendar to automatically check availability and prevent double-bookings.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleConnect('google')}
                disabled={isConnecting !== null}
              >
                {isConnecting === 'google' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Google Calendar
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleConnect('outlook')}
                disabled={isConnecting !== null}
              >
                {isConnecting === 'outlook' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V12zm-6-8.25v3h3v-3zm0 4.5v3h3v-3zm0 4.5v1.83l3.05-1.83zm-5.25-9v3h3.75v-3zm0 4.5v3h3.75v-3zm0 4.5v2.03l2.41 1.5 1.34-.84v-2.69zM9 3.75V6h2l.13.01.12.04v-2.3zM5.98 15.98q.9 0 1.6-.3.7-.32 1.19-.86.48-.55.73-1.28.25-.74.25-1.61 0-.83-.25-1.55-.24-.71-.71-1.24t-1.15-.83q-.68-.3-1.55-.3-.92 0-1.64.3-.71.3-1.2.85-.5.54-.75 1.3-.25.74-.25 1.63 0 .85.26 1.56.26.72.74 1.23.48.52 1.17.81.69.3 1.56.3zM7.5 21h12.39L12 16.08V17q0 .41-.3.7-.29.3-.7.3H7.5zm15-.13v-7.24l-5.9 3.54Z"
                    />
                  </svg>
                )}
                Outlook
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
