-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  status text NOT NULL DEFAULT 'open',
  requires_client_action boolean NOT NULL DEFAULT false,
  visible_to_client boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add check constraints for valid values
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('script_approval', 'meeting_update', 'data_issue', 'general_notice'));
  
ALTER TABLE public.notifications ADD CONSTRAINT notifications_severity_check 
  CHECK (severity IN ('info', 'warning', 'critical'));
  
ALTER TABLE public.notifications ADD CONSTRAINT notifications_status_check 
  CHECK (status IN ('open', 'resolved'));

-- Create indexes for common queries
CREATE INDEX idx_notifications_client_id ON public.notifications(client_id);
CREATE INDEX idx_notifications_campaign_id ON public.notifications(campaign_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Internal users (admin/bdr) can view all notifications
CREATE POLICY "Internal users can view all notifications"
ON public.notifications
FOR SELECT
USING (is_internal_user(auth.uid()));

-- Internal users (admin/bdr) can manage all notifications
CREATE POLICY "Internal users can manage notifications"
ON public.notifications
FOR ALL
USING (is_internal_user(auth.uid()))
WITH CHECK (is_internal_user(auth.uid()));

-- Client users can view their own notifications (only if visible_to_client is true)
CREATE POLICY "Client users can view their notifications"
ON public.notifications
FOR SELECT
USING (
  client_id = get_user_client_id(auth.uid())
  AND visible_to_client = true
);

-- Client users can update status to resolved on their own notifications
CREATE POLICY "Client users can resolve their notifications"
ON public.notifications
FOR UPDATE
USING (
  client_id = get_user_client_id(auth.uid())
  AND visible_to_client = true
)
WITH CHECK (
  client_id = get_user_client_id(auth.uid())
  AND visible_to_client = true
);