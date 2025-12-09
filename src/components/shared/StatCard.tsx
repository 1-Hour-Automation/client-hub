import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon?: LucideIcon;
  isLoading?: boolean;
}

export function StatCard({ label, value, subtext, icon: Icon, isLoading }: StatCardProps) {
  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {isLoading ? (
              <div className="h-9 w-20 animate-pulse rounded bg-muted" />
            ) : (
              <p className="text-3xl font-semibold text-foreground">{value}</p>
            )}
            {subtext && (
              <p className="text-xs text-muted-foreground">{subtext}</p>
            )}
          </div>
          {Icon && (
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
