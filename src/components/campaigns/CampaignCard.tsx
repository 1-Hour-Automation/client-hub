import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Phone } from 'lucide-react';

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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold text-foreground line-clamp-1">{campaign.name}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={getStatusVariant(campaign.status)} className="capitalize">
                {campaign.status}
              </Badge>
            </div>
          </div>

          {/* Phase Badge */}
          <Badge variant="outline" className="text-xs">
            {getPhaseLabel(campaign.status)}
          </Badge>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center p-2 bg-muted/50 rounded-md">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Calendar className="h-3 w-3" />
              </div>
              <p className="text-lg font-semibold">{campaign.attendedMeetings}</p>
              <p className="text-xs text-muted-foreground">Attended</p>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-md">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Clock className="h-3 w-3" />
              </div>
              <p className="text-lg font-semibold">{campaign.upcomingMeetings}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-md">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Phone className="h-3 w-3" />
              </div>
              <p className="text-lg font-semibold">{campaign.connectRate}%</p>
              <p className="text-xs text-muted-foreground">Connect</p>
            </div>
          </div>

          {/* View Button */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate(`/workspace/${clientId}/campaigns/${campaign.id}`)}
          >
            View Campaign
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
