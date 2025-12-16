import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Building2, Phone, Users, Handshake, AlertCircle, CheckCircle, MessageSquare, FileText, Edit } from 'lucide-react';
import { ClientTargetingBriefData } from './ClientTargetingBriefForm';
import { format } from 'date-fns';

interface ClientTargetingBriefSummaryProps {
  data: ClientTargetingBriefData;
  campaignName: string;
  workspaceName: string;
  isInternalUser: boolean;
  onEditClick: () => void;
}

function SummarySection({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        {title}
      </h4>
      <div className="space-y-2 pl-6">
        {children}
      </div>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value?: string | string[] | null }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}:</span>{' '}
      {Array.isArray(value) ? (
        <div className="flex flex-wrap gap-1 mt-1">
          {value.map((v, i) => (
            <Badge key={i} variant="secondary" className="text-xs font-normal">
              {v}
            </Badge>
          ))}
        </div>
      ) : (
        <span className="font-medium">{value}</span>
      )}
    </div>
  );
}

export function ClientTargetingBriefSummary({
  data,
  campaignName,
  workspaceName,
  isInternalUser,
  onEditClick,
}: ClientTargetingBriefSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
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
              {data.completed_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Completed on {format(new Date(data.completed_at), 'PPP')}
                </p>
              )}
            </div>
          </div>
          {isInternalUser && (
            <Button variant="outline" size="sm" onClick={onEditClick}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Brief
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <SummarySection title="Campaign Objective" icon={Target}>
          <SummaryField label="Primary Objective" value={data.primary_objective} />
          <SummaryField label="Hiring Focus" value={data.hiring_focus} />
        </SummarySection>

        <SummarySection title="Target Hiring Organisations" icon={Building2}>
          <SummaryField label="Organisation Types" value={data.org_types} />
          <SummaryField label="Organisation Sizes" value={data.org_sizes} />
          <SummaryField label="Target Geography" value={data.target_geography} />
          <SummaryField label="Priority Cities/Regions" value={data.priority_cities_regions} />
        </SummarySection>

        <SummarySection title="Hiring Demand Signals" icon={Phone}>
          <SummaryField label="Hiring Signals" value={data.hiring_signals} />
          <SummaryField label="Hiring Urgency" value={data.hiring_urgency} />
        </SummarySection>

        <SummarySection title="Target Contacts" icon={Users}>
          <SummaryField label="Primary Contacts" value={data.primary_contacts} />
          <SummaryField label="Secondary Contacts" value={data.secondary_contacts} />
          <SummaryField label="Decision Approver" value={data.hiring_decision_approver} />
        </SummarySection>

        <SummarySection title="Hiring Authority & Budget" icon={Handshake}>
          <SummaryField label="Influence Level" value={data.influence_level} />
          <SummaryField label="Hiring Models" value={data.hiring_models} />
          <SummaryField label="Budget Constraints" value={data.budget_constraints} />
        </SummarySection>

        <SummarySection title="Current Hiring Approach" icon={AlertCircle}>
          <SummaryField label="Current Approaches" value={data.current_hiring_approaches} />
          <SummaryField label="Hiring Challenges" value={data.hiring_challenges} />
        </SummarySection>

        <SummarySection title="Qualification Rules" icon={CheckCircle}>
          <SummaryField label="Strong Target Signals" value={data.strong_target_signals} />
          <SummaryField label="Disqualifiers" value={data.disqualifiers} />
        </SummarySection>

        <SummarySection title="Outreach Positioning" icon={MessageSquare}>
          <SummaryField label="Conversation Angle" value={data.conversation_angle} />
          <SummaryField label="Value for Them" value={data.value_for_them} />
        </SummarySection>

        <SummarySection title="First Conversation Outcome" icon={Handshake}>
          <SummaryField label="Success Definitions" value={data.success_definitions} />
          <SummaryField label="Meeting Booking Contact" value={data.meeting_booking_contact} />
        </SummarySection>

        <SummarySection title="Additional Context" icon={FileText}>
          <SummaryField label="Competitors/Suppliers" value={data.competitors_suppliers} />
          <SummaryField label="Red Flags/Nuances" value={data.red_flags_nuances} />
          <SummaryField label="Additional Context" value={data.additional_context} />
        </SummarySection>
      </CardContent>
    </Card>
  );
}
