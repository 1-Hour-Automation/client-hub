-- Add onboarding fields to campaigns table
ALTER TABLE public.campaigns
  -- ICP Information
  ADD COLUMN onboarding_target_job_titles TEXT,
  ADD COLUMN onboarding_industries_to_target TEXT,
  ADD COLUMN onboarding_company_size_range TEXT,
  ADD COLUMN onboarding_required_skills TEXT,
  ADD COLUMN onboarding_locations_to_target TEXT,
  ADD COLUMN onboarding_excluded_industries TEXT,
  ADD COLUMN onboarding_example_ideal_companies TEXT,
  
  -- Messaging & Offer
  ADD COLUMN onboarding_value_proposition TEXT,
  ADD COLUMN onboarding_key_pain_points TEXT,
  ADD COLUMN onboarding_unique_differentiator TEXT,
  ADD COLUMN onboarding_example_messaging TEXT,
  
  -- Objections & Responses
  ADD COLUMN onboarding_common_objections TEXT,
  ADD COLUMN onboarding_recommended_responses TEXT,
  ADD COLUMN onboarding_compliance_notes TEXT,
  
  -- Qualification Criteria
  ADD COLUMN onboarding_qualified_prospect_definition TEXT,
  ADD COLUMN onboarding_disqualifying_factors TEXT,
  
  -- Scheduling Setup
  ADD COLUMN onboarding_scheduling_link TEXT,
  ADD COLUMN onboarding_target_timezone TEXT,
  ADD COLUMN onboarding_booking_instructions TEXT,
  ADD COLUMN onboarding_bdr_notes TEXT,
  
  -- Onboarding status
  ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;