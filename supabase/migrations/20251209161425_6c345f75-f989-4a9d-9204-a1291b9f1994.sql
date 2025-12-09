-- Add soft delete column to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;