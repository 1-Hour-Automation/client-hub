import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export interface ActivityItem {
  id: string;
  type: 'meeting_attended' | 'meeting_booked' | 'positive_conversation' | 'confirmation_sent' | 'sprint_update' | 'data_update';
  message: string;
  timestamp: string;
  campaignName?: string;
}

interface RecentActivityFeedProps {
  activities: ActivityItem[];
  isLoading: boolean;
}

function getActivityIcon(type: ActivityItem['type']): string {
  switch (type) {
    case 'meeting_attended':
      return '✓';
    case 'meeting_booked':
      return '📅';
    case 'positive_conversation':
      return '💬';
    case 'confirmation_sent':
      return '📧';
    case 'sprint_update':
      return '📊';
    case 'data_update':
      return '📝';
    default:
      return '•';
  }
}

export function RecentActivityFeed({ activities, isLoading }: RecentActivityFeedProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">
            No recent activity yet — your updates will appear here as campaigns progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 text-sm border-b border-border pb-3 last:border-0 last:pb-0"
            >
              <span className="text-base shrink-0">{getActivityIcon(activity.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-foreground leading-snug">{activity.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(activity.timestamp), 'd MMM, h:mm a')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
