import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutGrid, CalendarPlus, UserPlus, FileText } from 'lucide-react';

interface QuickLinksProps {
  clientId: string;
}

export function QuickLinks({ clientId }: QuickLinksProps) {
  const links = [
    {
      label: 'View All Campaigns',
      href: `/workspace/${clientId}/campaigns`,
      icon: LayoutGrid,
    },
    {
      label: 'Book Review Call',
      href: `/workspace/${clientId}/meetings`,
      icon: CalendarPlus,
    },
    {
      label: 'Add New Contact',
      href: `/workspace/${clientId}/contacts`,
      icon: UserPlus,
    },
    {
      label: 'Update ICP',
      href: `/workspace/${clientId}/campaigns`,
      icon: FileText,
    },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 grid-cols-2">
          {links.map((link) => (
            <Button
              key={link.href}
              variant="outline"
              className="justify-start h-auto py-3 px-3"
              asChild
            >
              <Link to={link.href}>
                <link.icon className="h-4 w-4 mr-2 shrink-0" />
                <span className="text-sm">{link.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
