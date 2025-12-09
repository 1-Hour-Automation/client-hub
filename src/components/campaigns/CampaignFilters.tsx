import { cn } from '@/lib/utils';

type FilterStatus = 'all' | 'active' | 'pending' | 'paused' | 'completed';

interface CampaignFiltersProps {
  activeFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
}

const filters: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

export function CampaignFilters({ activeFilter, onFilterChange }: CampaignFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            'px-4 py-1.5 text-sm font-medium rounded-full transition-colors',
            activeFilter === filter.value
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

export type { FilterStatus };
