import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Copy, ExternalLink, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EventType {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  slug: string;
}

interface BookingLinksViewProps {
  clientId: string;
}

export function BookingLinksView({ clientId }: BookingLinksViewProps) {
  const { toast } = useToast();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignedEventTypes() {
      try {
        const { data, error } = await supabase
          .from('event_type_assignments')
          .select(`
            event_type_id,
            event_types (
              id,
              title,
              description,
              duration,
              slug
            )
          `)
          .eq('client_id', clientId)
          .eq('is_active', true);

        if (error) throw error;

        const types = (data || [])
          .map((assignment: any) => assignment.event_types)
          .filter(Boolean);

        setEventTypes(types);
      } catch (error) {
        console.error('Failed to fetch event types:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssignedEventTypes();
  }, [clientId]);

  const getBookingUrl = (slug: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/book/${clientId}/${slug}`;
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied', description: 'Booking link copied to clipboard.' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (eventTypes.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No booking links available</h3>
          <p className="text-muted-foreground text-sm mt-1 text-center max-w-sm">
            Your account manager will set up booking links for your workspace. Contact them for more information.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {eventTypes.map((eventType) => {
        const bookingUrl = getBookingUrl(eventType.slug);
        return (
          <Card key={eventType.id} className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-foreground">{eventType.title}</h3>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {eventType.duration}m
                </Badge>
              </div>
              {eventType.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {eventType.description}
                </p>
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <code className="text-xs flex-1 truncate text-muted-foreground">
                    {bookingUrl}
                  </code>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => copyToClipboard(bookingUrl)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(bookingUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
