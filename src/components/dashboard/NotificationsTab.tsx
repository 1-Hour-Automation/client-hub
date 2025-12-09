import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Notification {
  id: string;
  client_id: string;
  campaign_id: string | null;
  type: string;
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'open' | 'resolved';
  requires_client_action: boolean;
  visible_to_client: boolean;
  created_at: string;
  resolved_at: string | null;
  campaign_name?: string;
}

interface NotificationsTabProps {
  clientId: string;
}

type FilterType = 'all' | 'needs_attention' | 'info';

export function NotificationsTab({ clientId }: NotificationsTabProps) {
  const { isInternalUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    fetchNotifications();
  }, [clientId]);

  async function fetchNotifications() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          client_id,
          campaign_id,
          type,
          title,
          body,
          severity,
          status,
          requires_client_action,
          visible_to_client,
          created_at,
          resolved_at,
          campaigns (name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotifications: Notification[] = (data || []).map((n) => ({
        id: n.id,
        client_id: n.client_id,
        campaign_id: n.campaign_id,
        type: n.type,
        title: n.title,
        body: n.body,
        severity: n.severity as 'info' | 'warning' | 'critical',
        status: n.status as 'open' | 'resolved',
        requires_client_action: n.requires_client_action,
        visible_to_client: n.visible_to_client,
        created_at: n.created_at,
        resolved_at: n.resolved_at,
        campaign_name: (n.campaigns as { name: string } | null)?.name,
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMarkResolved(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, status: 'resolved', resolved_at: new Date().toISOString() }
            : n
        )
      );
      toast.success('Notification marked as resolved');
    } catch (error) {
      console.error('Failed to resolve notification:', error);
      toast.error('Failed to mark as resolved');
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'needs_attention') {
      return n.status === 'open' && n.requires_client_action;
    }
    if (filter === 'info') {
      return n.severity === 'info';
    }
    return true;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Warning</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
              <Skeleton className="h-5 w-5 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Notifications</CardTitle>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="needs_attention">Needs Attention</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No notifications yet</p>
            <p className="text-sm mt-1">
              You'll see approvals, meeting updates, and other important alerts here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                  notification.status === 'resolved' ? 'bg-muted/30 opacity-75' : 'bg-card'
                }`}
              >
                <div className="mt-0.5">{getSeverityIcon(notification.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-foreground truncate">
                          {notification.title}
                        </h4>
                        {getSeverityBadge(notification.severity)}
                        {notification.status === 'resolved' ? (
                          <Badge variant="outline" className="text-green-600 border-green-600/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Badge variant="outline">Open</Badge>
                        )}
                        {notification.requires_client_action && notification.status === 'open' && (
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {notification.campaign_name && (
                          <span className="font-medium">{notification.campaign_name}</span>
                        )}
                        <span>{format(new Date(notification.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    {isInternalUser && notification.status === 'open' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkResolved(notification.id)}
                        className="shrink-0"
                      >
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function useNotificationCount(clientId: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      const { count: actionCount } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('status', 'open')
        .eq('requires_client_action', true);

      setCount(actionCount ?? 0);
    }

    fetchCount();
  }, [clientId]);

  return count;
}