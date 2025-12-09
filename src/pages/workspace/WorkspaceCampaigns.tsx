import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Megaphone } from 'lucide-react';
import { format } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
  contact_count: number;
}

export default function WorkspaceCampaigns() {
  const { clientId } = useParams<{ clientId: string }>();
  const { isInternalUser } = useAuth();
  const [clientName, setClientName] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', status: 'active' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  async function fetchData() {
    if (!clientId) return;

    try {
      // Fetch client name
      const { data: clientData } = await supabase
        .from('clients')
        .select('name')
        .eq('id', clientId)
        .maybeSingle();

      if (clientData) setClientName(clientData.name);

      // Fetch campaigns
      const { data: campaignsData, error } = await supabase
        .from('campaigns')
        .select('id, name, status, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch contact counts
      const campaignsWithCounts = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          const { count } = await supabase
            .from('contacts')
            .select('id', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id);
          return { ...campaign, contact_count: count ?? 0 };
        })
      );

      setCampaigns(campaignsWithCounts);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaigns. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [clientId]);

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!newCampaign.name.trim() || !clientId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('campaigns').insert({
        name: newCampaign.name.trim(),
        status: newCampaign.status,
        client_id: clientId,
      });

      if (error) throw error;

      toast({ title: 'Campaign created', description: `${newCampaign.name} has been added.` });
      setNewCampaign({ name: '', status: 'active' });
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to create campaign. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      paused: 'secondary',
      completed: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    { header: 'Name', accessor: 'name' as const },
    {
      header: 'Status',
      accessor: (row: Campaign) => getStatusBadge(row.status),
    },
    {
      header: 'Created',
      accessor: (row: Campaign) => format(new Date(row.created_at), 'MMM d, yyyy'),
    },
    {
      header: 'Contacts',
      accessor: (row: Campaign) => row.contact_count,
    },
  ];

  return (
    <AppLayout sidebarItems={workspaceSidebarItems(clientId!)} clientName={clientName}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Campaigns</h1>
            <p className="text-muted-foreground mt-1">
              View and manage cold calling campaigns.
            </p>
          </div>
          {isInternalUser && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateCampaign} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaignName">Campaign Name</Label>
                    <Input
                      id="campaignName"
                      placeholder="Q1 Outreach"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newCampaign.status}
                      onValueChange={(value) => setNewCampaign({ ...newCampaign, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Campaign'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <DataTable
          columns={columns}
          data={campaigns}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={Megaphone}
              title="No campaigns yet"
              description="Create your first campaign to start tracking activity."
              action={
                isInternalUser ? (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Campaign
                  </Button>
                ) : undefined
              }
            />
          }
        />
      </div>
    </AppLayout>
  );
}
