import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    status: string;
    attendedMeetings: number;
    upcomingMeetings: number;
    connectRate: number;
  };
  clientId: string;
}

export function CampaignCard({ campaign, clientId }: CampaignCardProps) {
  const navigate = useNavigate();

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      pending: 'outline',
      paused: 'secondary',
      completed: 'secondary',
    };
    return variants[status] || 'default';
  };

  const getPhaseLabel = (status: string): string => {
    const phases: Record<string, string> = {
      active: 'Performance Plan',
      pending: 'Validation Sprint',
      paused: 'On Hold',
      completed: 'Completed',
    };
    return phases[status] || 'Unknown';
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
              <Badge variant="outline" className="text-xs font-normal">
                {getPhaseLabel(campaign.status)}
              </Badge>
              <Badge variant={getStatusVariant(campaign.status)} className="capitalize text-xs">
                {campaign.status}
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

          {/* Right Section: View Button */}
          <div className="flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/workspace/${clientId}/campaigns/${campaign.id}`)}
            >
              View Campaign
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
