import { AppLayout } from '@/components/layout/AppLayout';
import { adminSidebarItems } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  return (
    <AppLayout sidebarItems={adminSidebarItems}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of all clients and agency performance.
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Dashboard Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is a placeholder for the admin dashboard. Here you'll see aggregated metrics 
              across all clients, including total calls made, meetings scheduled, and campaign performance.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
