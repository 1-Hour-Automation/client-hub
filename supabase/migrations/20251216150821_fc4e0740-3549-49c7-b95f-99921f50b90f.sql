-- Add client targeting brief data column to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN client_targeting_brief_data jsonb DEFAULT NULL;