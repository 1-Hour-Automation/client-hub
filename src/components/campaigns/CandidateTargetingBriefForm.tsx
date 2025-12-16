import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Target, Users, Briefcase, MapPin, TrendingUp, Heart, Phone, CheckCircle, Handshake, FileText, AlertCircle } from 'lucide-react';

// Multi-select options
const PRIMARY_OBJECTIVES = [
  'Build a pipeline of qualified candidates',
  'Book candidate qualification calls',
  'Validate candidate availability in the market',
  'Support a live role',
  'Ongoing or evergreen sourcing',
] as const;

const SEARCH_SCOPES = [
  'One specific role',
  'Multiple similar roles',
  'General talent pool',
] as const;

const CORE_FUNCTIONS = [
  'Legal',
  'Sales',
  'Engineering',
  'Operations',
  'Finance',
  'HR / Talent',
  'Technology',
  'Other',
] as const;

const SENIORITY_LEVELS = [
  'Entry level',
  'Junior',
  'Mid level',
  'Senior',
  'Lead',
  'Manager',
  'Director',
  'Partner / Principal',
] as const;

const INDUSTRY_BACKGROUNDS = [
  'Law firms',
  'Recruitment agencies',
  'Corporate / in-house',
  'Professional services',
  'Technology',
  'Financial services',
  'Other',
] as const;

const EXPERIENCE_YEARS = [
  '0–2 years',
  '2–5 years',
  '5–10 years',
  '10+ years',
  'Flexible',
] as const;

const CANDIDATE_LOCATIONS = [
  'United Kingdom',
  'United States',
  'Europe',
  'Australia / New Zealand',
  'Remote',
] as const;

const REMOTE_HYBRID_OPTIONS = [
  'Yes',
  'No',
  'Depends on candidate',
] as const;

const MOVE_TYPES = [
  'Lateral move',
  'Step up',
  'Step down acceptable',
  'Flexible',
] as const;

const OPENNESS_LEVELS = [
  'Actively looking',
  'Passively open',
  'Referral only',
  'Unknown',
] as const;

const MOVE_REASONS = [
  'Compensation',
  'Career progression',
  'Workload or burnout',
  'Culture or leadership',
  'Flexibility or location',
  'Quality of work',
  'Other',
] as const;

const CALLING_WINDOWS = [
  'Early morning',
  'Mid-morning',
  'Midday',
  'Afternoon',
  'End of day',
] as const;

const STRONG_FIT_SIGNALS = [
  'Relevant experience confirmed',
  'Open to conversation',
  'Seniority aligned',
  'Location aligned',
  'Clear motivation to move',
] as const;

const DISQUALIFIERS = [
  'Outside experience scope',
  'No interest in change',
  'Compensation misaligned',
  'Location constraints',
  'Poor engagement',
] as const;

const SUCCESS_DEFINITIONS = [
  'Interest confirmed',
  'Experience validated',
  'Motivation understood',
  'Agreement to proceed',
  'Referral to another candidate',
] as const;

