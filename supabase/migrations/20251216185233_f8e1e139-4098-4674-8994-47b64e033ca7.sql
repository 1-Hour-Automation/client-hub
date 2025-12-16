-- Create the handle_updated_at function first
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add calendar integration columns to clients table
ALTER TABLE public.clients
ADD COLUMN calendar_connected boolean DEFAULT false,
ADD COLUMN calendar_provider text,
ADD COLUMN availability_settings jsonb DEFAULT '{}'::jsonb;

-- Create event_types table for scheduling templates
CREATE TABLE public.event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  duration integer NOT NULL DEFAULT 30,
  slug text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(slug)
);

-- Create event_type_assignments table to link event types to clients
CREATE TABLE public.event_type_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id uuid NOT NULL REFERENCES public.event_types(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_type_id, client_id)
);

-- Enable RLS on event_types
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;

-- Policies for event_types (internal users only)
CREATE POLICY "Internal users can view all event types"
ON public.event_types
FOR SELECT
USING (is_internal_user(auth.uid()));

CREATE POLICY "Internal users can manage event types"
ON public.event_types
FOR ALL
USING (is_internal_user(auth.uid()))
WITH CHECK (is_internal_user(auth.uid()));

-- Enable RLS on event_type_assignments
ALTER TABLE public.event_type_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for event_type_assignments
CREATE POLICY "Internal users can view all assignments"
ON public.event_type_assignments
FOR SELECT
USING (is_internal_user(auth.uid()));

CREATE POLICY "Internal users can manage assignments"
ON public.event_type_assignments
FOR ALL
USING (is_internal_user(auth.uid()))
WITH CHECK (is_internal_user(auth.uid()));

CREATE POLICY "Client users can view their assignments"
ON public.event_type_assignments
FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

-- Create trigger for updated_at on event_types
CREATE TRIGGER update_event_types_updated_at
BEFORE UPDATE ON public.event_types
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();