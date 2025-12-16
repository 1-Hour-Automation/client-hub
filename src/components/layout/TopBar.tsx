import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Phone } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';

interface TopBarProps {
  clientName?: string;
}

export function TopBar({ clientName }: TopBarProps) {
  const { user, roles, signOut } = useAuth();

  const displayRole = roles.length > 0 ? roles[0] : 'user';
  const roleLabel = displayRole.charAt(0).toUpperCase() + displayRole.slice(1);

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Phone className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg text-foreground">CallFlow Portal</span>
        </div>
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-4">
        {clientName && (
          <span className="text-sm text-muted-foreground">
            Viewing: <span className="font-medium text-foreground">{clientName}</span>
          </span>
        )}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
          <span className="text-xs font-medium text-secondary-foreground">{roleLabel}</span>
        </div>
        <span className="text-sm text-muted-foreground">{user?.email}</span>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
