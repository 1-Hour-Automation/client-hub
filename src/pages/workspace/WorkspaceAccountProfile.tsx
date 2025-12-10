import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkspaceAccountProfile() {
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <AppLayout sidebarItems={workspaceSidebarItems(clientId || '')}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Account Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and client information
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Fields will be added here */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Fields will be added here */}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
