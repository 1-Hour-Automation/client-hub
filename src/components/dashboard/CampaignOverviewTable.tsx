import { useNavigate } from 'react-router-dom';
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
  clientId: string;
  isLoading: boolean;
}

function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'badge-status-active';
    case 'pending':
      return 'badge-status-pending';
    case 'paused':
      return 'badge-status-paused';
    case 'completed':
      return 'badge-status-completed';
    case 'onboarding_required':
      return 'badge-status-onboarding';
    default:
      return 'badge-status-paused';
  }
}

function getPhaseBadgeClass(phase: string): string {
  return phase.toLowerCase() === 'performance' ? 'badge-phase-performance' : 'badge-phase-sprint';
}

function getPhaseLabel(phase: string): string {
  return phase.toLowerCase() === 'performance' ? 'Performance' : 'Sprint';
}

function formatStatusLabel(value: string): string {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function CampaignOverviewTable({ campaigns, clientId, isLoading }: CampaignOverviewTableProps) {
  const navigate = useNavigate();
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
              const phaseBadgeClass = getPhaseBadgeClass(campaign.phase);
              const statusLabel = formatStatusLabel(campaign.status);
              const statusBadgeClass = getStatusBadgeClass(campaign.status);
              return (
                <TableRow 
                  key={campaign.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/workspace/${clientId}/campaigns/${campaign.id}`)}
                >
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {campaign.bdrAssigned || 'Unassigned'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={phaseBadgeClass}>{phaseLabel}</Badge>
                  </TableCell>
                  <TableCell className="text-center">{campaign.attendedThisQuarter}</TableCell>
                  <TableCell className="text-center">{campaign.upcomingMeetings}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={statusBadgeClass}>{statusLabel}</Badge>
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
