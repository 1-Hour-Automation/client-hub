import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  tier: z.string().min(1, 'Tier is required'),
  quarterly_attended_meeting_guarantee: z.coerce.number().min(1, 'Enter a valid number'),
  performance_fee_per_meeting: z.coerce.number().min(0, 'Enter a valid number'),
  performance_start_date: z.date({ required_error: 'Start date is required' }),
  internal_notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SprintCampaign {
  id: string;
  name: string;
  client_id: string;
  target: string | null;
  onboarding_target_job_titles: string | null;
  onboarding_industries_to_target: string | null;
  onboarding_company_size_range: string | null;
  onboarding_required_skills: string | null;
  onboarding_locations_to_target: string | null;
  onboarding_excluded_industries: string | null;
  onboarding_example_ideal_companies: string | null;
  onboarding_value_proposition: string | null;
  onboarding_key_pain_points: string | null;
  onboarding_unique_differentiator: string | null;
  onboarding_example_messaging: string | null;
  onboarding_common_objections: string | null;
  onboarding_recommended_responses: string | null;
  onboarding_compliance_notes: string | null;
  onboarding_qualified_prospect_definition: string | null;
  onboarding_disqualifying_factors: string | null;
  onboarding_scheduling_link: string | null;
  onboarding_target_timezone: string | null;
  onboarding_booking_instructions: string | null;
  onboarding_bdr_notes: string | null;
}

interface CreatePerformancePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprintCampaign: SprintCampaign;
}

export function CreatePerformancePlanModal({
  open,
  onOpenChange,
  sprintCampaign,
}: CreatePerformancePlanModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tier: '',
      quarterly_attended_meeting_guarantee: 0,
      performance_fee_per_meeting: 0,
      internal_notes: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      // Create new Performance campaign
      const { data: newCampaign, error: createError } = await supabase
        .from('campaigns')
        .insert({
          name: `${sprintCampaign.name} - Performance Plan`,
          client_id: sprintCampaign.client_id,
          target: sprintCampaign.target,
          phase: 'performance',
          status: 'active',
          tier: values.tier,
          quarterly_attended_meeting_guarantee: values.quarterly_attended_meeting_guarantee,
          performance_fee_per_meeting: values.performance_fee_per_meeting,
          performance_start_date: format(values.performance_start_date, 'yyyy-MM-dd'),
          internal_notes: values.internal_notes || null,
          sprint_campaign_id: sprintCampaign.id,
          // Copy onboarding data (Script & Playbook, Data & ICP)
          onboarding_target_job_titles: sprintCampaign.onboarding_target_job_titles,
          onboarding_industries_to_target: sprintCampaign.onboarding_industries_to_target,
          onboarding_company_size_range: sprintCampaign.onboarding_company_size_range,
          onboarding_required_skills: sprintCampaign.onboarding_required_skills,
          onboarding_locations_to_target: sprintCampaign.onboarding_locations_to_target,
          onboarding_excluded_industries: sprintCampaign.onboarding_excluded_industries,
          onboarding_example_ideal_companies: sprintCampaign.onboarding_example_ideal_companies,
          onboarding_value_proposition: sprintCampaign.onboarding_value_proposition,
          onboarding_key_pain_points: sprintCampaign.onboarding_key_pain_points,
          onboarding_unique_differentiator: sprintCampaign.onboarding_unique_differentiator,
          onboarding_example_messaging: sprintCampaign.onboarding_example_messaging,
          onboarding_common_objections: sprintCampaign.onboarding_common_objections,
          onboarding_recommended_responses: sprintCampaign.onboarding_recommended_responses,
          onboarding_compliance_notes: sprintCampaign.onboarding_compliance_notes,
          onboarding_qualified_prospect_definition: sprintCampaign.onboarding_qualified_prospect_definition,
          onboarding_disqualifying_factors: sprintCampaign.onboarding_disqualifying_factors,
          onboarding_scheduling_link: sprintCampaign.onboarding_scheduling_link,
          onboarding_target_timezone: sprintCampaign.onboarding_target_timezone,
          onboarding_booking_instructions: sprintCampaign.onboarding_booking_instructions,
          onboarding_bdr_notes: sprintCampaign.onboarding_bdr_notes,
          onboarding_completed_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createError) throw createError;

      // Mark original Sprint campaign as completed
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ status: 'completed' })
        .eq('id', sprintCampaign.id);

      if (updateError) throw updateError;

      toast({
        title: 'Performance Plan Created',
        description: 'The sprint has been completed and a new performance campaign has been created.',
      });

      onOpenChange(false);
      navigate(`/workspace/${sprintCampaign.client_id}/campaigns/${newCampaign.id}`);
    } catch (error) {
      console.error('Failed to create performance plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to create performance plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Performance Campaign</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tier</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background">
                      <SelectItem value="tier_1">Tier 1</SelectItem>
                      <SelectItem value="tier_2">Tier 2</SelectItem>
                      <SelectItem value="tier_3">Tier 3</SelectItem>
                      <SelectItem value="tier_4">Tier 4</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quarterly_attended_meeting_guarantee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quarterly Attended Meeting Guarantee</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="performance_fee_per_meeting"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Performance Fee per Attended Meeting</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="performance_start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Performance Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="internal_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Internal Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any internal notes about this performance plan..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Performance Campaign'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
