import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    <Tabs value={activeFilter} onValueChange={(value) => onFilterChange(value as FilterStatus)}>
      <TabsList>
        {filters.map((filter) => (
          <TabsTrigger key={filter.value} value={filter.value}>
            {filter.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export type { FilterStatus };
