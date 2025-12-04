-- Create test users with encrypted passwords
-- Note: Supabase uses bcrypt hashing. We'll insert directly into auth.users

-- Delete existing test users if they exist
DELETE FROM auth.users WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

-- Create doctor user (doctor@doctor.com / 123456)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'doctor@doctor.com',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dr. Test Doctor"}',
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  ''
);

-- Create patient user (patient@patient.com / 123456)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'patient@patient.com',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test Patient"}',
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  ''
);

-- Insert into identities table for email provider
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"doctor@doctor.com"}',
  'email',
  now(),
  now(),
  now()
),
(
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  '{"sub":"22222222-2222-2222-2222-222222222222","email":"patient@patient.com"}',
  'email',
  now(),
  now(),
  now()
);

-- Assign roles
INSERT INTO public.user_roles (user_id, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'clinic_admin'),
  ('22222222-2222-2222-2222-222222222222', 'patient')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create profiles
INSERT INTO public.profiles (id, full_name, email, bio, specialties) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Dr. Test Doctor', 'doctor@doctor.com', 'Experienced aesthetic physician', ARRAY['Botox', 'Fillers'])
ON CONFLICT (id) DO NOTHING;

-- Create patient record
INSERT INTO public.patients (id, first_name, last_name, email, phone, date_of_birth) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Test', 'Patient', 'patient@patient.com', '555-0123', '1990-01-15')
ON CONFLICT (id) DO NOTHING;

-- Link patient user
INSERT INTO public.patient_users (id, patient_id, email) VALUES
  ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'patient@patient.com')
ON CONFLICT (id) DO NOTHING;