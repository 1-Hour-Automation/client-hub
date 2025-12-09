import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkspaceDashboard() {
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <AppLayout 
      sidebarItems={workspaceSidebarItems(clientId!)} 
      clientName="Client Workspace"
    >
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Client Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your cold calling campaign performance.
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is a placeholder for the client dashboard. Here you'll see metrics specific 
              to this client, including calls made, meetings booked, and conversion rates.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
