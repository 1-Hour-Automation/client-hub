-- Add new fields to clients table for Account Profile
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS legal_business_name text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS registered_address text,
ADD COLUMN IF NOT EXISTS billing_address text,
ADD COLUMN IF NOT EXISTS primary_contact_name text,
ADD COLUMN IF NOT EXISTS primary_contact_title text,
ADD COLUMN IF NOT EXISTS primary_contact_email text,
ADD COLUMN IF NOT EXISTS primary_contact_phone text,
ADD COLUMN IF NOT EXISTS billing_contact_name text,
ADD COLUMN IF NOT EXISTS billing_contact_email text,
ADD COLUMN IF NOT EXISTS billing_contact_phone text,
ADD COLUMN IF NOT EXISTS invoice_method text,
ADD COLUMN IF NOT EXISTS billing_notes text,
ADD COLUMN IF NOT EXISTS secondary_contacts jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS team_members_with_access jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS registration_number text,
ADD COLUMN IF NOT EXISTS vat_number text,
ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'GBP',
ADD COLUMN IF NOT EXISTS invoicing_frequency text DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS preferred_channel text,
ADD COLUMN IF NOT EXISTS meeting_link text,
ADD COLUMN IF NOT EXISTS best_times text,
ADD COLUMN IF NOT EXISTS timezone text,
ADD COLUMN IF NOT EXISTS client_notes text;

-- Add RLS policy for client users to update their own client record
CREATE POLICY "Client users can update their own client"
ON public.clients
FOR UPDATE
USING (id = get_user_client_id(auth.uid()))
WITH CHECK (id = get_user_client_id(auth.uid()));