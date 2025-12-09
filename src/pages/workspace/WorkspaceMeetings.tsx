import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkspaceMeetings() {
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <AppLayout 
      sidebarItems={workspaceSidebarItems(clientId!)} 
      clientName="Client Workspace"
    >
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Meetings</h1>
          <p className="text-muted-foreground mt-1">
            View scheduled meetings booked by our team.
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Meeting Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is a placeholder for the meetings page. Here you'll see all scheduled 
              meetings with prospects, including date, time, attendee info, and status.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
