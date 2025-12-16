import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Megaphone, Search } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Client {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  name: string;
  client_id: string;
  client_name: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { isInternalUser } = useAuth();

  // Only show for internal users
  if (!isInternalUser) return null;

  const fetchData = useCallback(async () => {
    if (!open) return;
    
    setIsLoading(true);
    try {
      const [clientsRes, campaignsRes] = await Promise.all([
        supabase
          .from('clients')
          .select('id, name')
          .order('name'),
        supabase
          .from('campaigns')
          .select('id, name, client_id, clients(name)')
          .is('deleted_at', null)
          .order('name'),
      ]);

      setClients(clientsRes.data || []);
      setCampaigns(
        (campaignsRes.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          client_id: c.client_id,
          client_name: c.clients?.name || 'Unknown',
        }))
      );
    } catch (error) {
      console.error('Failed to fetch search data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [open]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelectClient = (client: Client) => {
    setOpen(false);
    navigate(`/workspace/${client.id}`);
  };

  const handleSelectCampaign = (campaign: Campaign) => {
    setOpen(false);
    navigate(`/workspace/${campaign.client_id}/campaigns/${campaign.id}`);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="relative h-8 w-48 justify-start text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search...
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search clients, campaigns..." />
        <CommandList>
          <CommandEmpty>
            {isLoading ? 'Loading...' : 'No results found.'}
          </CommandEmpty>

          {clients.length > 0 && (
            <CommandGroup heading="Clients">
              {clients.map((client) => (
                <CommandItem
                  key={`client-${client.id}`}
                  value={`client-${client.name}`}
                  onSelect={() => handleSelectClient(client)}
                  className="cursor-pointer"
                >
                  <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{client.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {campaigns.length > 0 && (
            <CommandGroup heading="Campaigns">
              {campaigns.map((campaign) => (
                <CommandItem
                  key={`campaign-${campaign.id}`}
                  value={`campaign-${campaign.name}-${campaign.client_name}`}
                  onSelect={() => handleSelectCampaign(campaign)}
                  className="cursor-pointer"
                >
                  <Megaphone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{campaign.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {campaign.client_name}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
