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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Plus, Calendar, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { MeetingsCalendarView } from '@/components/meetings/MeetingsCalendarView';
import { BookingLinksView } from '@/components/meetings/BookingLinksView';

interface MeetingRow {
  id: string;
  title: string;
  contact_id: string | null;
  contact_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  scheduled_for: string | null;
  status: string;
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  name: string;
}

export default function WorkspaceMeetings() {
  const { clientId } = useParams<{ clientId: string }>();
  const { isInternalUser } = useAuth();
  const [clientName, setClientName] = useState<string>('');
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    contact_id: '',
    campaign_id: '',
    scheduled_for: '',
    status: 'scheduled',
  });
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

      // Fetch contacts
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, name')
        .eq('client_id', clientId)
        .order('name');

      setContacts(contactsData || []);

      // Fetch campaigns
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('client_id', clientId)
        .order('name');

      setCampaigns(campaignsData || []);

      // Fetch meetings
      const { data: meetingsData, error } = await supabase
        .from('meetings')
        .select('id, title, contact_id, campaign_id, scheduled_for, status, created_at')
        .eq('client_id', clientId)
        .order('scheduled_for', { ascending: false });

      if (error) throw error;

      // Map contact and campaign names
      const meetingsWithNames = (meetingsData || []).map((meeting) => ({
        ...meeting,
        contact_name: contactsData?.find((c) => c.id === meeting.contact_id)?.name || null,
        campaign_name: campaignsData?.find((c) => c.id === meeting.campaign_id)?.name || null,
      }));

      setMeetings(meetingsWithNames);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load meetings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [clientId]);

  async function handleAddMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!newMeeting.title.trim() || !clientId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('meetings').insert({
        title: newMeeting.title.trim(),
        contact_id: newMeeting.contact_id || null,
        campaign_id: newMeeting.campaign_id || null,
        scheduled_for: newMeeting.scheduled_for || null,
        status: newMeeting.status,
        client_id: clientId,
      });

      if (error) throw error;

      toast({ title: 'Meeting added', description: `${newMeeting.title} has been scheduled.` });
      setNewMeeting({ title: '', contact_id: '', campaign_id: '', scheduled_for: '', status: 'scheduled' });
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to add meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to add meeting. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      scheduled: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns = [
    { header: 'Title', accessor: 'title' as const },
    { header: 'Contact', accessor: (row: MeetingRow) => row.contact_name || '—' },
    { header: 'Campaign', accessor: (row: MeetingRow) => row.campaign_name || '—' },
    {
      header: 'Scheduled For',
      accessor: (row: MeetingRow) =>
        row.scheduled_for ? format(new Date(row.scheduled_for), 'MMM d, yyyy h:mm a') : '—',
    },
    {
      header: 'Status',
      accessor: (row: MeetingRow) => getStatusBadge(row.status),
    },
    {
      header: 'Created',
      accessor: (row: MeetingRow) => format(new Date(row.created_at), 'MMM d, yyyy'),
    },
  ];

  return (
    <AppLayout sidebarItems={workspaceSidebarItems(clientId!)} clientName={clientName} clientId={clientId}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Meetings</h1>
            <p className="text-muted-foreground mt-1">
              View scheduled meetings and manage booking links.
            </p>
          </div>
          {isInternalUser && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Meeting
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Meeting</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddMeeting} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meetingTitle">Title *</Label>
                    <Input
                      id="meetingTitle"
                      placeholder="Discovery call with Jane"
                      value={newMeeting.title}
                      onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact</Label>
                    <Select
                      value={newMeeting.contact_id}
                      onValueChange={(value) => setNewMeeting({ ...newMeeting, contact_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campaign">Campaign</Label>
                    <Select
                      value={newMeeting.campaign_id}
                      onValueChange={(value) => setNewMeeting({ ...newMeeting, campaign_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduledFor">Scheduled For</Label>
                    <Input
                      id="scheduledFor"
                      type="datetime-local"
                      value={newMeeting.scheduled_for}
                      onChange={(e) => setNewMeeting({ ...newMeeting, scheduled_for: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newMeeting.status}
                      onValueChange={(value) => setNewMeeting({ ...newMeeting, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Meeting'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Meeting List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="booking" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Booking Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <DataTable
              columns={columns}
              data={meetings}
              isLoading={isLoading}
              emptyState={
                <EmptyState
                  icon={Calendar}
                  title="No meetings yet"
                  description="Book your first meeting to start tracking scheduled calls."
                  action={
                    isInternalUser ? (
                      <Button onClick={() => setIsDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Meeting
                      </Button>
                    ) : undefined
                  }
                />
              }
            />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <MeetingsCalendarView meetings={meetings} />
          </TabsContent>

          <TabsContent value="booking" className="mt-6">
            {clientId && <BookingLinksView clientId={clientId} />}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
