import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Json } from '@/integrations/supabase/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Plus, X, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { CalendarIntegrationCard } from '@/components/integrations/CalendarIntegrationCard';

interface SecondaryContact {
  name: string;
  email: string;
  phone: string;
}

interface TeamMember {
  name: string;
  email: string;
}

interface PhaseHistoryEntry {
  phase: string;
  date: string;
  updatedBy: string;
}

interface AccountData {
  account_manager: string | null;
  bdr_assigned: string | null;
  campaign_start_date: string | null;
  calling_timezone: string | null;
  calling_hours: string | null;
  sending_email_address: string | null;
  current_plan: string | null;
  performance_tier: string | null;
  quarterly_attendance_guarantee: number | null;
  phase_history: PhaseHistoryEntry[];
  last_updated_by: string | null;
  last_updated_at: string | null;
}

interface ClientData {
  name: string;
  legal_business_name: string | null;
  website: string | null;
  registered_address: string | null;
  billing_address: string | null;
  primary_contact_name: string | null;
  primary_contact_title: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  billing_contact_name: string | null;
  billing_contact_email: string | null;
  billing_contact_phone: string | null;
  invoice_method: string | null;
  billing_notes: string | null;
  secondary_contacts: SecondaryContact[];
  team_members_with_access: TeamMember[];
  registration_number: string | null;
  vat_number: string | null;
  preferred_currency: string | null;
  invoicing_frequency: string | null;
  preferred_channel: string | null;
  meeting_link: string | null;
  best_times: string | null;
  timezone: string | null;
  client_notes: string | null;
}

