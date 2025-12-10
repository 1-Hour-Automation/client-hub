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
  phase: string;
  bdrAssigned: string | null;
  attendedThisQuarter: number;
  upcomingMeetings: number;
}

interface CampaignOverviewTableProps {
  campaigns: CampaignOverview[];
  isLoading: boolean;
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status.toLowerCase()) {
    case 'active':
      return 'default';
    case 'paused':
      return 'secondary';
    case 'completed':
      return 'outline';
    default:
      return 'secondary';
  }
}

function getStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'Active';
    case 'paused':
      return 'Paused';
    case 'completed':
      return 'Completed';
    case 'onboarding_required':
      return 'Onboarding';
    default:
      return status;
  }
}

function getPhaseBadgeVariant(phase: string): 'default' | 'secondary' {
  return phase.toLowerCase() === 'performance' ? 'secondary' : 'default';
}

function getPhaseLabel(phase: string): string {
  return phase.toLowerCase() === 'performance' ? 'Performance' : 'Sprint';
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
              <TableHead>BDR</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead className="text-center">Attended</TableHead>
              <TableHead className="text-center">Upcoming</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => {
              const phaseLabel = getPhaseLabel(campaign.phase);
              const phaseBadgeVariant = getPhaseBadgeVariant(campaign.phase);
              const statusLabel = getStatusLabel(campaign.status);
              const statusBadgeVariant = getStatusBadgeVariant(campaign.status);
              return (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {campaign.bdrAssigned || 'Unassigned'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={phaseBadgeVariant}>{phaseLabel}</Badge>
                  </TableCell>
                  <TableCell className="text-center">{campaign.attendedThisQuarter}</TableCell>
                  <TableCell className="text-center">{campaign.upcomingMeetings}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={statusBadgeVariant}>{statusLabel}</Badge>
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
