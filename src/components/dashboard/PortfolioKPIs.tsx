import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CalendarClock, Zap, Users } from 'lucide-react';

interface PortfolioKPIsProps {
  attendedMeetings: number;
  upcomingMeetings: number;
  activeCampaigns: number;
  contactsReached: number;
  isLoading: boolean;
}

interface KPICardProps {
  label: string;
  value: number;
  subtext: string;
  icon: React.ElementType;
  isLoading: boolean;
}

function KPICard({ label, value, subtext, icon: Icon, isLoading }: KPICardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <p className="text-2xl font-semibold text-foreground">{value}</p>
            )}
            <p className="text-xs text-muted-foreground">{subtext}</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PortfolioKPIs({
  attendedMeetings,
  upcomingMeetings,
  activeCampaigns,
  contactsReached,
  isLoading,
}: PortfolioKPIsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <KPICard
        label="Attended Meetings"
        value={attendedMeetings}
        subtext="This quarter"
        icon={Calendar}
        isLoading={isLoading}
      />
      <KPICard
        label="Upcoming Meetings"
        value={upcomingMeetings}
        subtext="Next 7 days"
        icon={CalendarClock}
        isLoading={isLoading}
      />
      <KPICard
        label="Active Campaigns"
        value={activeCampaigns}
        subtext="Currently running"
        icon={Zap}
        isLoading={isLoading}
      />
      <KPICard
        label="Contacts Reached"
        value={contactsReached}
        subtext="This week"
        icon={Users}
        isLoading={isLoading}
      />
    </div>
  );
}
