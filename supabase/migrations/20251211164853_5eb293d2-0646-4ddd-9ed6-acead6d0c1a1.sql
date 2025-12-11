-- Add candidate_onboarding_data JSONB column to campaigns table
ALTER TABLE public.campaigns
ADD COLUMN candidate_onboarding_data jsonb DEFAULT NULL;