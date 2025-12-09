import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

type HealthStatus = 'healthy' | 'moderate' | 'needs_attention';

interface CampaignHealthIndicatorProps {
  healthyCampaigns: number;
  moderateCampaigns: number;
  attentionCampaigns: number;
  isLoading: boolean;
}

function getOverallHealth(healthy: number, moderate: number, attention: number): HealthStatus {
  if (attention > 0) return 'needs_attention';
  if (moderate > healthy) return 'moderate';
  return 'healthy';
}

export function CampaignHealthIndicator({
  healthyCampaigns,
  moderateCampaigns,
  attentionCampaigns,
  isLoading,
}: CampaignHealthIndicatorProps) {
  const totalCampaigns = healthyCampaigns + moderateCampaigns + attentionCampaigns;
  const overallHealth = getOverallHealth(healthyCampaigns, moderateCampaigns, attentionCampaigns);

  const config = {
    healthy: {
      icon: CheckCircle2,
      label: 'Healthy',
      color: 'text-success',
      bgColor: 'bg-success/10',
      subtext: `${healthyCampaigns} campaign${healthyCampaigns !== 1 ? 's' : ''} running smoothly`,
    },
    moderate: {
      icon: AlertTriangle,
      label: 'Moderate',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      subtext: `${moderateCampaigns} campaign${moderateCampaigns !== 1 ? 's' : ''} need monitoring`,
    },
    needs_attention: {
      icon: AlertCircle,
      label: 'Needs Attention',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      subtext: `${attentionCampaigns} campaign${attentionCampaigns !== 1 ? 's' : ''} require action`,
    },
  };

  const { icon: Icon, label, color, bgColor, subtext } = config[overallHealth];

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="h-16 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (totalCampaigns === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-muted p-3">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">No Active Campaigns</p>
              <p className="text-sm text-muted-foreground">Create a campaign to see health status</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={`rounded-full ${bgColor} p-3`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div>
            <p className={`text-lg font-semibold ${color}`}>{label}</p>
            <p className="text-sm text-muted-foreground">{subtext}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
