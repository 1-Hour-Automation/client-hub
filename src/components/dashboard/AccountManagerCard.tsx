import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface AccountManagerCardProps {
  name: string | null;
  email: string | null;
  meetingLink: string | null;
  isLoading: boolean;
}

export function AccountManagerCard({ name, email, meetingLink, isLoading }: AccountManagerCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Your Account Manager</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!name) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Your Account Manager</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">Not yet assigned</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Your Account Manager</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div>
          <p className="font-medium text-foreground">{name}</p>
          {email && (
            <p className="text-sm text-muted-foreground">{email}</p>
          )}
        </div>
        {meetingLink && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            asChild
          >
            <a href={meetingLink} target="_blank" rel="noopener noreferrer">
              Book Review Call
              <ExternalLink className="h-3.5 w-3.5 ml-2" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}