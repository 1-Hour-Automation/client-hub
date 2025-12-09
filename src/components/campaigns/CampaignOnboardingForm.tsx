import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const onboardingSchema = z.object({
  // ICP Information
  target_job_titles: z.string().min(1, 'Required'),
  industries_to_target: z.string().min(1, 'Required'),
  company_size_range: z.string().min(1, 'Required'),
  required_skills: z.string().min(1, 'Required'),
  locations_to_target: z.string().min(1, 'Required'),
  excluded_industries: z.string().min(1, 'Required'),
  example_ideal_companies: z.string().optional(),
  
  // Messaging & Offer
  value_proposition: z.string().min(1, 'Required'),
  key_pain_points: z.string().min(1, 'Required'),
  unique_differentiator: z.string().min(1, 'Required'),
  example_messaging: z.string().optional(),
  
  // Objections & Responses
  common_objections: z.string().min(1, 'Required'),
  recommended_responses: z.string().min(1, 'Required'),
  compliance_notes: z.string().optional(),
  
  // Qualification Criteria
  qualified_prospect_definition: z.string().min(1, 'Required'),
  disqualifying_factors: z.string().min(1, 'Required'),
  
  // Scheduling Setup
  scheduling_link: z.string().url('Must be a valid URL'),
  target_timezone: z.string().min(1, 'Required'),
  booking_instructions: z.string().min(1, 'Required'),
  bdr_notes: z.string().min(1, 'Required'),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

interface CampaignOnboardingFormProps {
  campaignId: string;
  initialData?: Partial<OnboardingFormValues>;
  isCompleted: boolean;
  onCompleted: () => void;
}

export function CampaignOnboardingForm({ campaignId, initialData, isCompleted, onCompleted }: CampaignOnboardingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      target_job_titles: initialData?.target_job_titles || '',
      industries_to_target: initialData?.industries_to_target || '',
      company_size_range: initialData?.company_size_range || '',
      required_skills: initialData?.required_skills || '',
      locations_to_target: initialData?.locations_to_target || '',
      excluded_industries: initialData?.excluded_industries || '',
      example_ideal_companies: initialData?.example_ideal_companies || '',
      value_proposition: initialData?.value_proposition || '',
      key_pain_points: initialData?.key_pain_points || '',
      unique_differentiator: initialData?.unique_differentiator || '',
      example_messaging: initialData?.example_messaging || '',
      common_objections: initialData?.common_objections || '',
      recommended_responses: initialData?.recommended_responses || '',
      compliance_notes: initialData?.compliance_notes || '',
      qualified_prospect_definition: initialData?.qualified_prospect_definition || '',
      disqualifying_factors: initialData?.disqualifying_factors || '',
      scheduling_link: initialData?.scheduling_link || '',
      target_timezone: initialData?.target_timezone || '',
      booking_instructions: initialData?.booking_instructions || '',
      bdr_notes: initialData?.bdr_notes || '',
    },
  });

  const onSubmit = async (values: OnboardingFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          onboarding_target_job_titles: values.target_job_titles,
          onboarding_industries_to_target: values.industries_to_target,
          onboarding_company_size_range: values.company_size_range,
          onboarding_required_skills: values.required_skills,
          onboarding_locations_to_target: values.locations_to_target,
          onboarding_excluded_industries: values.excluded_industries,
          onboarding_example_ideal_companies: values.example_ideal_companies || null,
          onboarding_value_proposition: values.value_proposition,
          onboarding_key_pain_points: values.key_pain_points,
          onboarding_unique_differentiator: values.unique_differentiator,
          onboarding_example_messaging: values.example_messaging || null,
          onboarding_common_objections: values.common_objections,
          onboarding_recommended_responses: values.recommended_responses,
          onboarding_compliance_notes: values.compliance_notes || null,
          onboarding_qualified_prospect_definition: values.qualified_prospect_definition,
          onboarding_disqualifying_factors: values.disqualifying_factors,
          onboarding_scheduling_link: values.scheduling_link,
          onboarding_target_timezone: values.target_timezone,
          onboarding_booking_instructions: values.booking_instructions,
          onboarding_bdr_notes: values.bdr_notes,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      if (error) throw error;

      toast({ title: 'Onboarding submitted successfully' });
      onCompleted();
    } catch (error) {
      console.error('Failed to submit onboarding:', error);
      toast({ title: 'Failed to submit onboarding', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-green-900 dark:text-green-100">Onboarding Completed</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          Waiting for Review — Our team will review your onboarding information and reach out shortly.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ICP Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ICP Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="target_job_titles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Job Titles</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., VP Sales, Director of Operations, CEO" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="industries_to_target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industries to Target</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Technology, Healthcare, Finance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company_size_range"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Size Range</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 50-500 employees" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="required_skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Skills or Technologies</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Salesforce, HubSpot, AWS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="locations_to_target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Locations to Target</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., United States, Canada, Western Europe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="excluded_industries"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Excluded Industries or Companies</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Government, Non-profits, Competitors" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="example_ideal_companies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Example Ideal Companies (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Salesforce, HubSpot, Zendesk" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Messaging & Offer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Messaging & Offer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="value_proposition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value Proposition</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What value do you provide to customers?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="key_pain_points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Pain Points to Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What problems do you solve for customers?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unique_differentiator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What Makes You Unique</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What sets you apart from competitors?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="example_messaging"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Example Messaging or Phrases (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Sample phrases or talk tracks you'd like us to use" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Objections & Responses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Objections & Responses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="common_objections"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Common Objections</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What objections do prospects typically raise?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recommended_responses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recommended Responses</FormLabel>
                  <FormControl>
                    <Textarea placeholder="How should we respond to these objections?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="compliance_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compliance Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any compliance or legal considerations to be aware of" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Qualification Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Qualification Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="qualified_prospect_definition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What Defines a Qualified Prospect</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What criteria must be met for a prospect to be considered qualified?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="disqualifying_factors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disqualifying Factors</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What would disqualify a prospect?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Scheduling Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scheduling Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="scheduling_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduling Link</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="e.g., https://calendly.com/yourname" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="target_timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Time Zone</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Eastern Time (ET)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="booking_instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ideal Booking Instructions</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any specific instructions for booking meetings" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bdr_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes for the BDR</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional context or notes for our team" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Onboarding
          </Button>
        </div>
      </form>
    </Form>
  );
}
