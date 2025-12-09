import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkspaceCampaigns() {
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <AppLayout 
      sidebarItems={workspaceSidebarItems(clientId!)} 
      clientName="Client Workspace"
    >
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your cold calling campaigns.
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Campaign List</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is a placeholder for the campaigns page. Here you'll see all active and 
              past campaigns, with details on target lists, scripts, and performance metrics.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
