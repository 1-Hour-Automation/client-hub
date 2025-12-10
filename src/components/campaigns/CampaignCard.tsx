import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Copy, Trash2 } from 'lucide-react';

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    status: string;
    phase: string | null;
    attendedMeetings: number;
    upcomingMeetings: number;
    connectRate: number;
  };
  clientId: string;
  isInternalUser?: boolean;
  onDelete?: (campaignId: string, campaignName: string) => void;
  onDuplicate?: (campaignId: string, campaignName: string) => void;
}

export function CampaignCard({ 
  campaign, 
  clientId, 
  isInternalUser = false,
  onDelete,
  onDuplicate,
}: CampaignCardProps) {
  const navigate = useNavigate();

  const getStatusBadgeClass = (status: string): string => {
    const classes: Record<string, string> = {
      active: 'badge-status-active',
      pending: 'badge-status-pending',
      paused: 'badge-status-paused',
      completed: 'badge-status-completed',
      onboarding_required: 'badge-status-pending',
    };
    return classes[status] || 'badge-status-paused';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      active: 'Active',
      pending: 'Pending',
      paused: 'Paused',
      completed: 'Completed',
      onboarding_required: 'Pending',
    };
    return labels[status] || status;
  };

  const getPhaseBadgeClass = (phase: string): string => {
    return phase.toLowerCase() === 'performance' ? 'badge-phase-performance' : 'badge-phase-sprint';
  };

  const getPhaseLabel = (phase: string): string => {
    return phase.toLowerCase() === 'performance' ? 'Performance' : 'Sprint';
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow border">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Left Section: Name + Badges */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate mb-2">
              {campaign.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {campaign.phase && (
                <Badge variant="outline" className={`text-xs font-normal ${getPhaseBadgeClass(campaign.phase)}`}>
                  {getPhaseLabel(campaign.phase)}
                </Badge>
              )}
              <Badge variant="outline" className={`text-xs font-medium ${getStatusBadgeClass(campaign.status)}`}>
                {getStatusLabel(campaign.status)}
              </Badge>
            </div>
          </div>

          {/* Middle Section: Metrics */}
          <div className="flex items-center gap-6 sm:gap-8 text-sm flex-wrap sm:flex-nowrap">
            <div className="text-center min-w-[60px]">
              <p className="text-lg font-semibold text-foreground">{campaign.attendedMeetings}</p>
              <p className="text-xs text-muted-foreground">Attended</p>
            </div>
            <div className="text-center min-w-[60px]">
              <p className="text-lg font-semibold text-foreground">{campaign.upcomingMeetings}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
            <div className="text-center min-w-[60px]">
              <p className="text-lg font-semibold text-foreground">{campaign.connectRate}%</p>
              <p className="text-xs text-muted-foreground">Connect</p>
            </div>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/workspace/${clientId}/campaigns/${campaign.id}`)}
            >
              View Campaign
            </Button>
            
            {isInternalUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background">
                  <DropdownMenuItem
                    onClick={() => navigate(`/workspace/${clientId}/campaigns/${campaign.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDuplicate?.(campaign.id, campaign.name)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete?.(campaign.id, campaign.name)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}