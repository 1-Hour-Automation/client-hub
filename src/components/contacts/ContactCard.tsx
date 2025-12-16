import { Card, CardContent } from '@/components/ui/card';
import { Phone, Mail, Calendar, Building2, Megaphone } from 'lucide-react';
import { format } from 'date-fns';

interface ContactCardProps {
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  campaignName: string | null;
  createdAt: string;
}

export function ContactCard({
  name,
  company,
  phone,
  email,
  campaignName,
  createdAt,
}: ContactCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="space-y-3">
          {/* Name and Company */}
          <div>
            <h3 className="font-semibold text-foreground text-lg">{name}</h3>
            {company && (
              <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                <Building2 className="h-3.5 w-3.5" />
                <span className="text-sm">{company}</span>
              </div>
            )}
          </div>

          {/* Campaign */}
          {campaignName && (
            <div className="flex items-center gap-1.5 text-sm">
              <Megaphone className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">{campaignName}</span>
            </div>
          )}

          {/* Contact Info */}
          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={phone ? 'text-foreground' : 'text-muted-foreground'}>
                {phone || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={email ? 'text-foreground' : 'text-muted-foreground'}>
                {email || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
