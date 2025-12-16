import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Briefcase, Users, MapPin, TrendingUp, Heart, Phone, CheckCircle, Handshake, FileText, Edit } from 'lucide-react';
import { CandidateTargetingBriefData } from './CandidateTargetingBriefForm';
import { format } from 'date-fns';

interface CandidateTargetingBriefSummaryProps {
  data: CandidateTargetingBriefData;
  campaignName: string;
  workspaceName: string;
  isInternalUser: boolean;
  onEditClick: () => void;
}

interface SummarySectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SummarySection({ title, icon, children }: SummarySectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

interface SummaryFieldProps {
  label: string;
  value?: string | string[] | null;
}

function SummaryField({ label, value }: SummaryFieldProps) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {Array.isArray(value) ? (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => (
            <Badge key={v} variant="secondary" className="text-xs">
              {v}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm">{value}</p>
      )}
    </div>
  );
}

export function CandidateTargetingBriefSummary({
  data,
  campaignName,
  workspaceName,
  isInternalUser,
  onEditClick,
}: CandidateTargetingBriefSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
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
              {data.completed_at && (
                <p className="text-xs text-muted-foreground">
                  Last updated: {format(new Date(data.completed_at), 'PPP')}
                </p>
              )}
            </div>
          </div>
          {isInternalUser && (
            <Button variant="outline" size="sm" onClick={onEditClick}>
              <Edit className="h-4 w-4 mr-1" />
              Edit Brief
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Section 1: Search Overview */}
        <SummarySection title="Section 1: Search Overview" icon={<Target className="h-4 w-4 text-primary" />}>
          <SummaryField label="Primary Objective" value={data.primary_objective} />
          <SummaryField label="Search Scope" value={data.search_scope} />
        </SummarySection>

        {/* Section 2: Target Role Definition */}
        {(data.target_job_titles || data.core_function || (data.seniority_levels && data.seniority_levels.length > 0)) && (
          <SummarySection title="Section 2: Target Role Definition" icon={<Briefcase className="h-4 w-4 text-primary" />}>
            <SummaryField label="Target Job Title(s)" value={data.target_job_titles} />
            <SummaryField label="Core Function" value={data.core_function} />
            <SummaryField label="Seniority Level" value={data.seniority_levels} />
          </SummarySection>
        )}

        {/* Section 3: Industry or Domain Background */}
        {((data.industry_backgrounds && data.industry_backgrounds.length > 0) || data.other_industry_domain) && (
          <SummarySection title="Section 3: Industry or Domain Background" icon={<Briefcase className="h-4 w-4 text-primary" />}>
            <SummaryField label="Industry or Domain Background" value={data.industry_backgrounds} />
            <SummaryField label="Other Industry/Domain" value={data.other_industry_domain} />
          </SummarySection>
        )}

        {/* Section 4: Experience & Credentials */}
        {(data.years_of_experience || data.must_have_experience || data.nice_to_have_experience) && (
          <SummarySection title="Section 4: Experience & Credentials" icon={<Users className="h-4 w-4 text-primary" />}>
            <SummaryField label="Years of Relevant Experience" value={data.years_of_experience} />
            <SummaryField label="Must-Have Experience or Credentials" value={data.must_have_experience} />
            <SummaryField label="Nice-to-Have Experience" value={data.nice_to_have_experience} />
          </SummarySection>
        )}

        {/* Section 5: Location & Working Preferences */}
        {((data.candidate_locations && data.candidate_locations.length > 0) || data.priority_cities_regions || data.remote_hybrid_acceptable) && (
          <SummarySection title="Section 5: Location & Working Preferences" icon={<MapPin className="h-4 w-4 text-primary" />}>
            <SummaryField label="Candidate Location" value={data.candidate_locations} />
            <SummaryField label="Priority Cities or Regions" value={data.priority_cities_regions} />
            <SummaryField label="Remote or Hybrid Acceptable" value={data.remote_hybrid_acceptable} />
          </SummarySection>
        )}

        {/* Section 6: Current Situation & Mobility */}
        {(data.likely_current_employers || data.expected_move_type || data.typical_openness) && (
          <SummarySection title="Section 6: Current Situation & Mobility" icon={<TrendingUp className="h-4 w-4 text-primary" />}>
            <SummaryField label="Likely Current Employers" value={data.likely_current_employers} />
            <SummaryField label="Expected Move Type" value={data.expected_move_type} />
            <SummaryField label="Typical Openness to New Opportunities" value={data.typical_openness} />
          </SummarySection>
        )}

        {/* Section 7: Motivation & Constraints */}
        {((data.common_move_reasons && data.common_move_reasons.length > 0) || data.non_negotiables_constraints) && (
          <SummarySection title="Section 7: Motivation & Constraints" icon={<Heart className="h-4 w-4 text-primary" />}>
            <SummaryField label="Common Reasons Candidates Might Move" value={data.common_move_reasons} />
            <SummaryField label="Non-Negotiables or Hard Constraints" value={data.non_negotiables_constraints} />
          </SummarySection>
        )}

        {/* Section 8: Outreach & Calling Practicalities */}
        {(data.best_seniority_to_call || data.profiles_to_avoid || (data.preferred_calling_windows && data.preferred_calling_windows.length > 0)) && (
          <SummarySection title="Section 8: Outreach & Calling Practicalities" icon={<Phone className="h-4 w-4 text-primary" />}>
            <SummaryField label="Best Seniority Levels to Call Directly" value={data.best_seniority_to_call} />
            <SummaryField label="Profiles to Avoid Calling" value={data.profiles_to_avoid} />
            <SummaryField label="Preferred Calling Window" value={data.preferred_calling_windows} />
          </SummarySection>
        )}

        {/* Section 9: Qualification Rules */}
        {((data.strong_fit_signals && data.strong_fit_signals.length > 0) || (data.disqualifiers && data.disqualifiers.length > 0)) && (
          <SummarySection title="Section 9: Qualification Rules" icon={<CheckCircle className="h-4 w-4 text-primary" />}>
            <SummaryField label="What Makes a Candidate a Strong Fit" value={data.strong_fit_signals} />
            <SummaryField label="What Disqualifies a Candidate" value={data.disqualifiers} />
          </SummarySection>
        )}

        {/* Section 10: First Conversation Outcome */}
        {((data.success_definitions && data.success_definitions.length > 0) || data.conversation_booked_with) && (
          <SummarySection title="Section 10: First Conversation Outcome" icon={<Handshake className="h-4 w-4 text-primary" />}>
            <SummaryField label="Success Definitions" value={data.success_definitions} />
            <SummaryField label="Who Should the Conversation Be Booked With" value={data.conversation_booked_with} />
          </SummarySection>
        )}

        {/* Section 11: Additional Context */}
        {(data.comparable_searches || data.red_flags_sensitivities || data.additional_targeting_notes) && (
          <SummarySection title="Section 11: Additional Context" icon={<FileText className="h-4 w-4 text-primary" />}>
            <SummaryField label="Comparable Searches or Roles" value={data.comparable_searches} />
            <SummaryField label="Red Flags or Sensitivities" value={data.red_flags_sensitivities} />
            <SummaryField label="Additional Notes" value={data.additional_targeting_notes} />
          </SummarySection>
        )}
      </CardContent>
    </Card>
  );
}
