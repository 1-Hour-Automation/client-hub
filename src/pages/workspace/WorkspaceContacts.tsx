import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkspaceContacts() {
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <AppLayout 
      sidebarItems={workspaceSidebarItems(clientId!)} 
      clientName="Client Workspace"
    >
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Browse and manage prospect contacts.
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Contact Database</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is a placeholder for the contacts page. Here you'll see all contacts 
              in your target lists, with their company, phone, email, and call history.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
