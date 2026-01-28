import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Globe, Mail, Phone, User } from 'lucide-react';

export default function WorkspaceClientInfo() {
  const { clientId } = useParams<{ clientId: string }>();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  return (
    <AppLayout 
      sidebarItems={workspaceSidebarItems(clientId || '')} 
      clientName={client?.name}
      clientId={clientId}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Client Info</h1>
          <p className="text-muted-foreground mt-1">
            Your company details and account information (read-only).
          </p>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-32 bg-muted rounded-lg" />
          </div>
        ) : client ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Details
                </CardTitle>
                <CardDescription>Your registered business information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Company Name</p>
                  <p className="font-medium">{client.name}</p>
                </div>
                {client.legal_business_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Legal Business Name</p>
                    <p className="font-medium">{client.legal_business_name}</p>
                  </div>
                )}
                {client.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={client.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {client.website}
                    </a>
                  </div>
                )}
                {client.registered_address && (
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{client.registered_address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Primary Contact
                </CardTitle>
                <CardDescription>Main point of contact for your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.primary_contact_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{client.primary_contact_name}</p>
                    {client.primary_contact_title && (
                      <p className="text-sm text-muted-foreground">{client.primary_contact_title}</p>
                    )}
                  </div>
                )}
                {client.primary_contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${client.primary_contact_email}`}
                      className="text-primary hover:underline"
                    >
                      {client.primary_contact_email}
                    </a>
                  </div>
                )}
                {client.primary_contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{client.primary_contact_phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Account Manager</CardTitle>
                <CardDescription>Your dedicated point of contact</CardDescription>
              </CardHeader>
              <CardContent>
                {client.account_manager ? (
                  <p className="font-medium">{client.account_manager}</p>
                ) : (
                  <p className="text-muted-foreground">Not yet assigned</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Unable to load client information.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
