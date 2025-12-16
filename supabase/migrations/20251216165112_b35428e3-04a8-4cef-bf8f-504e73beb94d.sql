-- Add last_sign_in_at column to track user setup completion
ALTER TABLE public.user_profiles 
ADD COLUMN last_sign_in_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment explaining purpose
COMMENT ON COLUMN public.user_profiles.last_sign_in_at IS 'Tracks when user last signed in - null means invite pending';