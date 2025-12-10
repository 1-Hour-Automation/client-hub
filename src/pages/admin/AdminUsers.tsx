import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminSidebarItems } from '@/components/layout/Sidebar';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserCog, Shield, Edit, UserPlus, Building2, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

type AppRole = 'admin' | 'bdr' | 'client';

interface UserRow {
  id: string;
  display_name: string | null;
  client_id: string | null;
  client_name: string | null;
  created_at: string;
  roles: AppRole[];
  email: string | null;
}

interface Client {
  id: string;
  name: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('');
  const [inviteClientId, setInviteClientId] = useState<string>('');
  const [workspaceDrawerUser, setWorkspaceDrawerUser] = useState<UserRow | null>(null);
  const { toast } = useToast();

  async function fetchData() {
    try {
      // Fetch clients for the dropdown
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      setClients(clientsData || []);

      // Fetch all user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, client_id, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Get user emails from auth (we need to use the profile id to get email from a different approach)
      // Since we can't query auth.users directly, we'll show display_name or ID
      
      // Map users with their roles and client names
      const usersWithRoles = (profilesData || []).map((profile) => {
        const userRoles = (rolesData || [])
          .filter((r) => r.user_id === profile.id)
          .map((r) => r.role as AppRole);
        const clientName = clientsData?.find((c) => c.id === profile.client_id)?.name || null;

        return {
          ...profile,
          roles: userRoles,
          client_name: clientName,
          email: null, // We don't have direct access to auth.users
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function openEditDialog(user: UserRow) {
    setEditingUser(user);
    setSelectedRoles(user.roles);
    setSelectedClientId(user.client_id || '');
  }

  function closeEditDialog() {
    setEditingUser(null);
    setSelectedRoles([]);
    setSelectedClientId('');
  }

  function toggleRole(role: AppRole) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function handleSaveRoles() {
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      // Get current roles for this user
      const currentRoles = editingUser.roles;
      const rolesToAdd = selectedRoles.filter((r) => !currentRoles.includes(r));
      const rolesToRemove = currentRoles.filter((r) => !selectedRoles.includes(r));

      // Remove old roles
      for (const role of rolesToRemove) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', editingUser.id)
          .eq('role', role);
        if (error) throw error;
      }

      // Add new roles
      for (const role of rolesToAdd) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: editingUser.id, role });
        if (error) throw error;
      }

      // Update client_id if changed
      const newClientId = selectedClientId || null;
      if (newClientId !== editingUser.client_id) {
        const { error } = await supabase
          .from('user_profiles')
          .update({ client_id: newClientId })
          .eq('id', editingUser.id);
        if (error) throw error;
      }

      toast({ title: 'User updated', description: 'Roles and permissions have been saved.' });
      closeEditDialog();
      fetchData();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const getRoleBadges = (roles: AppRole[]) => {
    if (roles.length === 0) {
      return <span className="text-muted-foreground text-sm">No roles</span>;
    }
    return (
      <div className="flex gap-1 flex-wrap">
        {roles.map((role) => (
          <Badge
            key={role}
            variant={role === 'admin' ? 'default' : role === 'bdr' ? 'secondary' : 'outline'}
          >
            {role}
          </Badge>
        ))}
      </div>
    );
  };

  const columns = [
    {
      header: 'User',
      accessor: (row: UserRow) => (
        <div>
          <p className="font-medium">{row.display_name || 'Unnamed User'}</p>
          <p className="text-xs text-muted-foreground">{row.id.slice(0, 8)}...</p>
        </div>
      ),
    },
    {
      header: 'Roles',
      accessor: (row: UserRow) => getRoleBadges(row.roles),
    },
    {
      header: 'Workspaces',
      accessor: (row: UserRow) => {
        const count = row.client_id ? 1 : 0;
        return (
          <button
            onClick={() => setWorkspaceDrawerUser(row)}
            className="text-primary hover:underline font-medium"
          >
            {count}
          </button>
        );
      },
    },
    {
      header: 'Assigned Client',
      accessor: (row: UserRow) => row.client_name || '—',
    },
    {
      header: 'Created',
      accessor: (row: UserRow) => format(new Date(row.created_at), 'MMM d, yyyy'),
    },
    {
      header: 'Actions',
      accessor: (row: UserRow) => (
        <Button variant="outline" size="sm" onClick={() => openEditDialog(row)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Roles
        </Button>
      ),
      className: 'text-right',
    },
  ];

  return (
    <AppLayout sidebarItems={adminSidebarItems}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Assign roles and client access to users.
            </p>
          </div>
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={UserCog}
              title="No users yet"
              description="Users will appear here after they sign up."
            />
          }
        />

        <Dialog open={!!editingUser} onOpenChange={() => closeEditDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Edit User Permissions
              </DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-6">
                <div>
                  <p className="font-medium">{editingUser.display_name || 'Unnamed User'}</p>
                  <p className="text-sm text-muted-foreground">ID: {editingUser.id}</p>
                </div>

                <div className="space-y-3">
                  <Label>Roles</Label>
                  <div className="flex gap-2">
                    {(['admin', 'bdr', 'client'] as AppRole[]).map((role) => (
                      <Button
                        key={role}
                        type="button"
                        variant={selectedRoles.includes(role) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleRole(role)}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Admin & BDR can access all clients. Client users only see their assigned workspace.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Assigned Client</Label>
                  <Select 
                    value={selectedClientId || 'none'} 
                    onValueChange={(val) => setSelectedClientId(val === 'none' ? '' : val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No client assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No client assigned</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Required for client role users to access their workspace.
                  </p>
                </div>

                <Button className="w-full" onClick={handleSaveRoles} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite New User
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  type="text"
                  placeholder="Full name (optional)"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="bdr">BDR</SelectItem>
                    <SelectItem value="am">AM</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assigned Client Workspace</Label>
                <Select value={inviteClientId} onValueChange={setInviteClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Sheet open={!!workspaceDrawerUser} onOpenChange={() => setWorkspaceDrawerUser(null)}>
          <SheetContent side="right" className="w-[400px] sm:w-[480px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Workspaces for {workspaceDrawerUser?.display_name || 'User'}
              </SheetTitle>
            </SheetHeader>
            {workspaceDrawerUser && (
              <div className="mt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Manage workspace assignments</p>
                  <Button size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Workspace
                  </Button>
                </div>

                <div className="space-y-3">
                  {workspaceDrawerUser.client_id && workspaceDrawerUser.client_name ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{workspaceDrawerUser.client_name}</p>
                        <div className="flex gap-1 mt-1">
                          {workspaceDrawerUser.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={role === 'admin' ? 'default' : role === 'bdr' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No workspaces assigned</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
