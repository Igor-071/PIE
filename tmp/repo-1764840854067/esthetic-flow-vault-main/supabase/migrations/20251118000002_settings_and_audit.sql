-- =============================================
-- Settings & Audit Log Migration
-- =============================================

-- Clinic Settings Table
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

-- Team Members / Staff Table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL, -- 'admin', 'provider', 'staff'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Preferences Table
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

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  old_data JSONB,
  new_data JSONB
);

-- Add created_by and updated_by to existing tables
ALTER TABLE patients ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE treatments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE implants ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE implants ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff(is_active);

-- RLS Policies for clinic_settings
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clinic settings"
  ON clinic_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update clinic settings"
  ON clinic_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can insert clinic settings"
  ON clinic_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for staff
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view staff"
  ON staff FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage staff"
  ON staff FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (true);

-- Insert default clinic settings if none exist
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

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON clinic_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Audit Log Triggers
-- ============================================

-- Function to log INSERT events to audit_log
CREATE OR REPLACE FUNCTION audit_log_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, changed_by, new_data)
  VALUES (
    TG_TABLE_NAME,
    NEW.id::uuid,
    'INSERT',
    auth.uid(),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log UPDATE events to audit_log
CREATE OR REPLACE FUNCTION audit_log_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    NEW.id::uuid,
    'UPDATE',
    auth.uid(),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log DELETE events to audit_log
CREATE OR REPLACE FUNCTION audit_log_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data)
  VALUES (
    TG_TABLE_NAME,
    OLD.id::uuid,
    'DELETE',
    auth.uid(),
    to_jsonb(OLD)
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for patients
CREATE TRIGGER audit_patients_insert AFTER INSERT ON patients
  FOR EACH ROW EXECUTE FUNCTION audit_log_insert();
CREATE TRIGGER audit_patients_update AFTER UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION audit_log_update();
CREATE TRIGGER audit_patients_delete AFTER DELETE ON patients
  FOR EACH ROW EXECUTE FUNCTION audit_log_delete();

-- Create audit triggers for treatments
CREATE TRIGGER audit_treatments_insert AFTER INSERT ON treatments
  FOR EACH ROW EXECUTE FUNCTION audit_log_insert();
CREATE TRIGGER audit_treatments_update AFTER UPDATE ON treatments
  FOR EACH ROW EXECUTE FUNCTION audit_log_update();
CREATE TRIGGER audit_treatments_delete AFTER DELETE ON treatments
  FOR EACH ROW EXECUTE FUNCTION audit_log_delete();

-- Create audit triggers for implants
CREATE TRIGGER audit_implants_insert AFTER INSERT ON implants
  FOR EACH ROW EXECUTE FUNCTION audit_log_insert();
CREATE TRIGGER audit_implants_update AFTER UPDATE ON implants
  FOR EACH ROW EXECUTE FUNCTION audit_log_update();
CREATE TRIGGER audit_implants_delete AFTER DELETE ON implants
  FOR EACH ROW EXECUTE FUNCTION audit_log_delete();

-- Create audit triggers for inventory
CREATE TRIGGER audit_inventory_insert AFTER INSERT ON inventory
  FOR EACH ROW EXECUTE FUNCTION audit_log_insert();
CREATE TRIGGER audit_inventory_update AFTER UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION audit_log_update();
CREATE TRIGGER audit_inventory_delete AFTER DELETE ON inventory
  FOR EACH ROW EXECUTE FUNCTION audit_log_delete();

-- Create audit triggers for appointments
CREATE TRIGGER audit_appointments_insert AFTER INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION audit_log_insert();
CREATE TRIGGER audit_appointments_update AFTER UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION audit_log_update();
CREATE TRIGGER audit_appointments_delete AFTER DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION audit_log_delete();

