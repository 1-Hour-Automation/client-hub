-- Add bdr_assigned column to campaigns table for per-campaign BDR tracking
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS bdr_assigned text;