import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminSidebarItems } from '@/components/layout/Sidebar';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface Client {
  id: string;
  name: string;
  created_at: string;
  campaign_count: number;
}

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  async function fetchClients() {
    try {
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch campaign counts for each client
      const clientsWithCounts = await Promise.all(
        (clientsData || []).map(async (client) => {
          const { count } = await supabase
            .from('campaigns')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', client.id);
          return { ...client, campaign_count: count ?? 0 };
        })
      );

      setClients(clientsWithCounts);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clients. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchClients();
  }, []);

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    if (!newClientName.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('clients')
        .insert({ name: newClientName.trim() });

      if (error) throw error;

      toast({ title: 'Client created', description: `${newClientName} has been added.` });
      setNewClientName('');
      setIsDialogOpen(false);
      fetchClients();
    } catch (error) {
      console.error('Failed to create client:', error);
      toast({
        title: 'Error',
        description: 'Failed to create client. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns = [
    { header: 'Name', accessor: 'name' as const },
    {
      header: 'Created',
      accessor: (row: Client) => format(new Date(row.created_at), 'MMM d, yyyy'),
    },
    {
      header: 'Campaigns',
      accessor: (row: Client) => row.campaign_count,
    },
    {
      header: 'Actions',
      accessor: (row: Client) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/workspace/${row.id}/dashboard`)}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Workspace
        </Button>
      ),
      className: 'text-right',
    },
  ];

  return (
    <AppLayout sidebarItems={adminSidebarItems}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Clients</h1>
            <p className="text-muted-foreground mt-1">
              Manage client accounts and access workspaces.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    placeholder="Acme Corporation"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Client'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          columns={columns}
          data={clients}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={Users}
              title="No clients yet"
              description="Create your first client to start managing campaigns and tracking meetings."
              action={
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Client
                </Button>
              }
            />
          }
        />
      </div>
    </AppLayout>
  );
}
