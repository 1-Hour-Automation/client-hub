import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { CampaignFilters, FilterStatus } from '@/components/campaigns/CampaignFilters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Megaphone } from 'lucide-react';
import { startOfQuarter, addDays } from 'date-fns';

interface CampaignWithMetrics {
  id: string;
  name: string;
  status: string;
  created_at: string;
  attendedMeetings: number;
  upcomingMeetings: number;
  connectRate: number;
}

const STATUS_ORDER: Record<string, number> = {
  active: 0,
  pending: 1,
  paused: 2,
  completed: 3,
};

export default function WorkspaceCampaigns() {
  const { clientId } = useParams<{ clientId: string }>();
  const { isInternalUser } = useAuth();
  const [clientName, setClientName] = useState<string>('');
  const [campaigns, setCampaigns] = useState<CampaignWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', status: 'active' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const { toast } = useToast();

  async function fetchData() {
    if (!clientId) return;

    try {
      const { data: clientData } = await supabase
        .from('clients')
        .select('name')
        .eq('id', clientId)
        .maybeSingle();

      if (clientData) setClientName(clientData.name);

      const { data: campaignsData, error } = await supabase
        .from('campaigns')
        .select('id, name, status, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const quarterStart = startOfQuarter(new Date());
      const next7Days = addDays(new Date(), 7);

      const campaignsWithMetrics = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          const { count: attendedCount } = await supabase
            .from('meetings')
            .select('id', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .eq('status', 'attended')
            .gte('scheduled_for', quarterStart.toISOString());

          const { count: upcomingCount } = await supabase
            .from('meetings')
            .select('id', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .neq('status', 'cancelled')
            .gte('scheduled_for', new Date().toISOString())
            .lte('scheduled_for', next7Days.toISOString());

          const { count: contactCount } = await supabase
            .from('contacts')
            .select('id', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id);

          const contacts = contactCount ?? 0;
          const connectRate = contacts > 0 ? Math.min(Math.round((contacts * 0.15) * 10), 100) : 0;

          return {
            ...campaign,
            attendedMeetings: attendedCount ?? 0,
            upcomingMeetings: upcomingCount ?? 0,
            connectRate,
          };
        })
      );

      setCampaigns(campaignsWithMetrics);
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

  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = campaigns;
    
    if (activeFilter !== 'all') {
      filtered = campaigns.filter(c => c.status === activeFilter);
    }

    // Sort: by status order first, then by created_at descending
    return [...filtered].sort((a, b) => {
      const statusDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [campaigns, activeFilter]);

  return (
    <AppLayout sidebarItems={workspaceSidebarItems(clientId!)} clientName={clientName}>
      <div className="space-y-6 animate-fade-in w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Campaigns</h1>
            <p className="text-muted-foreground mt-1">
              View and manage cold calling campaigns.
            </p>
          </div>
          {isInternalUser && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-shrink-0">
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
                        <SelectItem value="pending">Pending</SelectItem>
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

        {/* Filter Tabs */}
        <CampaignFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {/* Campaign List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredAndSortedCampaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title={activeFilter === 'all' ? 'No campaigns yet' : `No ${activeFilter} campaigns`}
            description={
              activeFilter === 'all'
                ? 'Create your first cold calling campaign to get started.'
                : `There are no campaigns with ${activeFilter} status.`
            }
            action={
              isInternalUser && activeFilter === 'all' ? (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredAndSortedCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} clientId={clientId!} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
