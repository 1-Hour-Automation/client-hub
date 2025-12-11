import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, FileText, ExternalLink, Edit } from 'lucide-react';
import { CandidateOnboardingData } from './CandidateOnboardingForm';

interface CandidateOnboardingSummaryProps {
  data: CandidateOnboardingData;
  campaignName: string;
  workspaceName: string;
  isInternalUser: boolean;
  onEditClick: () => void;
}

const seniorityLabels: Record<string, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior',
  lead: 'Lead / Principal',
  manager: 'Manager',
  director: 'Director',
  executive: 'Executive / C-Level',
};

const geographyLabels: Record<string, string> = {
  local: 'Local Only',
  regional: 'Regional',
  national: 'National',
  international: 'International',
};

const workSetupLabels: Record<string, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
  flexible: 'Flexible',
};

function SummaryItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}</span>
      <p className="font-medium whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function FileLink({ file }: { file: { url: string; filename: string } }) {
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-primary hover:underline"
    >
      <FileText className="h-4 w-4" />
      {file.filename}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export function CandidateOnboardingSummary({
  data,
  campaignName,
  workspaceName,
  isInternalUser,
  onEditClick,
}: CandidateOnboardingSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Completed Banner */}
      <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-green-900 dark:text-green-100">Candidate Onboarding: Completed</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          This onboarding form has been submitted. Our team will review the information.
        </AlertDescription>
      </Alert>

      {/* Edit Button (Internal Only) */}
      {isInternalUser && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onEditClick}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Form
          </Button>
        </div>
      )}

      {/* Summary Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold">{campaignName} — Candidate Onboarding</h2>
        <p className="text-sm text-muted-foreground mt-1">Workspace: {workspaceName}</p>
        <p className="text-sm text-muted-foreground">Target Audience: Candidate Outreach</p>
      </div>

      {/* Search Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SummaryItem label="Role Title(s)" value={data.role_titles} />
          <SummaryItem label="Role Summary" value={data.role_summary} />
          <SummaryItem label="Hiring Timeline" value={data.hiring_timeline} />
        </CardContent>
      </Card>

      {/* Candidate Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Candidate Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SummaryItem label="Seniority Level" value={seniorityLabels[data.seniority_level] || data.seniority_level} />
          <SummaryItem label="Years of Experience" value={data.years_of_experience} />
          <SummaryItem label="Education Requirements" value={data.education_requirements} />
          <SummaryItem label="Required Skills" value={data.required_skills} />
          <SummaryItem label="Tech Stack" value={data.tech_stack} />
          <SummaryItem label="Dealbreakers" value={data.dealbreakers} />
        </CardContent>
      </Card>

      {/* Geography */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Geography</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SummaryItem label="Candidate Locations" value={data.candidate_locations} />
          <SummaryItem label="Company/Office Locations" value={data.company_locations} />
          <SummaryItem label="Geography Format" value={geographyLabels[data.geography_format] || data.geography_format} />
          <SummaryItem label="Work Setup" value={workSetupLabels[data.work_setup] || data.work_setup} />
        </CardContent>
      </Card>

      {/* Industry & Company Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Industry & Company Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SummaryItem label="Target Industries" value={data.target_industries} />
          <SummaryItem label="Excluded Industries" value={data.excluded_industries} />
          <SummaryItem label="Preferred Company Types" value={data.preferred_company_types} />
          <SummaryItem label="Company Size Preference" value={data.company_size_preference} />
        </CardContent>
      </Card>

      {/* Script Messaging */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Script Messaging Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SummaryItem label="Key Selling Points" value={data.key_selling_points} />
          <SummaryItem label="Common Objections" value={data.common_objections} />
          <SummaryItem label="Recommended Responses" value={data.recommended_responses} />
        </CardContent>
      </Card>

      {/* Meeting & Handoff */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meeting & Handoff Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SummaryItem label="Default Meeting Assignees" value={data.meeting_assignees} />
          <SummaryItem label="Routing Rules" value={data.routing_rules} />
          <SummaryItem label="Success Definition" value={data.success_definition} />
          <SummaryItem label="Additional Notes" value={data.notes} />
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {(data.files?.job_description || data.files?.candidate_list) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.files.job_description && (
              <div>
                <span className="text-sm text-muted-foreground">Job Description</span>
                <FileLink file={data.files.job_description} />
              </div>
            )}
            {data.files.candidate_list && (
              <div>
                <span className="text-sm text-muted-foreground">Candidate List</span>
                <FileLink file={data.files.candidate_list} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
