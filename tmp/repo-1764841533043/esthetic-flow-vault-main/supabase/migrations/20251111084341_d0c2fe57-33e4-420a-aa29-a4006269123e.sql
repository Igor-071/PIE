-- Add provider fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create storage buckets for photos
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('treatment-photos', 'treatment-photos', true),
  ('provider-avatars', 'provider-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for treatment photos
CREATE POLICY "Anyone can view treatment photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'treatment-photos');

CREATE POLICY "Clinic staff can upload treatment photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'treatment-photos' AND
  (has_role(auth.uid(), 'clinic_admin'::app_role) OR 
   has_role(auth.uid(), 'provider'::app_role) OR 
   has_role(auth.uid(), 'assistant'::app_role))
);

-- Storage policies for provider avatars
CREATE POLICY "Anyone can view provider avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'provider-avatars');

CREATE POLICY "Clinic staff can upload provider avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'provider-avatars' AND
  (has_role(auth.uid(), 'clinic_admin'::app_role) OR 
   has_role(auth.uid(), 'provider'::app_role))
);