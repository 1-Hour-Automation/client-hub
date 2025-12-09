-- Add new columns to campaigns table for target, tier, performance fields, and sprint linking
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS target text,
ADD COLUMN IF NOT EXISTS tier text,
ADD COLUMN IF NOT EXISTS quarterly_attended_meeting_guarantee integer,
ADD COLUMN IF NOT EXISTS performance_fee_per_meeting numeric,
ADD COLUMN IF NOT EXISTS performance_start_date date,
ADD COLUMN IF NOT EXISTS sprint_campaign_id uuid REFERENCES public.campaigns(id),
ADD COLUMN IF NOT EXISTS internal_notes text;