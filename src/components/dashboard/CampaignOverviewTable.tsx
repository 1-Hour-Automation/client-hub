import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface CampaignOverview {
  id: string;
  name: string;
  status: string;
  attendedThisQuarter: number;
  upcomingMeetings: number;
}

interface CampaignOverviewTableProps {
  campaigns: CampaignOverview[];
  isLoading: boolean;
}

function getHealthStatus(attended: number): { label: string; variant: 'default' | 'secondary' | 'destructive' } {
  if (attended > 3) return { label: 'Healthy', variant: 'default' };
  if (attended >= 1) return { label: 'Moderate', variant: 'secondary' };
  return { label: 'Needs Attention', variant: 'destructive' };
}

function getPhaseLabel(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'Sprint';
    case 'paused':
      return 'Paused';
    case 'completed':
      return 'Completed';
    default:
      return 'Performance Plan';
  }
}

export function CampaignOverviewTable({ campaigns, isLoading }: CampaignOverviewTableProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Campaign Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Campaign Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">
            No campaigns yet. Create your first campaign to see performance data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Campaign Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead className="text-center">Attended</TableHead>
              <TableHead className="text-center">Upcoming</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => {
              const health = getHealthStatus(campaign.attendedThisQuarter);
              return (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {getPhaseLabel(campaign.status)}
                  </TableCell>
                  <TableCell className="text-center">{campaign.attendedThisQuarter}</TableCell>
                  <TableCell className="text-center">{campaign.upcomingMeetings}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={health.variant}>{health.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
