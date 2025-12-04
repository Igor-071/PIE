-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 60,
  appointment_type TEXT NOT NULL, -- e.g., "Consultation", "Treatment", "Follow-up"
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for common queries
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_provider ON appointments(provider_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Authenticated users can view all appointments
CREATE POLICY "Users can view all appointments" ON appointments
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create appointments
CREATE POLICY "Users can create appointments" ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update appointments
CREATE POLICY "Users can update appointments" ON appointments
  FOR UPDATE
  TO authenticated
  USING (true);

-- Authenticated users can delete appointments
CREATE POLICY "Users can delete appointments" ON appointments
  FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed some sample appointments
INSERT INTO appointments (patient_id, appointment_date, appointment_type, status, notes)
SELECT 
  p.id,
  now() + (random() * interval '30 days'),
  CASE (random() * 3)::int
    WHEN 0 THEN 'Consultation'
    WHEN 1 THEN 'Treatment'
    WHEN 2 THEN 'Follow-up'
    ELSE 'Treatment'
  END,
  CASE (random() * 2)::int
    WHEN 0 THEN 'scheduled'
    WHEN 1 THEN 'confirmed'
    ELSE 'scheduled'
  END,
  'Initial appointment'
FROM patients p
LIMIT 5;

