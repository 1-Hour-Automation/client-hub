-- Update is_internal_user function to include 'am' role
CREATE OR REPLACE FUNCTION public.is_internal_user(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'bdr', 'am')
  )
$$;