import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LayoutDashboard } from 'lucide-react';

export default function WorkspaceOverview() {
  const { clientId } = useParams<{ clientId: string }>();

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('name')
        .eq('id', clientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  return (
    <AppLayout 
      sidebarItems={workspaceSidebarItems(clientId || '')} 
      clientName={client?.name}
      clientId={clientId}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">
            Combined performance metrics, lane health, and key insights across all your campaigns.
          </p>
        </div>

        <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-lg bg-muted/20">
          <div className="text-center text-muted-foreground">
            <LayoutDashboard className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Overview Dashboard Coming Soon</p>
            <p className="text-sm">Portfolio KPIs, lane performance, and activity summary will appear here.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
