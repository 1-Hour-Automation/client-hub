import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  phase: string | null;
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
  const navigate = useNavigate();
  const { isInternalUser } = useAuth();
  const [clientName, setClientName] = useState<string>('');
  const [campaigns, setCampaigns] = useState<CampaignWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', target: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const { toast } = useToast();

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Duplicate confirmation state
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [campaignToDuplicate, setCampaignToDuplicate] = useState<{ id: string; name: string } | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);

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
        .select('id, name, status, phase, created_at')
        .eq('client_id', clientId)
        .is('deleted_at', null)
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
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          name: newCampaign.name.trim(),
          status: 'onboarding_required',
          phase: 'sprint',
          target: newCampaign.target || null,
          client_id: clientId,
        })
        .select('id')
        .single();

      if (error) throw error;

      toast({ title: 'Campaign created', description: `${newCampaign.name} has been added.` });
      setNewCampaign({ name: '', target: '' });
      setIsDialogOpen(false);
      
      navigate(`/workspace/${clientId}/campaigns/${data.id}`);
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

  async function handleDeleteCampaign() {
    if (!campaignToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', campaignToDelete.id);

      if (error) throw error;

      toast({ title: 'Campaign deleted', description: `${campaignToDelete.name} has been removed.` });
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignToDelete.id));
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete campaign. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDuplicateCampaign() {
    if (!campaignToDuplicate || !clientId) return;

    setIsDuplicating(true);
    try {
      // Fetch the original campaign with all fields
      const { data: originalCampaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignToDuplicate.id)
        .single();

      if (fetchError || !originalCampaign) throw fetchError || new Error('Campaign not found');

      // Create the duplicate
      const { data: newCampaign, error: insertError } = await supabase
        .from('campaigns')
        .insert({
          client_id: clientId,
          name: `${originalCampaign.name} (Copy)`,
          status: 'onboarding_required',
          phase: originalCampaign.phase,
          campaign_type: originalCampaign.campaign_type,
          target: originalCampaign.target,
          tier: originalCampaign.tier,
          // Copy onboarding fields
          onboarding_target_job_titles: originalCampaign.onboarding_target_job_titles,
          onboarding_industries_to_target: originalCampaign.onboarding_industries_to_target,
          onboarding_company_size_range: originalCampaign.onboarding_company_size_range,
          onboarding_required_skills: originalCampaign.onboarding_required_skills,
          onboarding_locations_to_target: originalCampaign.onboarding_locations_to_target,
          onboarding_excluded_industries: originalCampaign.onboarding_excluded_industries,
          onboarding_example_ideal_companies: originalCampaign.onboarding_example_ideal_companies,
          onboarding_value_proposition: originalCampaign.onboarding_value_proposition,
          onboarding_key_pain_points: originalCampaign.onboarding_key_pain_points,
          onboarding_unique_differentiator: originalCampaign.onboarding_unique_differentiator,
          onboarding_example_messaging: originalCampaign.onboarding_example_messaging,
          onboarding_common_objections: originalCampaign.onboarding_common_objections,
          onboarding_recommended_responses: originalCampaign.onboarding_recommended_responses,
          onboarding_compliance_notes: originalCampaign.onboarding_compliance_notes,
          onboarding_qualified_prospect_definition: originalCampaign.onboarding_qualified_prospect_definition,
          onboarding_disqualifying_factors: originalCampaign.onboarding_disqualifying_factors,
          onboarding_scheduling_link: originalCampaign.onboarding_scheduling_link,
          onboarding_target_timezone: originalCampaign.onboarding_target_timezone,
          onboarding_booking_instructions: originalCampaign.onboarding_booking_instructions,
          onboarding_bdr_notes: originalCampaign.onboarding_bdr_notes,
          // Copy completed_at if original was completed
          onboarding_completed_at: originalCampaign.onboarding_completed_at,
          // Not copying: internal_notes, performance fields, sprint_campaign_id, deleted_at
        })
        .select('id')
        .single();

      if (insertError || !newCampaign) throw insertError || new Error('Failed to create duplicate');

      toast({ title: 'Campaign duplicated', description: `${originalCampaign.name} (Copy) has been created.` });
      setDuplicateDialogOpen(false);
      setCampaignToDuplicate(null);
      
      // Refresh the list
      fetchData();
    } catch (error) {
      console.error('Failed to duplicate campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate campaign. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDuplicating(false);
    }
  }

  function openDeleteDialog(campaignId: string, campaignName: string) {
    setCampaignToDelete({ id: campaignId, name: campaignName });
    setDeleteDialogOpen(true);
  }

  function openDuplicateDialog(campaignId: string, campaignName: string) {
    setCampaignToDuplicate({ id: campaignId, name: campaignName });
    setDuplicateDialogOpen(true);
  }

  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = campaigns;
    
    if (activeFilter !== 'all') {
      filtered = campaigns.filter(c => c.status === activeFilter);
    }

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
                    <Label htmlFor="target">Target</Label>
                    <Select
                      value={newCampaign.target}
                      onValueChange={(value) => setNewCampaign({ ...newCampaign, target: value })}
                    >
                      <SelectTrigger id="target">
                        <SelectValue placeholder="Select target type" />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="candidate">Candidate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting || !newCampaign.target}>
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
              <CampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                clientId={clientId!}
                isInternalUser={isInternalUser}
                onDelete={openDeleteDialog}
                onDuplicate={openDuplicateDialog}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the campaign from your active view. Contacts and meetings will remain in the system, but this campaign will no longer appear in your list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCampaign} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete campaign'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Confirmation Dialog */}
      <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new campaign with the same configuration as this one. Contacts and meetings will not be copied.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDuplicating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDuplicateCampaign} disabled={isDuplicating}>
              {isDuplicating ? 'Duplicating...' : 'Duplicate campaign'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}