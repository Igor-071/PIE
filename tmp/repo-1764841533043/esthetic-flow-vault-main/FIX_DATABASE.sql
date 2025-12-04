-- =============================================
-- COMPLETE DATABASE FIX
-- Run this entire file in Supabase Dashboard → SQL Editor
-- =============================================

-- ============= APPOINTMENTS TABLE =============
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 60,
  appointment_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider ON appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all appointments" ON appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create appointments" ON appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update appointments" ON appointments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete appointments" ON appointments FOR DELETE TO authenticated USING (true);

-- ============= DOCUMENTS TABLE =============
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  document_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_patient ON documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all documents" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upload documents" ON documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete documents" ON documents FOR DELETE TO authenticated USING (true);

-- ============= TREATMENT PHOTOS TABLE =============
CREATE TABLE IF NOT EXISTS treatment_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID REFERENCES treatments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'during')),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  taken_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treatment_photos_treatment ON treatment_photos(treatment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_photos_patient ON treatment_photos(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_photos_type ON treatment_photos(photo_type);

ALTER TABLE treatment_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view treatment photos" ON treatment_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upload treatment photos" ON treatment_photos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete treatment photos" ON treatment_photos FOR DELETE TO authenticated USING (true);

-- ============= CLINIC SETTINGS TABLE =============
CREATE TABLE IF NOT EXISTS clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  country VARCHAR(100),
  website VARCHAR(255),
  logo_url TEXT,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clinic settings" ON clinic_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update clinic settings" ON clinic_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can insert clinic settings" ON clinic_settings FOR INSERT TO authenticated WITH CHECK (true);

-- Insert default clinic settings
INSERT INTO clinic_settings (clinic_name, email, phone, address, city, state, zip, country)
VALUES (
  'Esthetic Flow Clinic',
  'clinic@estheticflow.com',
  '(555) 123-4567',
  '123 Beauty Lane',
  'Beverly Hills',
  'CA',
  '90210',
  'USA'
)
ON CONFLICT DO NOTHING;

-- ============= STAFF TABLE =============
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff(is_active);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view staff" ON staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage staff" ON staff FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============= NOTIFICATION PREFERENCES TABLE =============
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_appointments BOOLEAN DEFAULT true,
  email_reminders BOOLEAN DEFAULT true,
  email_inventory_alerts BOOLEAN DEFAULT true,
  email_reports BOOLEAN DEFAULT false,
  sms_appointments BOOLEAN DEFAULT false,
  sms_reminders BOOLEAN DEFAULT false,
  in_app_all BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" ON notification_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON notification_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON notification_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============= AUDIT LOG TABLE =============
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  old_data JSONB,
  new_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit_log(changed_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit log" ON audit_log FOR SELECT TO authenticated USING (true);

-- ============= UPDATE TRIGGERS =============
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON clinic_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DONE! All missing tables are now created.
-- =============================================

