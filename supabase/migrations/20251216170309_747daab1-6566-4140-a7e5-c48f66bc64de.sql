-- Drop unused onboarding text columns from campaigns table
-- These are replaced by candidate_onboarding_data and client_targeting_brief_data JSONB columns

ALTER TABLE public.campaigns 
DROP COLUMN IF EXISTS onboarding_target_job_titles,
DROP COLUMN IF EXISTS onboarding_industries_to_target,
DROP COLUMN IF EXISTS onboarding_company_size_range,
DROP COLUMN IF EXISTS onboarding_required_skills,
DROP COLUMN IF EXISTS onboarding_locations_to_target,
DROP COLUMN IF EXISTS onboarding_excluded_industries,
DROP COLUMN IF EXISTS onboarding_example_ideal_companies,
DROP COLUMN IF EXISTS onboarding_value_proposition,
DROP COLUMN IF EXISTS onboarding_key_pain_points,
DROP COLUMN IF EXISTS onboarding_unique_differentiator,
DROP COLUMN IF EXISTS onboarding_example_messaging,
DROP COLUMN IF EXISTS onboarding_common_objections,
DROP COLUMN IF EXISTS onboarding_recommended_responses,
DROP COLUMN IF EXISTS onboarding_compliance_notes,
DROP COLUMN IF EXISTS onboarding_qualified_prospect_definition,
DROP COLUMN IF EXISTS onboarding_disqualifying_factors,
DROP COLUMN IF EXISTS onboarding_scheduling_link,
DROP COLUMN IF EXISTS onboarding_target_timezone,
DROP COLUMN IF EXISTS onboarding_booking_instructions,
DROP COLUMN IF EXISTS onboarding_bdr_notes;