export default function WorkspaceAccountProfile() {
  const { clientId } = useParams<{ clientId: string }>();
  const { toast } = useToast();
  const { isInternalUser, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarProvider, setCalendarProvider] = useState<string | null>(null);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [watchedCalendars, setWatchedCalendars] = useState<string[]>([]);
  const [accountData, setAccountData] = useState<AccountData>({
    account_manager: null,
    bdr_assigned: null,
    campaign_start_date: null,
    calling_timezone: null,
    calling_hours: null,
    sending_email_address: null,
    current_plan: null,
    performance_tier: null,
    quarterly_attendance_guarantee: null,
    phase_history: [],
    last_updated_by: null,
    last_updated_at: null,
  });
  const [clientData, setClientData] = useState<ClientData>({
    name: '',
    legal_business_name: null,
    website: null,
    registered_address: null,
    billing_address: null,
    primary_contact_name: null,
    primary_contact_title: null,
    primary_contact_email: null,
    primary_contact_phone: null,
    billing_contact_name: null,
    billing_contact_email: null,
    billing_contact_phone: null,
    invoice_method: null,
    billing_notes: null,
    secondary_contacts: [],
    team_members_with_access: [],
    registration_number: null,
    vat_number: null,
    preferred_currency: 'GBP',
    invoicing_frequency: 'monthly',
    preferred_channel: null,
    meeting_link: null,
    best_times: null,
    timezone: null,
    client_notes: null,
  });

  useEffect(() => {
    async function fetchClient() {
      if (!clientId) return;
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();

      if (error) {
        toast({ title: 'Error loading client', description: error.message, variant: 'destructive' });
        return;
      }

      if (data) {
        setClientData({
          name: data.name || '',
          legal_business_name: data.legal_business_name,
          website: data.website,
          registered_address: data.registered_address,
          billing_address: data.billing_address,
          primary_contact_name: data.primary_contact_name,
          primary_contact_title: data.primary_contact_title,
          primary_contact_email: data.primary_contact_email,
          primary_contact_phone: data.primary_contact_phone,
          billing_contact_name: data.billing_contact_name,
          billing_contact_email: data.billing_contact_email,
          billing_contact_phone: data.billing_contact_phone,
          invoice_method: data.invoice_method,
          billing_notes: data.billing_notes,
          secondary_contacts: (data.secondary_contacts as unknown as SecondaryContact[]) || [],
          team_members_with_access: (data.team_members_with_access as unknown as TeamMember[]) || [],
          registration_number: data.registration_number,
          vat_number: data.vat_number,
          preferred_currency: data.preferred_currency || 'GBP',
          invoicing_frequency: data.invoicing_frequency || 'monthly',
          preferred_channel: data.preferred_channel,
          meeting_link: data.meeting_link,
          best_times: data.best_times,
          timezone: data.timezone,
          client_notes: data.client_notes,
        });
        
        setAccountData({
          account_manager: data.account_manager,
          bdr_assigned: data.bdr_assigned,
          campaign_start_date: data.campaign_start_date,
          calling_timezone: data.calling_timezone,
          calling_hours: data.calling_hours,
          sending_email_address: data.sending_email_address,
          current_plan: data.current_plan,
          performance_tier: data.performance_tier,
          quarterly_attendance_guarantee: data.quarterly_attendance_guarantee,
          phase_history: (data.phase_history as unknown as PhaseHistoryEntry[]) || [],
          last_updated_by: data.last_updated_by,
          last_updated_at: data.last_updated_at,
        });
        
        // Open billing section if any billing data exists
        if (data.billing_contact_name || data.billing_contact_email || data.billing_contact_phone || data.invoice_method || data.billing_notes) {
          setBillingOpen(true);
        }
        
        // Set calendar integration data
        setCalendarConnected(data.calendar_connected || false);
        setCalendarProvider(data.calendar_provider || null);
        setSyncEnabled(data.sync_enabled || false);
        setLastSyncedAt(data.last_synced_at || null);
        setWatchedCalendars(Array.isArray(data.watched_calendars) ? (data.watched_calendars as string[]) : []);
      }
      setIsLoading(false);
    }

    fetchClient();
  }, [clientId, toast]);

  const updateField = (field: keyof ClientData, value: string | null) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  };

  const updateAccountField = (field: keyof AccountData, value: string | number | null) => {
    setAccountData(prev => ({ ...prev, [field]: value }));
  };

  const addSecondaryContact = () => {
    setClientData(prev => ({
      ...prev,
      secondary_contacts: [...prev.secondary_contacts, { name: '', email: '', phone: '' }]
    }));
  };

  const removeSecondaryContact = (index: number) => {
    setClientData(prev => ({
      ...prev,
      secondary_contacts: prev.secondary_contacts.filter((_, i) => i !== index)
    }));
  };

  const updateSecondaryContact = (index: number, field: keyof SecondaryContact, value: string) => {
    setClientData(prev => ({
      ...prev,
      secondary_contacts: prev.secondary_contacts.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const addTeamMember = () => {
    setClientData(prev => ({
      ...prev,
      team_members_with_access: [...prev.team_members_with_access, { name: '', email: '' }]
    }));
  };

  const removeTeamMember = (index: number) => {
    setClientData(prev => ({
      ...prev,
      team_members_with_access: prev.team_members_with_access.filter((_, i) => i !== index)
    }));
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    setClientData(prev => ({
      ...prev,
      team_members_with_access: prev.team_members_with_access.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  const handleSave = async () => {
    if (!clientId) return;
    setIsSaving(true);

    const updatePayload: Record<string, unknown> = {
      name: clientData.name,
      legal_business_name: clientData.legal_business_name || null,
      website: clientData.website || null,
      registered_address: clientData.registered_address || null,
      billing_address: clientData.billing_address || null,
      primary_contact_name: clientData.primary_contact_name || null,
      primary_contact_title: clientData.primary_contact_title || null,
      primary_contact_email: clientData.primary_contact_email || null,
      primary_contact_phone: clientData.primary_contact_phone || null,
      billing_contact_name: clientData.billing_contact_name || null,
      billing_contact_email: clientData.billing_contact_email || null,
      billing_contact_phone: clientData.billing_contact_phone || null,
      invoice_method: clientData.invoice_method || null,
      billing_notes: clientData.billing_notes || null,
      secondary_contacts: clientData.secondary_contacts as unknown as Json,
      team_members_with_access: clientData.team_members_with_access as unknown as Json,
      registration_number: clientData.registration_number || null,
      vat_number: clientData.vat_number || null,
      preferred_currency: clientData.preferred_currency || 'GBP',
      invoicing_frequency: clientData.invoicing_frequency || 'monthly',
      preferred_channel: clientData.preferred_channel || null,
      meeting_link: clientData.meeting_link || null,
      best_times: clientData.best_times || null,
      timezone: clientData.timezone || null,
      client_notes: clientData.client_notes || null,
    };

    // Add account fields only for internal users
    if (isInternalUser) {
      updatePayload.account_manager = accountData.account_manager || null;
      updatePayload.bdr_assigned = accountData.bdr_assigned || null;
      updatePayload.campaign_start_date = accountData.campaign_start_date || null;
      updatePayload.calling_timezone = accountData.calling_timezone || null;
      updatePayload.calling_hours = accountData.calling_hours || null;
      updatePayload.sending_email_address = accountData.sending_email_address || null;
      updatePayload.current_plan = accountData.current_plan || null;
      updatePayload.performance_tier = accountData.performance_tier || null;
      updatePayload.quarterly_attendance_guarantee = accountData.quarterly_attendance_guarantee || null;
      updatePayload.phase_history = accountData.phase_history as unknown as Json;
      updatePayload.last_updated_by = profile?.display_name || 'Unknown';
      updatePayload.last_updated_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('clients')
      .update(updatePayload)
      .eq('id', clientId);

    setIsSaving(false);

    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      if (isInternalUser) {
        setAccountData(prev => ({
          ...prev,
          last_updated_by: profile?.display_name || 'Unknown',
          last_updated_at: new Date().toISOString(),
        }));
      }
      toast({ title: 'Saved successfully' });
    }
  };

  if (isLoading) {
    return (
      <AppLayout sidebarItems={workspaceSidebarItems(clientId || '')} clientId={clientId || undefined}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout sidebarItems={workspaceSidebarItems(clientId || '')} clientId={clientId || undefined}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Account Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account and client information
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Company Details</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      value={clientData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>
                  {(clientData.legal_business_name !== null || true) && (
                    <div className="space-y-2">
                      <Label htmlFor="legal_name">Legal Business Name</Label>
                      <Input
                        id="legal_name"
                        value={clientData.legal_business_name || ''}
                        onChange={(e) => updateField('legal_business_name', e.target.value)}
                        placeholder="Legal registered name (if different)"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={clientData.website || ''}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registered_address">Registered Address</Label>
                    <Textarea
                      id="registered_address"
                      value={clientData.registered_address || ''}
                      onChange={(e) => updateField('registered_address', e.target.value)}
                      placeholder="Company registered address"
                      rows={2}
                    />
                  </div>
                  {(clientData.billing_address !== null || true) && (
                    <div className="space-y-2">
                      <Label htmlFor="billing_address">Billing Address</Label>
                      <Textarea
                        id="billing_address"
                        value={clientData.billing_address || ''}
                        onChange={(e) => updateField('billing_address', e.target.value)}
                        placeholder="Billing address (if different)"
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Primary Contact */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Primary Contact</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primary_name">Full Name</Label>
                    <Input
                      id="primary_name"
                      value={clientData.primary_contact_name || ''}
                      onChange={(e) => updateField('primary_contact_name', e.target.value)}
                      placeholder="Contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primary_title">Job Title</Label>
                    <Input
                      id="primary_title"
                      value={clientData.primary_contact_title || ''}
                      onChange={(e) => updateField('primary_contact_title', e.target.value)}
                      placeholder="Job title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primary_email">Email</Label>
                    <Input
                      id="primary_email"
                      type="email"
                      value={clientData.primary_contact_email || ''}
                      onChange={(e) => updateField('primary_contact_email', e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primary_phone">Phone</Label>
                    <Input
                      id="primary_phone"
                      value={clientData.primary_contact_phone || ''}
                      onChange={(e) => updateField('primary_contact_phone', e.target.value)}
                      placeholder="+44 1234 567890"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Contact (Collapsible) */}
              <Collapsible open={billingOpen} onOpenChange={setBillingOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                    <span className="text-sm font-medium">Billing Contact</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${billingOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="billing_name">Name</Label>
                      <Input
                        id="billing_name"
                        value={clientData.billing_contact_name || ''}
                        onChange={(e) => updateField('billing_contact_name', e.target.value)}
                        placeholder="Billing contact name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing_email">Email</Label>
                      <Input
                        id="billing_email"
                        type="email"
                        value={clientData.billing_contact_email || ''}
                        onChange={(e) => updateField('billing_contact_email', e.target.value)}
                        placeholder="billing@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing_phone">Phone</Label>
                      <Input
                        id="billing_phone"
                        value={clientData.billing_contact_phone || ''}
                        onChange={(e) => updateField('billing_contact_phone', e.target.value)}
                        placeholder="+44 1234 567890"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoice_method">Invoice Method</Label>
                      <Select
                        value={clientData.invoice_method || ''}
                        onValueChange={(value) => updateField('invoice_method', value)}
                      >
                        <SelectTrigger id="invoice_method">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="post">Post</SelectItem>
                          <SelectItem value="portal">Portal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing_notes">Billing Notes</Label>
                    <Textarea
                      id="billing_notes"
                      value={clientData.billing_notes || ''}
                      onChange={(e) => updateField('billing_notes', e.target.value)}
                      placeholder="Any billing-related notes..."
                      rows={2}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Additional Contacts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Secondary Contacts</h3>
                  <Button variant="outline" size="sm" onClick={addSecondaryContact}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                {clientData.secondary_contacts.map((contact, index) => (
                  <div key={index} className="grid gap-3 sm:grid-cols-4 items-end p-3 border rounded-lg">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={contact.name}
                        onChange={(e) => updateSecondaryContact(index, 'name', e.target.value)}
                        placeholder="Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateSecondaryContact(index, 'email', e.target.value)}
                        placeholder="Email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={contact.phone}
                        onChange={(e) => updateSecondaryContact(index, 'phone', e.target.value)}
                        placeholder="Phone"
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeSecondaryContact(index)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Team Members */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Team Members With Portal Access</h3>
                  <Button variant="outline" size="sm" onClick={addTeamMember}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                {clientData.team_members_with_access.map((member, index) => (
                  <div key={index} className="grid gap-3 sm:grid-cols-3 items-end p-3 border rounded-lg">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={member.name}
                        onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                        placeholder="Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={member.email}
                        onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                        placeholder="Email"
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeTeamMember(index)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Business Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Business Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(clientData.registration_number !== null || true) && (
                    <div className="space-y-2">
                      <Label htmlFor="reg_number">Registration Number</Label>
                      <Input
                        id="reg_number"
                        value={clientData.registration_number || ''}
                        onChange={(e) => updateField('registration_number', e.target.value)}
                        placeholder="Company registration number"
                      />
                    </div>
                  )}
                  {(clientData.vat_number !== null || true) && (
                    <div className="space-y-2">
                      <Label htmlFor="vat_number">VAT Number</Label>
                      <Input
                        id="vat_number"
                        value={clientData.vat_number || ''}
                        onChange={(e) => updateField('vat_number', e.target.value)}
                        placeholder="VAT registration number"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="currency">Preferred Currency</Label>
                    <Select
                      value={clientData.preferred_currency || 'GBP'}
                      onValueChange={(value) => updateField('preferred_currency', value)}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Invoicing Frequency</Label>
                    <Select
                      value={clientData.invoicing_frequency || 'monthly'}
                      onValueChange={(value) => updateField('invoicing_frequency', value)}
                    >
                      <SelectTrigger id="frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Communication Preferences */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Communication Preferences</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="channel">Preferred Channel</Label>
                    <Select
                      value={clientData.preferred_channel || ''}
                      onValueChange={(value) => updateField('preferred_channel', value)}
                    >
                      <SelectTrigger id="channel">
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="slack">Slack</SelectItem>
                        <SelectItem value="teams">Microsoft Teams</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={clientData.timezone || ''}
                      onValueChange={(value) => updateField('timezone', value)}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/London">UK (GMT/BST)</SelectItem>
                        <SelectItem value="America/New_York">US Eastern</SelectItem>
                        <SelectItem value="America/Los_Angeles">US Pacific</SelectItem>
                        <SelectItem value="Europe/Paris">Central European</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meeting_link">Meeting Link</Label>
                    <Input
                      id="meeting_link"
                      value={clientData.meeting_link || ''}
                      onChange={(e) => updateField('meeting_link', e.target.value)}
                      placeholder="https://calendly.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="best_times">Best Times to Reach</Label>
                    <Input
                      id="best_times"
                      value={clientData.best_times || ''}
                      onChange={(e) => updateField('best_times', e.target.value)}
                      placeholder="e.g., Mornings, 9am-12pm"
                    />
                  </div>
                </div>
              </div>

              {/* Client Notes */}
              <div className="space-y-2">
                <Label htmlFor="client_notes">Client Notes</Label>
                <Textarea
                  id="client_notes"
                  value={clientData.client_notes || ''}
                  onChange={(e) => updateField('client_notes', e.target.value)}
                  placeholder="Any additional notes about this client..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Account Management */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Account Management</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="account_manager">Account Manager</Label>
                    <Input
                      id="account_manager"
                      value={accountData.account_manager || ''}
                      onChange={(e) => updateAccountField('account_manager', e.target.value)}
                      placeholder="Account manager name"
                      disabled={!isInternalUser}
                      className={!isInternalUser ? 'bg-muted' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bdr_assigned">BDR Assigned</Label>
                    <Input
                      id="bdr_assigned"
                      value={accountData.bdr_assigned || ''}
                      onChange={(e) => updateAccountField('bdr_assigned', e.target.value)}
                      placeholder="BDR name"
                      disabled={!isInternalUser}
                      className={!isInternalUser ? 'bg-muted' : ''}
                    />
                  </div>
                </div>
              </div>

              {/* Campaign Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Campaign Settings</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="campaign_start_date">Campaign Start Date</Label>
                    <Input
                      id="campaign_start_date"
                      type="date"
                      value={accountData.campaign_start_date || ''}
                      onChange={(e) => updateAccountField('campaign_start_date', e.target.value)}
                      disabled={!isInternalUser}
                      className={!isInternalUser ? 'bg-muted' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calling_timezone">Calling Timezone</Label>
                    <Select
                      value={accountData.calling_timezone || ''}
                      onValueChange={(value) => updateAccountField('calling_timezone', value)}
                      disabled={!isInternalUser}
                    >
                      <SelectTrigger id="calling_timezone" className={!isInternalUser ? 'bg-muted' : ''}>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/London">UK (GMT/BST)</SelectItem>
                        <SelectItem value="America/New_York">US Eastern</SelectItem>
                        <SelectItem value="America/Los_Angeles">US Pacific</SelectItem>
                        <SelectItem value="Europe/Paris">Central European</SelectItem>
                        <SelectItem value="Asia/Singapore">Singapore</SelectItem>
                        <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calling_hours">Calling Hours</Label>
                    <Input
                      id="calling_hours"
                      value={accountData.calling_hours || ''}
                      onChange={(e) => updateAccountField('calling_hours', e.target.value)}
                      placeholder="e.g., 9am - 5pm"
                      disabled={!isInternalUser}
                      className={!isInternalUser ? 'bg-muted' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sending_email">Sending Email Address</Label>
                    <Input
                      id="sending_email"
                      type="email"
                      value={accountData.sending_email_address || ''}
                      onChange={(e) => updateAccountField('sending_email_address', e.target.value)}
                      placeholder="outreach@domain.com"
                      disabled={!isInternalUser}
                      className={!isInternalUser ? 'bg-muted' : ''}
                    />
                  </div>
                </div>
              </div>

              {/* Plan & Performance */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Plan & Performance</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="current_plan">Current Plan</Label>
                    <Select
                      value={accountData.current_plan || ''}
                      onValueChange={(value) => updateAccountField('current_plan', value)}
                      disabled={!isInternalUser}
                    >
                      <SelectTrigger id="current_plan" className={!isInternalUser ? 'bg-muted' : ''}>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sprint">Sprint</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="performance_tier">Performance Tier</Label>
                    <Select
                      value={accountData.performance_tier || ''}
                      onValueChange={(value) => updateAccountField('performance_tier', value)}
                      disabled={!isInternalUser}
                    >
                      <SelectTrigger id="performance_tier" className={!isInternalUser ? 'bg-muted' : ''}>
                        <SelectValue placeholder="Select tier (if applicable)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tier_1">Tier 1</SelectItem>
                        <SelectItem value="tier_2">Tier 2</SelectItem>
                        <SelectItem value="tier_3">Tier 3</SelectItem>
                        <SelectItem value="tier_4">Tier 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quarterly_guarantee">Quarterly Attendance Guarantee</Label>
                    <Input
                      id="quarterly_guarantee"
                      type="number"
                      value={accountData.quarterly_attendance_guarantee || ''}
                      onChange={(e) => updateAccountField('quarterly_attendance_guarantee', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Number of meetings"
                      disabled={!isInternalUser}
                      className={!isInternalUser ? 'bg-muted' : ''}
                    />
                  </div>
                </div>
              </div>

              {/* Phase History */}
              {accountData.phase_history.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">Phase History</h3>
                  <div className="space-y-2">
                    {accountData.phase_history.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                        <span className="font-medium">{entry.phase}</span>
                        <span className="text-muted-foreground">
                          {entry.date} • {entry.updatedBy}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Updated */}
              {accountData.last_updated_at && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Last updated by <span className="font-medium text-foreground">{accountData.last_updated_by || 'Unknown'}</span>
                    {' '}on {format(new Date(accountData.last_updated_at), 'PPp')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Integrations Section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Integrations</h2>
          {clientId && (
            <CalendarIntegrationCard
              clientId={clientId}
              calendarConnected={calendarConnected}
              calendarProvider={calendarProvider}
              syncEnabled={syncEnabled}
              lastSyncedAt={lastSyncedAt}
              watchedCalendars={watchedCalendars}
              onUpdate={(data) => {
                setCalendarConnected(data.connected);
                setCalendarProvider(data.provider);
                setSyncEnabled(data.syncEnabled);
                setLastSyncedAt(data.lastSyncedAt);
                setWatchedCalendars(data.watchedCalendars);
              }}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
