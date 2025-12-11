import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, FileText } from 'lucide-react';

const candidateOnboardingSchema = z.object({
  // Search Overview
  role_titles: z.string().min(1, 'Required'),
  role_summary: z.string().min(1, 'Required'),
  hiring_timeline: z.string().min(1, 'Required'),
  
  // Candidate Requirements
  seniority_level: z.string().min(1, 'Required'),
  years_of_experience: z.string().min(1, 'Required'),
  education_requirements: z.string().optional(),
  required_skills: z.string().min(1, 'Required'),
  tech_stack: z.string().optional(),
  dealbreakers: z.string().optional(),
  
  // Geography
  candidate_locations: z.string().min(1, 'Required'),
  company_locations: z.string().min(1, 'Required'),
  geography_format: z.string().min(1, 'Required'),
  work_setup: z.string().min(1, 'Required'),
  
  // Industry & Company
  target_industries: z.string().min(1, 'Required'),
  excluded_industries: z.string().optional(),
  preferred_company_types: z.string().optional(),
  company_size_preference: z.string().optional(),
  
  // Script Messaging
  key_selling_points: z.string().min(1, 'Required'),
  common_objections: z.string().optional(),
  recommended_responses: z.string().optional(),
  
  // Meeting & Handoff
  meeting_assignees: z.string().min(1, 'Required'),
  routing_rules: z.string().optional(),
  success_definition: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});

type CandidateOnboardingFormValues = z.infer<typeof candidateOnboardingSchema>;

export interface CandidateOnboardingData extends CandidateOnboardingFormValues {
  files?: {
    job_description?: { url: string; filename: string; type: string } | null;
    candidate_list?: { url: string; filename: string; type: string } | null;
  };
  completed_at?: string;
}

interface CandidateOnboardingFormProps {
  campaignId: string;
  campaignName: string;
  workspaceName: string;
  roleTitles?: string;
  initialData?: CandidateOnboardingData | null;
  isInternalUser: boolean;
  onCompleted: () => void;
  onDataUpdated: (data: CandidateOnboardingData) => void;
}

interface FileUpload {
  url: string;
  filename: string;
  type: string;
}

