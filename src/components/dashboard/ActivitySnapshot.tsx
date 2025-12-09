import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ActivitySnapshotProps {
  contactsReached: number;
  connects: number;
  positiveConversations: number;
  isLoading: boolean;
}

interface SnapshotCardProps {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'flat';
  isLoading: boolean;
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
  // TODO: Implement real trend logic based on previous week comparison
  const contactsTrend = contactsReached > 10 ? 'up' : contactsReached > 5 ? 'flat' : 'down';
  const connectsTrend = connects > 5 ? 'up' : connects > 2 ? 'flat' : 'down';
  const conversationsTrend = positiveConversations > 3 ? 'up' : positiveConversations > 0 ? 'flat' : 'down';

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">This Week's Activity</h3>
      <div className="grid gap-3 grid-cols-3">
        <SnapshotCard
          label="Contacts Reached"
          value={contactsReached}
          trend={contactsTrend}
          isLoading={isLoading}
        />
        <SnapshotCard
          label="Connects"
          value={connects}
          trend={connectsTrend}
          isLoading={isLoading}
        />
        <SnapshotCard
          label="Positive Conversations"
          value={positiveConversations}
          trend={conversationsTrend}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
