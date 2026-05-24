-- Add provincia column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provincia TEXT;

-- Update RLS policy to allow updates to provincia
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
