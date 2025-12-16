import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, Target, Users, Phone, CheckCircle, MessageSquare, Handshake, FileText, AlertCircle } from 'lucide-react';

// Multi-select options
const PRIMARY_OBJECTIVES = [
  'Identify and engage hiring organisations',
  'Surface live or upcoming hiring needs',
  'Secure exploratory meetings with hiring stakeholders',
  'Validate demand in a specific market or function',
  'Other',
] as const;

const HIRING_FOCUS = [
  'Single role',
  'Multiple similar roles',
  'Ongoing or repeat hiring',
] as const;

const ORG_TYPES = [
  'Recruitment agency',
  'Staffing firm',
  'Professional services firm',
  'Corporate or in-house hiring organisation',
  'Other',
] as const;

const ORG_SIZES = [
  '1–10 employees',
  '11–50 employees',
  '51–200 employees',
  '201–500 employees',
  '500+ employees',
] as const;

const GEOGRAPHIES = [
  'United Kingdom',
  'United States',
  'Europe',
  'Australia / New Zealand',
  'Other',
] as const;

const HIRING_SIGNALS = [
  'Active job postings',
  'Consistent repeat hiring',
  'Growth or expansion',
  'Increased workload or deal flow',
  'Attrition or recent departures',
  'Regulatory or compliance pressure',
  'Seasonal hiring cycles',
  'Other',
] as const;

const HIRING_URGENCY = [
  'Immediate or currently live',
  'Short term (1–3 months)',
  'Medium term (3–6 months)',
  'Ongoing background demand',
] as const;

const PRIMARY_CONTACTS = [
  'Operations Manager',
  'Practice Manager',
  'Office Manager',
  'Team Lead',
  'Internal Recruiter',
  'HR or Talent Partner',
  'Other',
] as const;

const SECONDARY_CONTACTS = [
  'Head of Department',
  'Director',
  'Partner',
  'Managing Partner',
  'Founder or Owner',
  'Head of People or Talent',
  'Other',
] as const;

const INFLUENCE_LEVELS = [
  'Own the decision',
  'Strong influence',
  'Limited influence',
  'Unsure',
] as const;

const HIRING_MODELS = [
  'Contingent recruitment',
  'Retained search',
  'Exclusive partnership',
  'Internal recruitment team',
  'Hybrid or mixed approach',
  'Unsure',
] as const;

const CURRENT_HIRING_APPROACHES = [
  'Multiple external agencies',
  'One preferred supplier',
  'Fully in-house',
  'Direct advertising only',
  'Ad hoc or reactive hiring',
  'Other',
] as const;

const HIRING_CHALLENGES = [
  'Time to hire too slow',
  'Difficulty attracting the right candidates',
  'Low candidate response rates',
  'Internal capacity stretched',
  'Lack of specialist or niche expertise',
  'Poor agency experiences',
  'Roles remaining open too long',
] as const;

const STRONG_TARGET_SIGNALS = [
  'Confirmed or upcoming hiring need',
  'Open to external support',
  'Decision makers accessible',
  'Budget available or planned',
  'Willing to engage in exploratory discussion',
] as const;

const DISQUALIFIERS = [
  'No hiring planned',
  'Fully exclusive with another provider',
  'No external recruitment usage',
  'Outside target size or geography',
  'Poor engagement or reputation',
] as const;

const CONVERSATION_ANGLES = [
  'Exploratory and diagnostic',
  'Capacity and workload support',
  'Specialist or niche expertise',
  'Speed and delivery focused',
  'Process improvement',
  'Other',
] as const;

const SUCCESS_DEFINITIONS = [
  'Hiring need confirmed',
  'Live or upcoming role discussed',
  'Referral to correct decision maker',
  'Agreement to share role details',
  'Follow-up conversation scheduled',
] as const;

const clientTargetingBriefSchema = z.object({
  // Section 1: Campaign Objective (required for targeting activation, but saving allowed)
  primary_objective: z.string().optional(),
  hiring_focus: z.string().optional(),
  
  // Section 2: Target Hiring Organisations
  org_types: z.array(z.string()).optional(),
  org_sizes: z.array(z.string()).optional(),
  target_geography: z.array(z.string()).optional(),
  priority_cities_regions: z.string().optional(),
  
  // Section 3: Hiring Demand Signals
  hiring_signals: z.array(z.string()).optional(),
  hiring_urgency: z.string().optional(),
  
  // Section 4: Target Contacts
  primary_contacts: z.array(z.string()).optional(),
  secondary_contacts: z.array(z.string()).optional(),
  hiring_decision_approver: z.string().optional(),
  
  // Section 5: Hiring Authority & Budget
  influence_level: z.string().optional(),
  hiring_models: z.array(z.string()).optional(),
  budget_constraints: z.string().optional(),
  
  // Section 6: Current Hiring Approach & Pain Points
  current_hiring_approaches: z.array(z.string()).optional(),
  hiring_challenges: z.array(z.string()).optional(),
  
  // Section 7: Qualification Rules
  strong_target_signals: z.array(z.string()).optional(),
  disqualifiers: z.array(z.string()).optional(),
  
  // Section 8: Outreach Positioning
  conversation_angle: z.string().optional(),
  value_for_them: z.string().optional(),
  
  // Section 9: First Conversation Outcome
  success_definitions: z.array(z.string()).optional(),
  meeting_booking_contact: z.string().optional(),
  
  // Section 10: Additional Context
  competitors_suppliers: z.string().optional(),
  red_flags_nuances: z.string().optional(),
  additional_context: z.string().optional(),
});

