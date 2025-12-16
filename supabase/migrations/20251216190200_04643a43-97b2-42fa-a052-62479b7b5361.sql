-- Add enhanced fields to event_types table
ALTER TABLE public.event_types
ADD COLUMN buffer_time_mins integer DEFAULT 15,
ADD COLUMN booking_questions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN title_template text DEFAULT 'Intro with {{contact_name}}';

-- Add sync fields to clients table
ALTER TABLE public.clients
ADD COLUMN sync_enabled boolean DEFAULT false,
ADD COLUMN last_synced_at timestamp with time zone,
ADD COLUMN watched_calendars jsonb DEFAULT '[]'::jsonb;

-- Create email_reminders table to track sent reminders
CREATE TABLE public.email_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  reminder_type text NOT NULL,
  scheduled_for timestamp with time zone NOT NULL,
  sent_at timestamp with time zone,
  status text DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on email_reminders
ALTER TABLE public.email_reminders ENABLE ROW LEVEL SECURITY;

-- Policies for email_reminders
CREATE POLICY "Internal users can manage email reminders"
ON public.email_reminders
FOR ALL
USING (is_internal_user(auth.uid()))
WITH CHECK (is_internal_user(auth.uid()));

-- Index for finding pending reminders
CREATE INDEX idx_email_reminders_pending ON public.email_reminders(scheduled_for) WHERE status = 'pending';