-- Add campaign_id to event_type_assignments for campaign-specific booking links
ALTER TABLE public.event_type_assignments 
ADD COLUMN campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- Create index for efficient queries
CREATE INDEX idx_event_type_assignments_campaign ON public.event_type_assignments(campaign_id);

-- Add comment for clarity
COMMENT ON COLUMN public.event_type_assignments.campaign_id IS 'Optional campaign link for campaign-specific booking URLs';