type ClientTargetingBriefFormValues = z.infer<typeof clientTargetingBriefSchema>;

export interface ClientTargetingBriefData extends ClientTargetingBriefFormValues {
  completed_at?: string;
}

interface ClientTargetingBriefFormProps {
  campaignId: string;
  campaignName: string;
  workspaceName: string;
  initialData?: ClientTargetingBriefData | null;
  isInternalUser: boolean;
  onCompleted: () => void;
  onDataUpdated: (data: ClientTargetingBriefData) => void;
}

interface MultiSelectFieldProps {
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
}

function MultiSelectField({ options, value, onChange }: MultiSelectFieldProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

export function ClientTargetingBriefForm({
  campaignId,
  campaignName,
  workspaceName,
  initialData,
  isInternalUser,
  onCompleted,
  onDataUpdated,
}: ClientTargetingBriefFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  const form = useForm<ClientTargetingBriefFormValues>({
    resolver: zodResolver(clientTargetingBriefSchema),
    defaultValues: {
      primary_objective: initialData?.primary_objective || '',
      hiring_focus: initialData?.hiring_focus || '',
      org_types: initialData?.org_types || [],
      org_sizes: initialData?.org_sizes || [],
      target_geography: initialData?.target_geography || [],
      priority_cities_regions: initialData?.priority_cities_regions || '',
      hiring_signals: initialData?.hiring_signals || [],
      hiring_urgency: initialData?.hiring_urgency || '',
      primary_contacts: initialData?.primary_contacts || [],
      secondary_contacts: initialData?.secondary_contacts || [],
      hiring_decision_approver: initialData?.hiring_decision_approver || '',
      influence_level: initialData?.influence_level || '',
      hiring_models: initialData?.hiring_models || [],
      budget_constraints: initialData?.budget_constraints || '',
      current_hiring_approaches: initialData?.current_hiring_approaches || [],
      hiring_challenges: initialData?.hiring_challenges || [],
      strong_target_signals: initialData?.strong_target_signals || [],
      disqualifiers: initialData?.disqualifiers || [],
      conversation_angle: initialData?.conversation_angle || '',
      value_for_them: initialData?.value_for_them || '',
      success_definitions: initialData?.success_definitions || [],
      meeting_booking_contact: initialData?.meeting_booking_contact || '',
      competitors_suppliers: initialData?.competitors_suppliers || '',
      red_flags_nuances: initialData?.red_flags_nuances || '',
      additional_context: initialData?.additional_context || '',
    },
  });

  async function onSubmit(values: ClientTargetingBriefFormValues) {
    setHasAttemptedSave(true);
    setIsSubmitting(true);
    try {
      const dataToSave: ClientTargetingBriefData = {
        ...values,
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('campaigns')
        .update({ client_targeting_brief_data: JSON.parse(JSON.stringify(dataToSave)) })
        .eq('id', campaignId);

      if (error) throw error;

      const missingRequired = !values.primary_objective || !values.hiring_focus;
      toast({
        title: 'Targeting brief saved',
        description: missingRequired 
          ? 'Saved successfully. Complete the required fields in Section 1 to activate targeting.'
          : 'Your client targeting brief has been saved successfully.',
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
          Client Side Targeting Brief
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
            This form defines which hiring organisations we should target for this client-focused campaign. Your answers are used to identify the right companies, the right stakeholders to approach, and the most relevant hiring conversations to start.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            If you are unsure on any question, provide your best estimate. Targeting can be refined as the campaign runs.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Section 1: Campaign Objective */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <Target className="h-4 w-4 text-primary" />
                Section 1: Campaign Objective
              </h3>
              <p className="text-xs text-muted-foreground">
                These two fields are required to activate targeting logic. All other fields are optional and can be completed progressively.
              </p>
              
              <FormField
                control={form.control}
                name="primary_objective"
                render={({ field }) => {
                  const isMissing = hasAttemptedSave && !field.value;
                  return (
                    <FormItem>
                      <FormLabel>
                        Primary Objective <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className={isMissing ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select primary objective" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRIMARY_OBJECTIVES.map((obj) => (
                            <SelectItem key={obj} value={obj}>{obj}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isMissing && (
                        <p className="text-xs text-destructive">Required to activate targeting</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="hiring_focus"
                render={({ field }) => {
                  const isMissing = hasAttemptedSave && !field.value;
                  return (
                    <FormItem>
                      <FormLabel>
                        Hiring Focus <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className={isMissing ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select hiring focus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {HIRING_FOCUS.map((focus) => (
                            <SelectItem key={focus} value={focus}>{focus}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isMissing && (
                        <p className="text-xs text-destructive">Required to activate targeting</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* Section 2: Target Hiring Organisations */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <Building2 className="h-4 w-4 text-primary" />
                Section 2: Target Hiring Organisations
              </h3>

              <FormField
                control={form.control}
                name="org_types"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of Hiring Organisation</FormLabel>
                    <MultiSelectField
                      options={ORG_TYPES}
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="org_sizes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organisation Size</FormLabel>
                    <MultiSelectField
                      options={ORG_SIZES}
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_geography"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Geography</FormLabel>
                    <MultiSelectField
                      options={GEOGRAPHIES}
                      value={field.value || []}
                      onChange={field.onChange}
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
                    <FormLabel>Priority Cities or Regions</FormLabel>
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
            </div>

            {/* Section 3: Hiring Demand Signals */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <Phone className="h-4 w-4 text-primary" />
                Section 3: Hiring Demand Signals
              </h3>

              <FormField
                control={form.control}
                name="hiring_signals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What signals indicate these organisations are likely hiring?</FormLabel>
                    <MultiSelectField
                      options={HIRING_SIGNALS}
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hiring_urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typical Hiring Urgency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {HIRING_URGENCY.map((urgency) => (
                          <SelectItem key={urgency} value={urgency}>{urgency}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 4: Target Contacts */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <Users className="h-4 w-4 text-primary" />
                Section 4: Target Contacts Inside the Organisation
              </h3>

              <FormField
                control={form.control}
                name="primary_contacts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Contacts to Approach First</FormLabel>
                    <MultiSelectField
                      options={PRIMARY_CONTACTS}
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondary_contacts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary or Escalation Contacts</FormLabel>
                    <MultiSelectField
                      options={SECONDARY_CONTACTS}
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hiring_decision_approver"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Who Ultimately Approves Hiring Decisions?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe who typically has final say on hiring decisions"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 5: Hiring Authority & Budget */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <Handshake className="h-4 w-4 text-primary" />
                Section 5: Hiring Authority & Budget
              </h3>

              <FormField
                control={form.control}
                name="influence_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Influence Level of Primary Contacts</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select influence level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INFLUENCE_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hiring_models"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Common Hiring Models Used</FormLabel>
                    <MultiSelectField
                      options={HIRING_MODELS}
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget_constraints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Known Budget Sensitivities or Constraints (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any known budget considerations or constraints"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 6: Current Hiring Approach & Pain Points */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Section 6: Current Hiring Approach & Pain Points
              </h3>

              <FormField
                control={form.control}
                name="current_hiring_approaches"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How Are These Organisations Currently Hiring?</FormLabel>
                    <MultiSelectField
                      options={CURRENT_HIRING_APPROACHES}
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hiring_challenges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Common Hiring Challenges</FormLabel>
                    <MultiSelectField
                      options={HIRING_CHALLENGES}
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 7: Qualification Rules */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Section 7: Qualification Rules
              </h3>

              <FormField
                control={form.control}
                name="strong_target_signals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What Makes an Organisation a Strong Target?</FormLabel>
                    <MultiSelectField
                      options={STRONG_TARGET_SIGNALS}
                      value={field.value || []}
                      onChange={field.onChange}
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
                    <FormLabel>What Disqualifies an Organisation?</FormLabel>
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

            {/* Section 8: Outreach Positioning */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Section 8: Outreach Positioning
              </h3>

              <FormField
                control={form.control}
                name="conversation_angle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Conversation Angle</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select conversation angle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONVERSATION_ANGLES.map((angle) => (
                          <SelectItem key={angle} value={angle}>{angle}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value_for_them"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What Would Make the Conversation Valuable for Them?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what value they would get from the conversation"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 9: First Conversation Outcome */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <Handshake className="h-4 w-4 text-primary" />
                Section 9: First Conversation Outcome
              </h3>

              <FormField
                control={form.control}
                name="success_definitions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What Defines Success for the First Conversation?</FormLabel>
                    <MultiSelectField
                      options={SUCCESS_DEFINITIONS}
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meeting_booking_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Who Should Meetings Be Booked With?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe who meetings should be booked with"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 10: Additional Context */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <FileText className="h-4 w-4 text-primary" />
                Section 10: Additional Context
              </h3>

              <FormField
                control={form.control}
                name="competitors_suppliers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competitors or Suppliers Commonly Used (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List competitors or suppliers these organisations commonly use"
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
                name="red_flags_nuances"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Red Flags or Nuances Callers Should Be Aware Of (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any red flags or nuances to be aware of"
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
                name="additional_context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anything Else That Improves Client Side Targeting Accuracy (Optional)</FormLabel>
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
