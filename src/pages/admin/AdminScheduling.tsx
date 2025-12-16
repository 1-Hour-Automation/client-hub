import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminSidebarItems } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Clock, Trash2, Settings2, Loader2, Building2 } from 'lucide-react';

interface EventType {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  slug: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

interface Assignment {
  client_id: string;
  client_name: string;
  is_active: boolean;
}

export default function AdminScheduling() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEventType, setNewEventType] = useState({
    title: '',
    description: '',
    duration: '30',
    slug: '',
  });

  async function fetchData() {
    setIsLoading(true);
    try {
      const [eventTypesRes, clientsRes] = await Promise.all([
        supabase.from('event_types').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('id, name').order('name'),
      ]);

      if (eventTypesRes.error) throw eventTypesRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setEventTypes(eventTypesRes.data || []);
      setClients(clientsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scheduling data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchAssignments(eventTypeId: string) {
    try {
      const { data, error } = await supabase
        .from('event_type_assignments')
        .select('client_id, is_active')
        .eq('event_type_id', eventTypeId);

      if (error) throw error;

      const assignedClientIds = new Set((data || []).map(a => a.client_id));
      const assignmentList = clients.map(client => ({
        client_id: client.id,
        client_name: client.name,
        is_active: assignedClientIds.has(client.id),
      }));

      setAssignments(assignmentList);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async function handleCreateEventType(e: React.FormEvent) {
    e.preventDefault();
    if (!newEventType.title.trim()) return;

    setIsSubmitting(true);
    try {
      const slug = newEventType.slug || generateSlug(newEventType.title);
      
      const { error } = await supabase.from('event_types').insert({
        title: newEventType.title.trim(),
        description: newEventType.description.trim() || null,
        duration: parseInt(newEventType.duration),
        slug,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({ title: 'Event type created', description: `${newEventType.title} has been created.` });
      setNewEventType({ title: '', description: '', duration: '30', slug: '' });
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Failed to create event type:', error);
      toast({
        title: 'Error',
        description: error.message?.includes('duplicate') 
          ? 'An event type with this slug already exists.' 
          : 'Failed to create event type.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteEventType(id: string) {
    try {
      const { error } = await supabase.from('event_types').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Event type deleted' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete event type:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event type.',
        variant: 'destructive',
      });
    }
  }

  async function handleToggleAssignment(clientId: string, isActive: boolean) {
    if (!selectedEventType) return;

    try {
      if (isActive) {
        // Add assignment
        const { error } = await supabase.from('event_type_assignments').insert({
          event_type_id: selectedEventType.id,
          client_id: clientId,
          is_active: true,
        });
        if (error) throw error;
      } else {
        // Remove assignment
        const { error } = await supabase
          .from('event_type_assignments')
          .delete()
          .eq('event_type_id', selectedEventType.id)
          .eq('client_id', clientId);
        if (error) throw error;
      }

      setAssignments(prev =>
        prev.map(a =>
          a.client_id === clientId ? { ...a, is_active: isActive } : a
        )
      );
    } catch (error) {
      console.error('Failed to update assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update client assignment.',
        variant: 'destructive',
      });
    }
  }

  function openAssignmentDialog(eventType: EventType) {
    setSelectedEventType(eventType);
    fetchAssignments(eventType.id);
    setIsAssignmentDialogOpen(true);
  }

  const durationOptions = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '60 minutes' },
  ];

  return (
    <AppLayout sidebarItems={adminSidebarItems}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Scheduling Management</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage meeting event types for client workspaces.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Event Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Event Type</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEventType} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Discovery Call"
                    value={newEventType.title}
                    onChange={(e) => {
                      setNewEventType({
                        ...newEventType,
                        title: e.target.value,
                        slug: generateSlug(e.target.value),
                      });
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    placeholder="discovery-call"
                    value={newEventType.slug}
                    onChange={(e) => setNewEventType({ ...newEventType, slug: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    The URL will be: /book/[client-id]/{newEventType.slug || 'slug'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <Select
                    value={newEventType.duration}
                    onValueChange={(value) => setNewEventType({ ...newEventType, duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="A brief introductory call to discuss your needs..."
                    value={newEventType.description}
                    onChange={(e) => setNewEventType({ ...newEventType, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Event Type'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : eventTypes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No event types yet</h3>
              <p className="text-muted-foreground text-sm mt-1 text-center">
                Create your first event type to start generating booking links for clients.
              </p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Event Type
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {eventTypes.map((eventType) => (
              <Card key={eventType.id} className="glass-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{eventType.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {eventType.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {eventType.duration}m
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                      /book/[client]/{eventType.slug}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openAssignmentDialog(eventType)}
                    >
                      <Building2 className="h-4 w-4 mr-1" />
                      Assign Clients
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEventType(eventType.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Client Assignment Dialog */}
        <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign to Clients</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Select which clients can use "{selectedEventType?.title}"
              </p>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {assignments.map((assignment) => (
                <div
                  key={assignment.client_id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    id={assignment.client_id}
                    checked={assignment.is_active}
                    onCheckedChange={(checked) =>
                      handleToggleAssignment(assignment.client_id, checked === true)
                    }
                  />
                  <Label
                    htmlFor={assignment.client_id}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {assignment.client_name}
                  </Label>
                </div>
              ))}
              {clients.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No clients available
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
