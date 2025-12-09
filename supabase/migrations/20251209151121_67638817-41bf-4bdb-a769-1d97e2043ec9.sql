-- Create call_logs table for tracking outbound calls
CREATE TABLE public.call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  company TEXT,
  phone_number TEXT NOT NULL,
  disposition TEXT NOT NULL,
  call_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies matching existing pattern
CREATE POLICY "Client users can view their call logs"
ON public.call_logs
FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Internal users can view all call logs"
ON public.call_logs
FOR SELECT
USING (is_internal_user(auth.uid()));

CREATE POLICY "Internal users can manage call logs"
ON public.call_logs
FOR ALL
USING (is_internal_user(auth.uid()))
WITH CHECK (is_internal_user(auth.uid()));

-- Add index for faster campaign queries
CREATE INDEX idx_call_logs_campaign_id ON public.call_logs(campaign_id);
CREATE INDEX idx_call_logs_call_time ON public.call_logs(call_time DESC);