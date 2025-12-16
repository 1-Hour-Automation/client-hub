import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, AlertTriangle, Calendar, Users, Phone, MessageSquare, Clock, Globe, Link, User, CheckCircle, Percent, PhoneCall, Send, ClipboardList, Rocket, MoreHorizontal, Copy, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CampaignOnboardingForm } from '@/components/campaigns/CampaignOnboardingForm';
import { CandidateOnboardingForm, CandidateOnboardingData } from '@/components/campaigns/CandidateOnboardingForm';
import { CandidateOnboardingSummary } from '@/components/campaigns/CandidateOnboardingSummary';
import { ClientTargetingBriefForm, ClientTargetingBriefData } from '@/components/campaigns/ClientTargetingBriefForm';
import { ClientTargetingBriefSummary } from '@/components/campaigns/ClientTargetingBriefSummary';
import { CreatePerformancePlanModal } from '@/components/campaigns/CreatePerformancePlanModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfQuarter, addDays, startOfMonth, endOfMonth } from 'date-fns';

type MeetingStatusFilter = 'all' | 'scheduled' | 'attended' | 'no-show' | 'cancelled' | 'rescheduled';

interface CampaignDetails {
  id: string;
  name: string;
  status: string;
  phase: string;
  campaign_type: string | null;
  target: string | null;
  tier: string | null;
  bdr_assigned: string | null;
  quarterly_attended_meeting_guarantee: number | null;
  performance_fee_per_meeting: number | null;
  performance_start_date: string | null;
  sprint_campaign_id: string | null;
  internal_notes: string | null;
  created_at: string;
  client_id: string;
  onboarding_completed_at: string | null;
  onboarding_target_job_titles: string | null;
  onboarding_industries_to_target: string | null;
  onboarding_company_size_range: string | null;
  onboarding_required_skills: string | null;
  onboarding_locations_to_target: string | null;
  onboarding_excluded_industries: string | null;
  onboarding_example_ideal_companies: string | null;
  onboarding_value_proposition: string | null;
  onboarding_key_pain_points: string | null;
  onboarding_unique_differentiator: string | null;
  onboarding_example_messaging: string | null;
  onboarding_common_objections: string | null;
  onboarding_recommended_responses: string | null;
  onboarding_compliance_notes: string | null;
  onboarding_qualified_prospect_definition: string | null;
  onboarding_disqualifying_factors: string | null;
  onboarding_scheduling_link: string | null;
  onboarding_target_timezone: string | null;
  onboarding_booking_instructions: string | null;
  onboarding_bdr_notes: string | null;
  candidate_onboarding_data: CandidateOnboardingData | null;
  client_targeting_brief_data: ClientTargetingBriefData | null;
}

interface CampaignMetrics {
  attendedMeetings: number;
  bookedMeetings: number;
  connectRate: number;
  positiveConversations: number;
  totalContacts: number;
  totalDials: number;
  conversionRate: number;
}

interface Meeting {
  id: string;
  title: string;
  status: string;
  scheduled_for: string | null;
  contact_name?: string;
}

interface CallLog {
  id: string;
  contact_name: string;
  company: string | null;
  phone_number: string;
  disposition: string;
  call_time: string;
  notes: string | null;
}

