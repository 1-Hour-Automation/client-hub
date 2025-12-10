-- Add admin-only operational fields to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS account_manager text,
ADD COLUMN IF NOT EXISTS bdr_assigned text,
ADD COLUMN IF NOT EXISTS campaign_start_date date,
ADD COLUMN IF NOT EXISTS calling_timezone text,
ADD COLUMN IF NOT EXISTS calling_hours text,
ADD COLUMN IF NOT EXISTS sending_email_address text,
ADD COLUMN IF NOT EXISTS current_plan text,
ADD COLUMN IF NOT EXISTS performance_tier text,
ADD COLUMN IF NOT EXISTS quarterly_attendance_guarantee integer,
ADD COLUMN IF NOT EXISTS phase_history jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_updated_by text,
ADD COLUMN IF NOT EXISTS last_updated_at timestamp with time zone DEFAULT now();