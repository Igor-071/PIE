-- Create documents table for patient documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type
  file_size BIGINT NOT NULL, -- bytes
  storage_path TEXT NOT NULL, -- path in Supabase Storage
  document_type TEXT NOT NULL, -- e.g., "consent_form", "medical_record", "insurance", "photo"
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_documents_patient ON documents(patient_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_created ON documents(created_at DESC);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Authenticated users can view all documents
CREATE POLICY "Users can view all documents" ON documents
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can upload documents
CREATE POLICY "Users can upload documents" ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can delete documents
CREATE POLICY "Users can delete documents" ON documents
  FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create treatment_photos table for before/after photos
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

-- Create indexes
CREATE INDEX idx_treatment_photos_treatment ON treatment_photos(treatment_id);
CREATE INDEX idx_treatment_photos_patient ON treatment_photos(patient_id);
CREATE INDEX idx_treatment_photos_type ON treatment_photos(photo_type);

-- Enable RLS
ALTER TABLE treatment_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for treatment_photos
CREATE POLICY "Users can view treatment photos" ON treatment_photos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upload treatment photos" ON treatment_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete treatment photos" ON treatment_photos
  FOR DELETE
  TO authenticated
  USING (true);

-- Note: Storage buckets and policies must be created via Supabase Dashboard or API
-- We'll handle this in the application code
COMMENT ON TABLE documents IS 'Stores metadata for patient documents (consent forms, records, etc.)';
COMMENT ON TABLE treatment_photos IS 'Stores metadata for before/after treatment photos';

