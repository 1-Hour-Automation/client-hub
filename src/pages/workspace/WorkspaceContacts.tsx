import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
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
import { Plus, Contact } from 'lucide-react';
import { format } from 'date-fns';

interface ContactRow {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
}

export default function WorkspaceContacts() {
  const { clientId } = useParams<{ clientId: string }>();
  const { isInternalUser } = useAuth();
  const [clientName, setClientName] = useState<string>('');
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    campaign_id: '',
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

      // Fetch campaigns for the select
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('client_id', clientId)
        .order('name');

      setCampaigns(campaignsData || []);

      // Fetch contacts
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('id, name, company, phone, email, campaign_id, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map campaign names
      const contactsWithCampaigns = (contactsData || []).map((contact) => ({
        ...contact,
        campaign_name: campaignsData?.find((c) => c.id === contact.campaign_id)?.name || null,
      }));

      setContacts(contactsWithCampaigns);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contacts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [clientId]);

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!newContact.name.trim() || !clientId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('contacts').insert({
        name: newContact.name.trim(),
        company: newContact.company.trim() || null,
        phone: newContact.phone.trim() || null,
        email: newContact.email.trim() || null,
        campaign_id: newContact.campaign_id || null,
        client_id: clientId,
      });

      if (error) throw error;

      toast({ title: 'Contact added', description: `${newContact.name} has been added.` });
      setNewContact({ name: '', company: '', phone: '', email: '', campaign_id: '' });
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to add contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to add contact. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns = [
    { header: 'Name', accessor: 'name' as const },
    { header: 'Company', accessor: (row: ContactRow) => row.company || '—' },
    { header: 'Phone', accessor: (row: ContactRow) => row.phone || '—' },
    { header: 'Email', accessor: (row: ContactRow) => row.email || '—' },
    { header: 'Campaign', accessor: (row: ContactRow) => row.campaign_name || '—' },
    {
      header: 'Created',
      accessor: (row: ContactRow) => format(new Date(row.created_at), 'MMM d, yyyy'),
    },
  ];

  return (
    <AppLayout sidebarItems={workspaceSidebarItems(clientId!)} clientName={clientName}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Contacts</h1>
            <p className="text-muted-foreground mt-1">
              Browse and manage prospect contacts.
            </p>
          </div>
          {isInternalUser && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddContact} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Name *</Label>
                    <Input
                      id="contactName"
                      placeholder="Jane Smith"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      placeholder="Acme Inc."
                      value={newContact.company}
                      onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        placeholder="+1 555 123 4567"
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="jane@acme.com"
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campaign">Campaign</Label>
                    <Select
                      value={newContact.campaign_id}
                      onValueChange={(value) => setNewContact({ ...newContact, campaign_id: value })}
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
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Contact'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <DataTable
          columns={columns}
          data={contacts}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={Contact}
              title="No contacts yet"
              description="Add a contact to begin logging calls and meetings."
              action={
                isInternalUser ? (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contact
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