const candidateTargetingBriefSchema = z.object({
  // Section 1: Search Overview (required)
  primary_objective: z.string().min(1, 'This field is required'),
  search_scope: z.string().min(1, 'This field is required'),

  // Section 2: Target Role Definition (required)
  target_job_titles: z.string().min(1, 'This field is required'),
  core_function: z.string().min(1, 'This field is required'),
  seniority_levels: z.array(z.string()).min(1, 'Select at least one option'),

  // Section 3: Industry or Domain Background (required)
  industry_backgrounds: z.array(z.string()).min(1, 'Select at least one option'),
  other_industry_domain: z.string().optional(),

  // Section 4: Experience & Credentials
  years_of_experience: z.string().min(1, 'This field is required'),
  must_have_experience: z.string().min(1, 'This field is required'),
  nice_to_have_experience: z.string().optional(),

  // Section 5: Location & Working Preferences
  candidate_locations: z.array(z.string()).min(1, 'Select at least one option'),
  priority_cities_regions: z.string().optional(),
  remote_hybrid_acceptable: z.string().min(1, 'This field is required'),

  // Section 6: Current Situation & Mobility
  likely_current_employers: z.string().optional(),
  expected_move_type: z.string().min(1, 'This field is required'),
  typical_openness: z.string().min(1, 'This field is required'),

  // Section 7: Motivation & Constraints
  common_move_reasons: z.array(z.string()).min(1, 'Select at least one option'),
  non_negotiables_constraints: z.string().optional(),

  // Section 8: Outreach & Calling Practicalities (all optional)
  best_seniority_to_call: z.string().optional(),
  profiles_to_avoid: z.string().optional(),
  preferred_calling_windows: z.array(z.string()).optional(),

  // Section 9: Qualification Rules
  strong_fit_signals: z.array(z.string()).min(1, 'Select at least one option'),
  disqualifiers: z.array(z.string()).optional(),

  // Section 10: First Conversation Outcome
  success_definitions: z.array(z.string()).min(1, 'Select at least one option'),
  conversation_booked_with: z.string().optional(),

  // Section 11: Additional Context (all optional)
  comparable_searches: z.string().optional(),
  red_flags_sensitivities: z.string().optional(),
  additional_targeting_notes: z.string().optional(),
}).refine(
  (data) => {
    // If "Other" is selected in industry_backgrounds, other_industry_domain is required
    if (data.industry_backgrounds?.includes('Other')) {
      return data.other_industry_domain && data.other_industry_domain.trim().length > 0;
    }
    return true;
  },
  {
    message: 'Please specify the other industry or domain',
    path: ['other_industry_domain'],
  }
);

type CandidateTargetingBriefFormValues = z.infer<typeof candidateTargetingBriefSchema>;

export interface CandidateTargetingBriefData extends CandidateTargetingBriefFormValues {
  completed_at?: string;
}

interface CandidateTargetingBriefFormProps {
  campaignId: string;
  campaignName: string;
  workspaceName: string;
  initialData?: CandidateTargetingBriefData | null;
  isInternalUser: boolean;
  onCompleted: () => void;
  onDataUpdated: (data: CandidateTargetingBriefData) => void;
}

interface MultiSelectFieldProps {
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
  hasError?: boolean;
}

