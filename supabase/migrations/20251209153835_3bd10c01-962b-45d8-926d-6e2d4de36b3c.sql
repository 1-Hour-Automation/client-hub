-- Add phase column to campaigns table
ALTER TABLE public.campaigns
  ADD COLUMN phase TEXT NOT NULL DEFAULT 'not_started',
  ADD COLUMN campaign_type TEXT;