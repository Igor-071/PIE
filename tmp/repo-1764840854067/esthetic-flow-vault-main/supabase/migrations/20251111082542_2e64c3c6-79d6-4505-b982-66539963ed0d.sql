-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('clinic_admin', 'provider', 'assistant', 'read_only', 'patient');

-- Create user_roles table (CRITICAL: separate from profiles!)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table (clinic staff)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  clinic_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Patients table (medical records)
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  email TEXT,
  medical_history TEXT,
  allergies TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Patient users table (links auth to patients)
CREATE TABLE public.patient_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE UNIQUE,
  phone TEXT,
  email TEXT,
  push_token TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.patient_users ENABLE ROW LEVEL SECURITY;

-- Treatments table
CREATE TABLE public.treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.profiles(id),
  treatment_type TEXT NOT NULL,
  treatment_date DATE NOT NULL,
  areas_treated TEXT[],
  units_used INTEGER,
  product_name TEXT,
  lot_number TEXT,
  notes TEXT,
  before_photos TEXT[],
  after_photos TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

-- Implants registry
CREATE TABLE public.implants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  device_name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  model_number TEXT,
  lot_number TEXT NOT NULL,
  serial_number TEXT,
  udi TEXT,
  implant_date DATE NOT NULL,
  body_side TEXT CHECK (body_side IN ('left', 'right', 'bilateral', 'n/a')),
  warranty_expiration DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.implants ENABLE ROW LEVEL SECURITY;

-- Inventory tracking
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  lot_number TEXT NOT NULL,
  units_available INTEGER NOT NULL DEFAULT 0,
  expiration_date DATE NOT NULL,
  manufacturer TEXT,
  added_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Treatment templates
CREATE TABLE public.treatment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  areas JSONB NOT NULL,
  default_units INTEGER,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.treatment_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for profiles
CREATE POLICY "Clinic staff can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'clinic_admin') OR
  public.has_role(auth.uid(), 'provider') OR
  public.has_role(auth.uid(), 'assistant') OR
  public.has_role(auth.uid(), 'read_only')
);

CREATE POLICY "Clinic staff can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Clinic staff can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- RLS Policies for patients
CREATE POLICY "Clinic staff full access to patients"
ON public.patients FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'clinic_admin') OR
  public.has_role(auth.uid(), 'provider') OR
  public.has_role(auth.uid(), 'assistant') OR
  public.has_role(auth.uid(), 'read_only')
);

CREATE POLICY "Patients can view own record"
ON public.patients FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'patient') AND
  id IN (SELECT patient_id FROM public.patient_users WHERE id = auth.uid())
);

-- RLS Policies for patient_users
CREATE POLICY "Users can view own patient_users"
ON public.patient_users FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Clinic staff can view all patient_users"
ON public.patient_users FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'clinic_admin') OR
  public.has_role(auth.uid(), 'provider') OR
  public.has_role(auth.uid(), 'assistant') OR
  public.has_role(auth.uid(), 'read_only')
);

-- RLS Policies for treatments
CREATE POLICY "Clinic staff manage treatments"
ON public.treatments FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'clinic_admin') OR
  public.has_role(auth.uid(), 'provider') OR
  public.has_role(auth.uid(), 'assistant')
)
WITH CHECK (
  public.has_role(auth.uid(), 'clinic_admin') OR
  public.has_role(auth.uid(), 'provider') OR
  public.has_role(auth.uid(), 'assistant')
);

CREATE POLICY "Read only staff can view treatments"
ON public.treatments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'read_only'));

CREATE POLICY "Patients view own treatments"
ON public.treatments FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'patient') AND
  patient_id IN (SELECT patient_id FROM public.patient_users WHERE id = auth.uid())
);

-- RLS Policies for implants
CREATE POLICY "Clinic staff manage implants"
ON public.implants FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'clinic_admin') OR
  public.has_role(auth.uid(), 'provider') OR
  public.has_role(auth.uid(), 'assistant')
)
WITH CHECK (
  public.has_role(auth.uid(), 'clinic_admin') OR
  public.has_role(auth.uid(), 'provider') OR
  public.has_role(auth.uid(), 'assistant')
);

CREATE POLICY "Read only staff can view implants"
ON public.implants FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'read_only'));

CREATE POLICY "Patients view own implants"
ON public.implants FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'patient') AND
  patient_id IN (SELECT patient_id FROM public.patient_users WHERE id = auth.uid())
);

-- RLS Policies for inventory
CREATE POLICY "Clinic staff manage inventory"
ON public.inventory FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'clinic_admin') OR
  public.has_role(auth.uid(), 'provider') OR
  public.has_role(auth.uid(), 'assistant')
)
WITH CHECK (
  public.has_role(auth.uid(), 'clinic_admin') OR
  public.has_role(auth.uid(), 'provider') OR
  public.has_role(auth.uid(), 'assistant')
);

CREATE POLICY "Read only staff can view inventory"
ON public.inventory FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'read_only'));

-- RLS Policies for treatment_templates
CREATE POLICY "Clinic staff manage templates"
ON public.treatment_templates FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'clinic_admin') OR
  public.has_role(auth.uid(), 'provider') OR
  public.has_role(auth.uid(), 'assistant')
)
WITH CHECK (
  public.has_role(auth.uid(), 'clinic_admin') OR
  public.has_role(auth.uid(), 'provider') OR
  public.has_role(auth.uid(), 'assistant')
);

CREATE POLICY "Read only staff can view templates"
ON public.treatment_templates FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'read_only'));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at
BEFORE UPDATE ON public.treatments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_implants_updated_at
BEFORE UPDATE ON public.implants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();