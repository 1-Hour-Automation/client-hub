import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { workspaceSidebarItems } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface CallLog {
  id: string;
  campaign_id: string;
  contact_name: string;
  company: string | null;
  phone_number: string;
  disposition: string;
  call_time: string;
  notes: string | null;
  campaign_name?: string;
}

interface Campaign {
  id: string;
  name: string;
}

const DISPOSITIONS = [
  'Connected',
  'No Answer',
  'Voicemail',
  'Bad Number',
  'Do Not Call',
  'Not Interested',
  'Positive Conversation',
  'Call Back Requested',
];

function getDispositionBadgeVariant(disposition: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (disposition) {
    case 'Connected':
    case 'Positive Conversation':
      return 'default';
    case 'Call Back Requested':
      return 'secondary';
    case 'Bad Number':
    case 'Do Not Call':
    case 'Not Interested':
      return 'destructive';
    default:
      return 'outline';
  }
}

export default function WorkspaceCallLog() {
  const { clientId } = useParams<{ clientId: string }>();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [dispositionFilter, setDispositionFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchCampaigns() {
      if (!clientId) return;
      const { data } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('client_id', clientId)
        .order('name');
      if (data) setCampaigns(data);
    }
    fetchCampaigns();
  }, [clientId]);

  useEffect(() => {
    async function fetchCallLogs() {
      if (!clientId) return;
      setIsLoading(true);
      
      let query = supabase
        .from('call_logs')
        .select('*')
        .eq('client_id', clientId)
        .order('call_time', { ascending: false });

      if (campaignFilter !== 'all') {
        query = query.eq('campaign_id', campaignFilter);
      }

      if (dispositionFilter !== 'all') {
        query = query.eq('disposition', dispositionFilter);
      }

      const { data } = await query;

      if (data) {
        const logsWithCampaignNames = data.map(log => ({
          ...log,
          campaign_name: campaigns.find(c => c.id === log.campaign_id)?.name || 'Unknown Campaign',
        }));
        setCallLogs(logsWithCampaignNames);
      }
      
      setIsLoading(false);
    }

    fetchCallLogs();
  }, [clientId, campaignFilter, dispositionFilter, campaigns]);

  return (
    <AppLayout sidebarItems={workspaceSidebarItems(clientId!)} clientId={clientId}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Call Log</h1>
          <p className="text-muted-foreground">View all calls for this client</p>
        </div>

        <div className="flex gap-4">
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by Campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dispositionFilter} onValueChange={setDispositionFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by Disposition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dispositions</SelectItem>
              {DISPOSITIONS.map((disposition) => (
                <SelectItem key={disposition} value={disposition}>
                  {disposition}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : callLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No call logs found matching your filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Disposition</TableHead>
                  <TableHead>Call Time</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.campaign_name}</TableCell>
                    <TableCell>{log.contact_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.company || '—'}
                    </TableCell>
                    <TableCell>{log.phone_number}</TableCell>
                    <TableCell>
                      <Badge variant={getDispositionBadgeVariant(log.disposition)}>
                        {log.disposition}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(log.call_time), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {log.notes || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
