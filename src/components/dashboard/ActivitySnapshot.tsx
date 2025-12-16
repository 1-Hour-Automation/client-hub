import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricWithTrend {
  current: number;
  previous: number;
}

interface ActivitySnapshotProps {
  contactsReached: MetricWithTrend;
  connects: MetricWithTrend;
  positiveConversations: MetricWithTrend;
  isLoading: boolean;
}

interface SnapshotCardProps {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'flat';
  isLoading: boolean;
}

function calculateTrend(current: number, previous: number): 'up' | 'down' | 'flat' {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
}

function SnapshotCard({ label, value, trend, isLoading }: SnapshotCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            {isLoading ? (
              <div className="h-6 w-10 animate-pulse rounded bg-muted mt-1" />
            ) : (
              <p className="text-xl font-semibold text-foreground">{value}</p>
            )}
          </div>
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivitySnapshot({
  contactsReached,
  connects,
  positiveConversations,
  isLoading,
}: ActivitySnapshotProps) {
  const contactsTrend = calculateTrend(contactsReached.current, contactsReached.previous);
  const connectsTrend = calculateTrend(connects.current, connects.previous);
  const conversationsTrend = calculateTrend(positiveConversations.current, positiveConversations.previous);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">This Week's Activity</h3>
      <div className="grid gap-3 grid-cols-3">
        <SnapshotCard
          label="Contacts Reached"
          value={contactsReached.current}
          trend={contactsTrend}
          isLoading={isLoading}
        />
        <SnapshotCard
          label="Connects"
          value={connects.current}
          trend={connectsTrend}
          isLoading={isLoading}
        />
        <SnapshotCard
          label="Positive Conversations"
          value={positiveConversations.current}
          trend={conversationsTrend}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export type { MetricWithTrend };