export function CandidateOnboardingForm({
  campaignId,
  campaignName,
  workspaceName,
  roleTitles,
  initialData,
  isInternalUser,
  onCompleted,
  onDataUpdated,
}: CandidateOnboardingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobDescriptionFile, setJobDescriptionFile] = useState<FileUpload | null>(
    initialData?.files?.job_description || null
  );
  const [candidateListFile, setCandidateListFile] = useState<FileUpload | null>(
    initialData?.files?.candidate_list || null
  );
  const [uploadingJobDesc, setUploadingJobDesc] = useState(false);
  const [uploadingCandidateList, setUploadingCandidateList] = useState(false);
  
  const jobDescInputRef = useRef<HTMLInputElement>(null);
  const candidateListInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CandidateOnboardingFormValues>({
    resolver: zodResolver(candidateOnboardingSchema),
    defaultValues: {
      role_titles: initialData?.role_titles || '',
      role_summary: initialData?.role_summary || '',
      hiring_timeline: initialData?.hiring_timeline || '',
      seniority_level: initialData?.seniority_level || '',
      years_of_experience: initialData?.years_of_experience || '',
      education_requirements: initialData?.education_requirements || '',
      required_skills: initialData?.required_skills || '',
      tech_stack: initialData?.tech_stack || '',
      dealbreakers: initialData?.dealbreakers || '',
      candidate_locations: initialData?.candidate_locations || '',
      company_locations: initialData?.company_locations || '',
      geography_format: initialData?.geography_format || '',
      work_setup: initialData?.work_setup || '',
      target_industries: initialData?.target_industries || '',
      excluded_industries: initialData?.excluded_industries || '',
      preferred_company_types: initialData?.preferred_company_types || '',
      company_size_preference: initialData?.company_size_preference || '',
      key_selling_points: initialData?.key_selling_points || '',
      common_objections: initialData?.common_objections || '',
      recommended_responses: initialData?.recommended_responses || '',
      meeting_assignees: initialData?.meeting_assignees || '',
      routing_rules: initialData?.routing_rules || '',
      success_definition: initialData?.success_definition || '',
      notes: initialData?.notes || '',
    },
  });

  const handleFileUpload = async (
    file: File,
    type: 'job_description' | 'candidate_list'
  ) => {
    const setUploading = type === 'job_description' ? setUploadingJobDesc : setUploadingCandidateList;
    const setFile = type === 'job_description' ? setJobDescriptionFile : setCandidateListFile;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${campaignId}/${type}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('campaign-files')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('campaign-files')
        .getPublicUrl(fileName);
      
      setFile({
        url: publicUrl,
        filename: file.name,
        type: file.type,
      });
      
      toast({ title: 'File uploaded successfully' });
    } catch (error) {
      console.error('File upload failed:', error);
      toast({ title: 'Failed to upload file', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (type: 'job_description' | 'candidate_list') => {
    if (type === 'job_description') {
      setJobDescriptionFile(null);
    } else {
      setCandidateListFile(null);
    }
  };

  const onSubmit = async (values: CandidateOnboardingFormValues) => {
    setIsSubmitting(true);
    try {
      const onboardingData: CandidateOnboardingData = {
        ...values,
        files: {
          job_description: jobDescriptionFile,
          candidate_list: candidateListFile,
        },
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('campaigns')
        .update({
          candidate_onboarding_data: JSON.parse(JSON.stringify(onboardingData)),
        })
        .eq('id', campaignId);

      if (error) throw error;

      toast({ title: 'Candidate onboarding submitted successfully' });
      onDataUpdated(onboardingData);
      onCompleted();
    } catch (error) {
      console.error('Failed to submit onboarding:', error);
      toast({ title: 'Failed to submit onboarding', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold">{campaignName} — Candidate Onboarding Form</h2>
        <p className="text-sm text-muted-foreground mt-1">Workspace: {workspaceName}</p>
        <p className="text-sm text-muted-foreground">Target Audience: Candidate Outreach</p>
        {roleTitles && (
          <p className="text-sm text-muted-foreground">Target Role(s): {roleTitles}</p>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Search Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="role_titles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Title(s)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Senior Software Engineer, Tech Lead" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role_summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Summary</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description of what this role entails" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hiring_timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hiring Timeline</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ASAP, Within 30 days, Q1 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Candidate Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Candidate Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="seniority_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seniority Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select seniority level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="lead">Lead / Principal</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="director">Director</SelectItem>
                        <SelectItem value="executive">Executive / C-Level</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="years_of_experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 5-10 years, 3+ years" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="education_requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Education Requirements (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Bachelor's in CS, MBA preferred" {...field} />
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
                    <FormLabel>Required Skills</FormLabel>
                    <FormControl>
                      <Textarea placeholder="List the must-have skills for this role" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tech_stack"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tech Stack (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., React, Node.js, AWS, Python" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dealbreakers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dealbreakers (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Automatic disqualifiers for candidates" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Geography */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Geography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="candidate_locations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate Locations</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Where should candidates be located?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company_locations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company/Office Locations</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Where are your office locations?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="geography_format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geography Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="local">Local Only</SelectItem>
                        <SelectItem value="regional">Regional</SelectItem>
                        <SelectItem value="national">National</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="work_setup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Setup</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select work setup" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="onsite">On-site</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Industry & Company Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Industry & Company Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="target_industries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Industries</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Which industries should candidates come from?" {...field} />
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
                    <FormLabel>Excluded Industries (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Industries to avoid" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preferred_company_types"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Company Types (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Startups, Enterprise, Agencies" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company_size_preference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size Preference (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 50-500 employees, Series B+" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Script Messaging Inputs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Script Messaging Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="key_selling_points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Selling Points</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What makes this opportunity attractive to candidates?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="common_objections"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Common Objections (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What objections do candidates typically raise?" {...field} />
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
                    <FormLabel>Recommended Responses (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="How should we respond to these objections?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Meeting & Handoff Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meeting & Handoff Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="meeting_assignees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Meeting Assignees</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Who should meetings be assigned to?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="routing_rules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Routing Rules (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any special routing rules for different candidate types?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="success_definition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Success Definition</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What defines a successful candidate handoff?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any other important information" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* File Uploads */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Optional Uploads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Job Description Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Description</label>
                <p className="text-xs text-muted-foreground">Upload a job description document (PDF, DOCX, TXT)</p>
                {jobDescriptionFile ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1 truncate">{jobDescriptionFile.filename}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile('job_description')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={jobDescInputRef}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'job_description');
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingJobDesc}
                      onClick={() => jobDescInputRef.current?.click()}
                    >
                      {uploadingJobDesc ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Upload Job Description
                    </Button>
                  </div>
                )}
              </div>

              {/* Candidate List Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Candidate List / Reference Files</label>
                <p className="text-xs text-muted-foreground">Upload candidate lists or reference files (CSV, XLSX, PDF)</p>
                {candidateListFile ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1 truncate">{candidateListFile.filename}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile('candidate_list')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={candidateListInputRef}
                      className="hidden"
                      accept=".csv,.xlsx,.xls,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'candidate_list');
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingCandidateList}
                      onClick={() => candidateListInputRef.current?.click()}
                    >
                      {uploadingCandidateList ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Upload Candidate List
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} size="lg">
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Onboarding
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
