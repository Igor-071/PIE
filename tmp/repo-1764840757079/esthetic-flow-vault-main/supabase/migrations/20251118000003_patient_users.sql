-- =============================================
-- Patient Users Migration
-- Link Supabase Auth users to patient records
-- =============================================

-- Create patient_users table
CREATE TABLE IF NOT EXISTS patient_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id) -- One patient can only have one user account
);

-- Enable RLS
ALTER TABLE patient_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own patient_user record"
  ON patient_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own patient_user record"
  ON patient_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Clinic staff can view all patient_users"
  ON patient_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Clinic admins can manage patient_users"
  ON patient_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_users_patient_id ON patient_users(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_users_email ON patient_users(email);
CREATE INDEX IF NOT EXISTS idx_patient_users_is_active ON patient_users(is_active);

-- Function to update last_login timestamp
CREATE OR REPLACE FUNCTION update_patient_last_login()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_login = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_patient_users_updated_at BEFORE UPDATE ON patient_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE patient_users IS 'Links Supabase Auth users to patient records for patient portal access';
COMMENT ON COLUMN patient_users.id IS 'References auth.users.id - the Supabase Auth user ID';
COMMENT ON COLUMN patient_users.patient_id IS 'References patients.id - links to patient medical record';
COMMENT ON COLUMN patient_users.is_active IS 'Whether the patient portal account is active';
COMMENT ON COLUMN patient_users.last_login IS 'Timestamp of last successful login';