export default function WorkspaceCampaignView() {
  const { clientId, campaignId } = useParams<{ clientId: string; campaignId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isInternalUser } = useAuth();
  
  const [clientName, setClientName] = useState('');
  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [bdrName, setBdrName] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meetingStatusFilter, setMeetingStatusFilter] = useState<MeetingStatusFilter>('all');
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [candidateOnboardingEditMode, setCandidateOnboardingEditMode] = useState(false);
  const [clientTargetingEditMode, setClientTargetingEditMode] = useState(false);
  
  // Delete/Duplicate state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleOnboardingCompleted = useCallback(() => {
    setOnboardingCompleted(true);
  }, []);

  const handleCandidateOnboardingCompleted = useCallback(() => {
    setCandidateOnboardingEditMode(false);
  }, []);

  const handleCandidateDataUpdated = useCallback((data: CandidateOnboardingData) => {
    setCampaign(prev => prev ? { ...prev, candidate_onboarding_data: data } : null);
  }, []);

  const handleClientTargetingCompleted = useCallback(() => {
    setClientTargetingEditMode(false);
  }, []);

  const handleClientTargetingDataUpdated = useCallback((data: ClientTargetingBriefData) => {
    setCampaign(prev => prev ? { ...prev, client_targeting_brief_data: data } : null);
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!clientId || !campaignId) return;

      try {
        // Fetch client name
        const { data: clientData } = await supabase
          .from('clients')
          .select('name')
          .eq('id', clientId)
          .maybeSingle();
        
        if (clientData) setClientName(clientData.name);

        // Fetch campaign details
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .eq('client_id', clientId)
          .maybeSingle();

        if (campaignError) throw campaignError;
        if (!campaignData) {
          toast({ title: 'Campaign not found', variant: 'destructive' });
          navigate(`/workspace/${clientId}/campaigns`);
          return;
        }

        setCampaign({
          ...campaignData,
          candidate_onboarding_data: campaignData.candidate_onboarding_data as CandidateOnboardingData | null,
          client_targeting_brief_data: campaignData.client_targeting_brief_data as ClientTargetingBriefData | null,
        });
        setOnboardingCompleted(!!campaignData.onboarding_completed_at);

        // Fetch BDR name if assigned
        if (campaignData.bdr_assigned) {
          const { data: bdrProfile } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('id', campaignData.bdr_assigned)
            .maybeSingle();
          
          if (bdrProfile?.display_name) {
            setBdrName(bdrProfile.display_name);
          }
        } else {
          setBdrName(null);
        }

        // Fetch metrics
        const quarterStart = startOfQuarter(new Date());
        const next7Days = addDays(new Date(), 7);
        const monthStart = startOfMonth(new Date());
        const monthEnd = endOfMonth(new Date());

        // Attended meetings this quarter
        const { count: attendedCount } = await supabase
          .from('meetings')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('status', 'attended')
          .gte('scheduled_for', quarterStart.toISOString());

        // Booked/upcoming meetings
        const { count: bookedCount } = await supabase
          .from('meetings')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .neq('status', 'cancelled')
          .gte('scheduled_for', new Date().toISOString())
          .lte('scheduled_for', next7Days.toISOString());

        // Total contacts for this campaign
        const { count: contactCount } = await supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaignId);

        // Fetch all meetings for this campaign
        const { data: meetingsData } = await supabase
          .from('meetings')
          .select('id, title, status, scheduled_for, contact_id')
          .eq('campaign_id', campaignId)
          .order('scheduled_for', { ascending: false });

        setMeetings(meetingsData || []);

        // Fetch call logs for this campaign
        const { data: callLogsData } = await supabase
          .from('call_logs')
          .select('id, contact_name, company, phone_number, disposition, call_time, notes')
          .eq('campaign_id', campaignId)
          .order('call_time', { ascending: false });

        setCallLogs(callLogsData || []);

        // Calculate derived metrics (placeholders for MVP)
        const totalContacts = contactCount ?? 0;
        const totalDials = Math.floor(totalContacts * 2.5); // Placeholder
        const positiveConversations = Math.floor((attendedCount ?? 0) * 0.6); // Placeholder
        const connectRate = totalDials > 0 ? Math.round((totalContacts / totalDials) * 100) : 0;
        const conversionRate = totalContacts > 0 ? Math.round(((attendedCount ?? 0) / totalContacts) * 100) : 0;

        setMetrics({
          attendedMeetings: attendedCount ?? 0,
          bookedMeetings: bookedCount ?? 0,
          connectRate,
          positiveConversations,
          totalContacts,
          totalDials,
          conversionRate,
        });

      } catch (error) {
        console.error('Failed to fetch campaign:', error);
        toast({ title: 'Error loading campaign', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [clientId, campaignId, navigate, toast]);

  const getStatusBadgeClass = (status: string): string => {
    const classes: Record<string, string> = {
      active: 'badge-status-active',
      pending: 'badge-status-pending',
      paused: 'badge-status-paused',
      completed: 'badge-status-completed',
      onboarding_required: 'badge-status-pending',
    };
    return classes[status] || 'badge-status-paused';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      active: 'Active',
      pending: 'Pending',
      paused: 'Paused',
      completed: 'Completed',
      onboarding_required: 'Pending',
    };
    return labels[status] || status;
  };

  const getPhaseBadgeClass = (phase: string): string => {
    return phase.toLowerCase() === 'performance' ? 'badge-phase-performance' : 'badge-phase-sprint';
  };

  const getPhaseLabel = (phase: string): string => {
    return phase.toLowerCase() === 'performance' ? 'Performance' : 'Sprint';
  };

  // Meeting metrics for Meetings tab - must be before early returns
  const meetingMetrics = useMemo(() => {
    const totalBooked = meetings.length;
    const quarterStart = startOfQuarter(new Date());
    const upcomingCount = meetings.filter(m => 
      m.scheduled_for && new Date(m.scheduled_for) >= new Date() && m.status !== 'cancelled'
    ).length;
    const attendedQuarter = meetings.filter(m => 
      m.status === 'attended' && m.scheduled_for && new Date(m.scheduled_for) >= quarterStart
    ).length;
    const pastMeetingsCount = meetings.filter(m => 
      m.scheduled_for && new Date(m.scheduled_for) < new Date()
    ).length;
    const attendanceRate = pastMeetingsCount > 0 
      ? Math.round((attendedQuarter / pastMeetingsCount) * 100) 
      : 0;
    
    return { totalBooked, upcomingCount, attendedQuarter, attendanceRate };
  }, [meetings]);

  // Filter meetings by status - must be before early returns
  const filteredMeetings = useMemo(() => {
    if (meetingStatusFilter === 'all') return meetings;
    return meetings.filter(m => m.status === meetingStatusFilter);
  }, [meetings, meetingStatusFilter]);

  const upcomingMeetings = useMemo(() => filteredMeetings.filter(m => 
    m.scheduled_for && new Date(m.scheduled_for) >= new Date() && m.status !== 'cancelled'
  ), [filteredMeetings]);
  
  const pastMeetings = useMemo(() => filteredMeetings.filter(m => 
    m.scheduled_for && new Date(m.scheduled_for) < new Date()
  ), [filteredMeetings]);

  const getMeetingStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'outline',
      attended: 'default',
      'no-show': 'destructive',
      cancelled: 'secondary',
      rescheduled: 'outline',
    };
    return variants[status] || 'outline';
  };

  const formatMeetingStatus = (status: string): string => {
    const labels: Record<string, string> = {
      scheduled: 'Scheduled',
      attended: 'Attended',
      'no-show': 'No Show',
      cancelled: 'Cancelled',
      rescheduled: 'Rescheduled',
    };
    return labels[status] || status;
  };

  const getDispositionBadgeVariant = (disposition: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Connected': 'default',
      'Positive Conversation': 'default',
      'No Answer': 'outline',
      'Voicemail': 'outline',
      'Call Back Requested': 'secondary',
      'Not Interested': 'secondary',
      'Bad Number': 'destructive',
      'Do Not Call': 'destructive',
    };
    return variants[disposition] || 'outline';
  };

  async function handleDeleteCampaign() {
    if (!campaignId) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', campaignId);

      if (error) throw error;

      toast({ title: 'Campaign deleted', description: `${campaign?.name} has been removed.` });
      setDeleteDialogOpen(false);
      navigate(`/workspace/${clientId}/campaigns`);
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
    if (!campaignId || !clientId || !campaign) return;

    setIsDuplicating(true);
    try {
      const { data: newCampaign, error: insertError } = await supabase
        .from('campaigns')
        .insert({
          client_id: clientId,
          name: `${campaign.name} (Copy)`,
          status: 'onboarding_required',
          phase: campaign.phase,
          campaign_type: campaign.campaign_type,
          target: campaign.target,
          tier: campaign.tier,
          onboarding_target_job_titles: campaign.onboarding_target_job_titles,
          onboarding_industries_to_target: campaign.onboarding_industries_to_target,
          onboarding_company_size_range: campaign.onboarding_company_size_range,
          onboarding_required_skills: campaign.onboarding_required_skills,
          onboarding_locations_to_target: campaign.onboarding_locations_to_target,
          onboarding_excluded_industries: campaign.onboarding_excluded_industries,
          onboarding_example_ideal_companies: campaign.onboarding_example_ideal_companies,
          onboarding_value_proposition: campaign.onboarding_value_proposition,
          onboarding_key_pain_points: campaign.onboarding_key_pain_points,
          onboarding_unique_differentiator: campaign.onboarding_unique_differentiator,
          onboarding_example_messaging: campaign.onboarding_example_messaging,
          onboarding_common_objections: campaign.onboarding_common_objections,
          onboarding_recommended_responses: campaign.onboarding_recommended_responses,
          onboarding_compliance_notes: campaign.onboarding_compliance_notes,
          onboarding_qualified_prospect_definition: campaign.onboarding_qualified_prospect_definition,
          onboarding_disqualifying_factors: campaign.onboarding_disqualifying_factors,
          onboarding_scheduling_link: campaign.onboarding_scheduling_link,
          onboarding_target_timezone: campaign.onboarding_target_timezone,
          onboarding_booking_instructions: campaign.onboarding_booking_instructions,
          onboarding_bdr_notes: campaign.onboarding_bdr_notes,
          onboarding_completed_at: campaign.onboarding_completed_at,
        })
        .select('id')
        .single();

      if (insertError || !newCampaign) throw insertError || new Error('Failed to create duplicate');

      toast({ title: 'Campaign duplicated', description: `${campaign.name} (Copy) has been created.` });
      setDuplicateDialogOpen(false);
      navigate(`/workspace/${clientId}/campaigns/${newCampaign.id}`);
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

  if (isLoading) {
    return (
      <AppLayout sidebarItems={workspaceSidebarItems(clientId!)} clientName={clientName}>
        <div className="space-y-6 animate-fade-in">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!campaign) return null;

  return (
    <AppLayout sidebarItems={workspaceSidebarItems(clientId!)} clientName={clientName}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/workspace/${clientId}/campaigns`)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-foreground">{campaign.name}</h1>
              <p className="text-sm text-muted-foreground">
                Created {format(new Date(campaign.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusBadgeClass(campaign.status)}>
                {getStatusLabel(campaign.status)}
              </Badge>
              {campaign.phase && (
                <Badge variant="outline" className={getPhaseBadgeClass(campaign.phase)}>
                  {getPhaseLabel(campaign.phase)}
                </Badge>
              )}
              {campaign.target && (
                <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200/50 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/40 capitalize">
                  {campaign.target}
                </Badge>
              )}
              {isInternalUser && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background">
                    <DropdownMenuItem onClick={() => setDuplicateDialogOpen(true)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate campaign
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete campaign
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Pending Banner */}
        {campaign.status === 'pending' && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">Campaign Requires Action</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Reason: Script approval needed</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-amber-600 text-amber-700 hover:bg-amber-100">
                Review Script
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            {onboardingCompleted && (
              <>
                <TabsTrigger value="meetings">Meetings</TabsTrigger>
                <TabsTrigger value="script">Script & Playbook</TabsTrigger>
                <TabsTrigger value="data">Data & ICP</TabsTrigger>
                <TabsTrigger value="calllog">Call Log</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Sprint to Performance Button */}
            {campaign.phase === 'sprint' && onboardingCompleted && isInternalUser && (
              <div className="flex justify-end">
                <Button onClick={() => setIsPerformanceModalOpen(true)} className="gap-2">
                  <Rocket className="h-4 w-4" />
                  Mark Sprint Completed / Create Performance Plan
                </Button>
              </div>
            )}

            {/* Onboarding Required Banner */}
            {!onboardingCompleted && (
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
                <ClipboardList className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-blue-900 dark:text-blue-100">Onboarding Required</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span>Please complete the campaign onboarding form to activate this campaign.</span>
                  {isInternalUser && (
                    <Button size="sm" variant="outline" className="border-blue-600 text-blue-700 hover:bg-blue-100 gap-2 shrink-0">
                      <Send className="h-4 w-4" />
                      Send Onboarding Form to Client
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Core KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">Attended (Quarter)</span>
                  </div>
                  <p className="text-2xl font-semibold">{metrics?.attendedMeetings ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Booked (Upcoming)</span>
                  </div>
                  <p className="text-2xl font-semibold">{metrics?.bookedMeetings ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Phone className="h-4 w-4" />
                    <span className="text-xs">Connect Rate</span>
                  </div>
                  <p className="text-2xl font-semibold">{metrics?.connectRate ?? 0}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-xs">Positive Convos</span>
                  </div>
                  <p className="text-2xl font-semibold">{metrics?.positiveConversations ?? 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Two Main Boxes */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Calling Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Calling Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Contacts Reached</span>
                    <span className="font-medium">{metrics?.totalContacts ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Dials Attempted</span>
                    <span className="font-medium">{metrics?.totalDials ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Positive Conversations</span>
                    <span className="font-medium">{metrics?.positiveConversations ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Connect Rate</span>
                    <span className="font-medium">{metrics?.connectRate ?? 0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Conversion Rate</span>
                    <span className="font-medium">{metrics?.conversionRate ?? 0}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Calling Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Target Timezone</span>
                      <p className="font-medium">Eastern Time (ET)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Calling Hours</span>
                      <p className="font-medium">9:00 AM – 5:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Link className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Scheduling Link</span>
                      <p className="font-medium text-primary">calendly.com/client</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">BDR Assigned</span>
                      <p className="font-medium">{bdrName || 'Not assigned'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Client Side Targeting Brief - Only for Client-focused campaigns */}
            {campaign.target === 'Client' && (
              <>
                {campaign.client_targeting_brief_data?.completed_at && !clientTargetingEditMode ? (
                  <ClientTargetingBriefSummary
                    data={campaign.client_targeting_brief_data}
                    campaignName={campaign.name}
                    workspaceName={clientName}
                    isInternalUser={isInternalUser}
                    onEditClick={() => setClientTargetingEditMode(true)}
                  />
                ) : (
                  <ClientTargetingBriefForm
                    campaignId={campaignId!}
                    campaignName={campaign.name}
                    workspaceName={clientName}
                    initialData={campaign.client_targeting_brief_data}
                    isInternalUser={isInternalUser}
                    onCompleted={handleClientTargetingCompleted}
                    onDataUpdated={handleClientTargetingDataUpdated}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="onboarding" className="space-y-6">
            {/* Candidate Onboarding */}
            {campaign.target === 'Candidate' && (
              <>
                {campaign.candidate_onboarding_data?.completed_at && !candidateOnboardingEditMode ? (
                  <CandidateOnboardingSummary
                    data={campaign.candidate_onboarding_data}
                    campaignName={campaign.name}
                    workspaceName={clientName}
                    isInternalUser={isInternalUser}
                    onEditClick={() => setCandidateOnboardingEditMode(true)}
                  />
                ) : (
                  <CandidateOnboardingForm
                    campaignId={campaignId!}
                    campaignName={campaign.name}
                    workspaceName={clientName}
                    roleTitles={campaign.candidate_onboarding_data?.role_titles}
                    initialData={campaign.candidate_onboarding_data}
                    isInternalUser={isInternalUser}
                    onCompleted={handleCandidateOnboardingCompleted}
                    onDataUpdated={handleCandidateDataUpdated}
                  />
                )}
              </>
            )}

            {/* Client Onboarding (existing) */}
            {campaign.target !== 'Candidate' && (
              <CampaignOnboardingForm
                campaignId={campaignId!}
                isCompleted={onboardingCompleted}
                onCompleted={handleOnboardingCompleted}
                initialData={campaign ? {
                  target_job_titles: campaign.onboarding_target_job_titles || '',
                  industries_to_target: campaign.onboarding_industries_to_target || '',
                  company_size_range: campaign.onboarding_company_size_range || '',
                  required_skills: campaign.onboarding_required_skills || '',
                  locations_to_target: campaign.onboarding_locations_to_target || '',
                  excluded_industries: campaign.onboarding_excluded_industries || '',
                  example_ideal_companies: campaign.onboarding_example_ideal_companies || '',
                  value_proposition: campaign.onboarding_value_proposition || '',
                  key_pain_points: campaign.onboarding_key_pain_points || '',
                  unique_differentiator: campaign.onboarding_unique_differentiator || '',
                  example_messaging: campaign.onboarding_example_messaging || '',
                  common_objections: campaign.onboarding_common_objections || '',
                  recommended_responses: campaign.onboarding_recommended_responses || '',
                  compliance_notes: campaign.onboarding_compliance_notes || '',
                  qualified_prospect_definition: campaign.onboarding_qualified_prospect_definition || '',
                  disqualifying_factors: campaign.onboarding_disqualifying_factors || '',
                  scheduling_link: campaign.onboarding_scheduling_link || '',
                  target_timezone: campaign.onboarding_target_timezone || '',
                  booking_instructions: campaign.onboarding_booking_instructions || '',
                  bdr_notes: campaign.onboarding_bdr_notes || '',
                } : undefined}
              />
            )}
          </TabsContent>

          <TabsContent value="meetings" className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">Meetings Booked</span>
                  </div>
                  <p className="text-2xl font-semibold">{meetingMetrics.totalBooked}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Upcoming Meetings</span>
                  </div>
                  <p className="text-2xl font-semibold">{meetingMetrics.upcomingCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs">Attended (Quarter)</span>
                  </div>
                  <p className="text-2xl font-semibold">{meetingMetrics.attendedQuarter}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Percent className="h-4 w-4" />
                    <span className="text-xs">Attendance Rate</span>
                  </div>
                  <p className="text-2xl font-semibold">{meetingMetrics.attendanceRate}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Status Filter Tabs */}
            <Tabs value={meetingStatusFilter} onValueChange={(v) => setMeetingStatusFilter(v as MeetingStatusFilter)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="attended">Attended</TabsTrigger>
                <TabsTrigger value="no-show">No Show</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                <TabsTrigger value="rescheduled">Rescheduled</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Unified Meetings List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Meetings ({filteredMeetings.length})
                  {meetingStatusFilter !== 'all' && (
                    <span className="font-normal text-muted-foreground ml-2">
                      — {formatMeetingStatus(meetingStatusFilter)}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredMeetings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No meetings{meetingStatusFilter !== 'all' ? ` with status "${formatMeetingStatus(meetingStatusFilter)}"` : ''} found.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredMeetings.map(meeting => {
                      const isUpcoming = meeting.scheduled_for && new Date(meeting.scheduled_for) >= new Date();
                      return (
                        <div key={meeting.id} className="flex items-center justify-between text-sm border-b pb-3 last:border-0 last:pb-0">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{meeting.title}</p>
                            <p className="text-muted-foreground text-xs">
                              {meeting.scheduled_for && format(new Date(meeting.scheduled_for), isUpcoming ? 'MMM d, h:mm a' : 'MMM d, yyyy')}
                              {isUpcoming && <span className="ml-2 text-primary">(Upcoming)</span>}
                            </p>
                          </div>
                          <Badge variant={getMeetingStatusBadgeVariant(meeting.status)} className="text-xs ml-2 shrink-0">
                            {formatMeetingStatus(meeting.status)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="script" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cold Calling Script</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Script content will be displayed here. This is a placeholder for the MVP.
                    Contact your account manager to update the script.
                  </p>
                  {campaign.status === 'pending' && (
                    <Button className="mt-4" size="sm">Approve Script</Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Objection Handling</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Common objections and recommended responses will appear here.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Booking Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Instructions for booking meetings and qualification criteria.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Client Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Additional notes from the client about this campaign.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ICP Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Target Roles</span>
                    <p className="font-medium">VP Sales, Director of Operations, CEO</p>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Industries</span>
                    <p className="font-medium">Technology, Healthcare, Finance</p>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Geographies</span>
                    <p className="font-medium">United States, Canada</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Data Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Contacts</span>
                    <span className="font-medium">{metrics?.totalContacts ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Verified Dials</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Data Source</span>
                    <span className="font-medium">ZoomInfo</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calllog" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Call Log ({callLogs.length} calls)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {callLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No calls have been logged for this campaign yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contact Name</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Phone Number</TableHead>
                          <TableHead>Disposition</TableHead>
                          <TableHead>Call Time</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {callLogs.map(log => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">{log.contact_name}</TableCell>
                            <TableCell className="text-muted-foreground">{log.company || '—'}</TableCell>
                            <TableCell>{log.phone_number}</TableCell>
                            <TableCell>
                              <Badge variant={getDispositionBadgeVariant(log.disposition)} className="text-xs">
                                {log.disposition}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(log.call_time), 'MMM d, yyyy h:mm a')}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                              {log.notes || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Performance Plan Modal */}
        {campaign && (
          <CreatePerformancePlanModal
            open={isPerformanceModalOpen}
            onOpenChange={setIsPerformanceModalOpen}
            sprintCampaign={campaign}
          />
        )}

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
      </div>
    </AppLayout>
  );
}