function MultiSelectField({ options, value, onChange, hasError }: MultiSelectFieldProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${hasError ? 'rounded-md ring-1 ring-destructive p-2' : ''}`}>
      {options.map((option) => (
        <label
          key={option}
          className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-muted/50 cursor-pointer transition-colors"
        >
          <Checkbox
            checked={value?.includes(option)}
            onCheckedChange={(checked) => {
              if (checked) {
                onChange([...(value || []), option]);
              } else {
                onChange((value || []).filter((v) => v !== option));
              }
            }}
          />
          <span className="text-sm">{option}</span>
        </label>
      ))}
    </div>
  );
}

export function CandidateTargetingBriefForm({
  campaignId,
  campaignName,
  workspaceName,
  initialData,
  isInternalUser,
  onCompleted,
  onDataUpdated,
}: CandidateTargetingBriefFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CandidateTargetingBriefFormValues>({
    resolver: zodResolver(candidateTargetingBriefSchema),
    defaultValues: {
      primary_objective: initialData?.primary_objective || '',
      search_scope: initialData?.search_scope || '',
      target_job_titles: initialData?.target_job_titles || '',
      core_function: initialData?.core_function || '',
      seniority_levels: initialData?.seniority_levels || [],
      industry_backgrounds: initialData?.industry_backgrounds || [],
      other_industry_domain: initialData?.other_industry_domain || '',
      years_of_experience: initialData?.years_of_experience || '',
      must_have_experience: initialData?.must_have_experience || '',
      nice_to_have_experience: initialData?.nice_to_have_experience || '',
      candidate_locations: initialData?.candidate_locations || [],
      priority_cities_regions: initialData?.priority_cities_regions || '',
      remote_hybrid_acceptable: initialData?.remote_hybrid_acceptable || '',
      likely_current_employers: initialData?.likely_current_employers || '',
      expected_move_type: initialData?.expected_move_type || '',
      typical_openness: initialData?.typical_openness || '',
      common_move_reasons: initialData?.common_move_reasons || [],
      non_negotiables_constraints: initialData?.non_negotiables_constraints || '',
      best_seniority_to_call: initialData?.best_seniority_to_call || '',
      profiles_to_avoid: initialData?.profiles_to_avoid || '',
      preferred_calling_windows: initialData?.preferred_calling_windows || [],
      strong_fit_signals: initialData?.strong_fit_signals || [],
      disqualifiers: initialData?.disqualifiers || [],
      success_definitions: initialData?.success_definitions || [],
      conversation_booked_with: initialData?.conversation_booked_with || '',
      comparable_searches: initialData?.comparable_searches || '',
      red_flags_sensitivities: initialData?.red_flags_sensitivities || '',
      additional_targeting_notes: initialData?.additional_targeting_notes || '',
    },
  });

  const watchedIndustries = form.watch('industry_backgrounds');
  const showOtherIndustry = watchedIndustries?.includes('Other');

  async function onSubmit(values: CandidateTargetingBriefFormValues) {
    setIsSubmitting(true);
    try {
      const dataToSave: CandidateTargetingBriefData = {
        ...values,
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('campaigns')
        .update({ candidate_onboarding_data: JSON.parse(JSON.stringify(dataToSave)) })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: 'Targeting brief saved',
        description: 'Your candidate targeting brief has been saved successfully.',
      });

      onDataUpdated(dataToSave);
      onCompleted();
    } catch (error) {
      console.error('Error saving targeting brief:', error);
      toast({
        title: 'Error',
        description: 'Failed to save targeting brief. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <Target className="h-5 w-5" />
          Candidate Side Targeting Brief
        </CardTitle>
        <div className="flex flex-col gap-1 pt-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Campaign:</span> {campaignName}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Client:</span> {workspaceName}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-2">
          <p className="text-sm text-foreground">
            This form defines which candidates we should target for this campaign. Your answers guide candidate sourcing, outreach, and qualification conversations.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            If you are unsure on any question, provide your best estimate. Targeting can be refined as the campaign runs.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Section 1: Search Overview */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <Target className="h-4 w-4 text-primary" />
                Section 1: Search Overview
              </h3>

              <FormField
                control={form.control}
                name="primary_objective"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Primary Objective of This Candidate Search <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={fieldState.error ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select primary objective" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIMARY_OBJECTIVES.map((obj) => (
                          <SelectItem key={obj} value={obj}>{obj}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="search_scope"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Search Scope <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={fieldState.error ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select search scope" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SEARCH_SCOPES.map((scope) => (
                          <SelectItem key={scope} value={scope}>{scope}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 2: Target Role Definition */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Section 2: Target Role Definition
              </h3>

              <FormField
                control={form.control}
                name="target_job_titles"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Target Job Title(s) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Senior Legal Secretary, Paralegal, Legal PA"
                        className={`min-h-[80px] ${fieldState.error ? 'border-destructive' : ''}`}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Include common title variations.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="core_function"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Core Function <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={fieldState.error ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select core function" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CORE_FUNCTIONS.map((func) => (
                          <SelectItem key={func} value={func}>{func}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seniority_levels"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Seniority Level <span className="text-destructive">*</span>
                    </FormLabel>
                    <MultiSelectField
                      options={SENIORITY_LEVELS}
                      value={field.value || []}
                      onChange={field.onChange}
                      hasError={!!fieldState.error}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 3: Industry or Domain Background */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Section 3: Industry or Domain Background
              </h3>

              <FormField
                control={form.control}
                name="industry_backgrounds"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Industry or Domain Background <span className="text-destructive">*</span>
                    </FormLabel>
                    <MultiSelectField
                      options={INDUSTRY_BACKGROUNDS}
                      value={field.value || []}
                      onChange={field.onChange}
                      hasError={!!fieldState.error}
                    />
                    <p className="text-xs text-muted-foreground">Select the industries the candidate is most experienced in.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showOtherIndustry && (
                <FormField
                  control={form.control}
                  name="other_industry_domain"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>
                        Please specify other industry or domain <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Specify other industry or domain background"
                          className={`min-h-[80px] ${fieldState.error ? 'border-destructive' : ''}`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Section 4: Experience & Credentials */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <Users className="h-4 w-4 text-primary" />
                Section 4: Experience & Credentials
              </h3>

              <FormField
                control={form.control}
                name="years_of_experience"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Years of Relevant Experience <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={fieldState.error ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select experience range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXPERIENCE_YEARS.map((years) => (
                          <SelectItem key={years} value={years}>{years}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="must_have_experience"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Must-Have Experience or Credentials <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Certifications, practice areas, tools, deal exposure"
                        className={`min-h-[80px] ${fieldState.error ? 'border-destructive' : ''}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nice_to_have_experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nice-to-Have Experience (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional experience that would be beneficial"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 5: Location & Working Preferences */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <MapPin className="h-4 w-4 text-primary" />
                Section 5: Location & Working Preferences
              </h3>

              <FormField
                control={form.control}
                name="candidate_locations"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Candidate Location <span className="text-destructive">*</span>
                    </FormLabel>
                    <MultiSelectField
                      options={CANDIDATE_LOCATIONS}
                      value={field.value || []}
                      onChange={field.onChange}
                      hasError={!!fieldState.error}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority_cities_regions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority Cities or Regions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., London, Manchester, Birmingham"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remote_hybrid_acceptable"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Remote or Hybrid Acceptable <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={fieldState.error ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REMOTE_HYBRID_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 6: Current Situation & Mobility */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Section 6: Current Situation & Mobility
              </h3>

              <FormField
                control={form.control}
                name="likely_current_employers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Likely Current Employers or Employer Types (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe typical current employers or employer types"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expected_move_type"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Expected Move Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={fieldState.error ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select move type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOVE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="typical_openness"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Typical Openness to New Opportunities <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={fieldState.error ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select openness level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OPENNESS_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 7: Motivation & Constraints */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <Heart className="h-4 w-4 text-primary" />
                Section 7: Motivation & Constraints
              </h3>

              <FormField
                control={form.control}
                name="common_move_reasons"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Common Reasons Candidates Might Move <span className="text-destructive">*</span>
                    </FormLabel>
                    <MultiSelectField
                      options={MOVE_REASONS}
                      value={field.value || []}
                      onChange={field.onChange}
                      hasError={!!fieldState.error}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="non_negotiables_constraints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Non-Negotiables or Hard Constraints (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Salary floor, visa issues, remote-only"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 8: Outreach & Calling Practicalities */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <Phone className="h-4 w-4 text-primary" />
                Section 8: Outreach & Calling Practicalities
              </h3>

              <FormField
                control={form.control}
                name="best_seniority_to_call"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Best Seniority Levels to Call Directly (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe which seniority levels respond best to direct calls"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profiles_to_avoid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Any Profiles to Avoid Calling (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe any profiles or types of candidates to avoid"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferred_calling_windows"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Calling Window (Local Time) (Optional)</FormLabel>
                    <MultiSelectField
                      options={CALLING_WINDOWS}
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 9: Qualification Rules */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Section 9: Qualification Rules
              </h3>

              <FormField
                control={form.control}
                name="strong_fit_signals"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      What Makes a Candidate a Strong Fit <span className="text-destructive">*</span>
                    </FormLabel>
                    <MultiSelectField
                      options={STRONG_FIT_SIGNALS}
                      value={field.value || []}
                      onChange={field.onChange}
                      hasError={!!fieldState.error}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="disqualifiers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What Disqualifies a Candidate (Optional)</FormLabel>
                    <MultiSelectField
                      options={DISQUALIFIERS}
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 10: First Conversation Outcome */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <Handshake className="h-4 w-4 text-primary" />
                Section 10: First Conversation Outcome
              </h3>

              <FormField
                control={form.control}
                name="success_definitions"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      What Defines Success for the First Conversation <span className="text-destructive">*</span>
                    </FormLabel>
                    <MultiSelectField
                      options={SUCCESS_DEFINITIONS}
                      value={field.value || []}
                      onChange={field.onChange}
                      hasError={!!fieldState.error}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conversation_booked_with"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Who Should the Conversation Be Booked With (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe who follow-up conversations should be scheduled with"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 11: Additional Context */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <FileText className="h-4 w-4 text-primary" />
                Section 11: Additional Context
              </h3>

              <FormField
                control={form.control}
                name="comparable_searches"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comparable Searches or Roles to Reference (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List any comparable searches or roles for reference"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="red_flags_sensitivities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Red Flags or Sensitivities Callers Should Know (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any red flags or sensitivities to be aware of"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additional_targeting_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anything Else That Improves Candidate Targeting Accuracy (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional context that would help with targeting"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Targeting Brief
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
