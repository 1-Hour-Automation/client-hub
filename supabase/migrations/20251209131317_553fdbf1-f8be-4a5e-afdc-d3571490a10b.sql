
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'bdr', 'client');

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's client_id
CREATE OR REPLACE FUNCTION public.get_user_client_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id
  FROM public.user_profiles
  WHERE id = _user_id
$$;

-- Function to check if user is internal (admin or bdr)
CREATE OR REPLACE FUNCTION public.is_internal_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'bdr')
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Internal users can view all profiles"
ON public.user_profiles FOR SELECT
TO authenticated
USING (public.is_internal_user(auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- RLS Policies for clients
CREATE POLICY "Internal users can view all clients"
ON public.clients FOR SELECT
TO authenticated
USING (public.is_internal_user(auth.uid()));

CREATE POLICY "Client users can view their own client"
ON public.clients FOR SELECT
TO authenticated
USING (id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Internal users can manage clients"
ON public.clients FOR ALL
TO authenticated
USING (public.is_internal_user(auth.uid()))
WITH CHECK (public.is_internal_user(auth.uid()));

-- RLS Policies for campaigns
CREATE POLICY "Internal users can view all campaigns"
ON public.campaigns FOR SELECT
TO authenticated
USING (public.is_internal_user(auth.uid()));

CREATE POLICY "Client users can view their campaigns"
ON public.campaigns FOR SELECT
TO authenticated
USING (client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Internal users can manage campaigns"
ON public.campaigns FOR ALL
TO authenticated
USING (public.is_internal_user(auth.uid()))
WITH CHECK (public.is_internal_user(auth.uid()));

-- RLS Policies for contacts
CREATE POLICY "Internal users can view all contacts"
ON public.contacts FOR SELECT
TO authenticated
USING (public.is_internal_user(auth.uid()));

CREATE POLICY "Client users can view their contacts"
ON public.contacts FOR SELECT
TO authenticated
USING (client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Internal users can manage contacts"
ON public.contacts FOR ALL
TO authenticated
USING (public.is_internal_user(auth.uid()))
WITH CHECK (public.is_internal_user(auth.uid()));

-- RLS Policies for meetings
CREATE POLICY "Internal users can view all meetings"
ON public.meetings FOR SELECT
TO authenticated
USING (public.is_internal_user(auth.uid()));

CREATE POLICY "Client users can view their meetings"
ON public.meetings FOR SELECT
TO authenticated
USING (client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Internal users can manage meetings"
ON public.meetings FOR ALL
TO authenticated
USING (public.is_internal_user(auth.uid()))
WITH CHECK (public.is_internal_user(auth.uid()));

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_campaigns_client_id ON public.campaigns(client_id);
CREATE INDEX idx_contacts_client_id ON public.contacts(client_id);
CREATE INDEX idx_contacts_campaign_id ON public.contacts(campaign_id);
CREATE INDEX idx_meetings_client_id ON public.meetings(client_id);
CREATE INDEX idx_meetings_campaign_id ON public.meetings(campaign_id);
CREATE INDEX idx_meetings_contact_id ON public.meetings(contact_id);
CREATE INDEX idx_user_profiles_client_id ON public.user_profiles(client_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
