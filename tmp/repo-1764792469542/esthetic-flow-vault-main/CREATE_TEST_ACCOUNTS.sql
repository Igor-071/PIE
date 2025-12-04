-- =============================================
-- CREATE TEST ACCOUNTS FOR AESTHETICA
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- IMPORTANT: You need to create users through Supabase Auth Dashboard first!
-- This script only assigns roles to existing users.

-- After running this, use these test credentials:
-- 
-- CLINIC PORTAL:
-- Email: admin@clinic.test
-- Password: Admin123!
--
-- Email: provider@clinic.test  
-- Password: Provider123!
--
-- Email: assistant@clinic.test
-- Password: Assistant123!
--
-- PATIENT PORTAL:
-- Email: patient@test.com
-- Password: Patient123!

-- =============================================
-- STEP 1: First, create these users in Supabase Dashboard
-- =============================================
-- Go to: Authentication → Users → Add User (Manually)
-- Create each user with the emails and passwords listed above
-- Confirm their email immediately after creation

-- =============================================
-- STEP 2: After creating users, run this SQL to assign roles
-- =============================================

-- This function will help assign roles
CREATE OR REPLACE FUNCTION assign_test_roles()
RETURNS void AS $$
DECLARE
  admin_id uuid;
  provider_id uuid;
  assistant_id uuid;
  patient_id uuid;
BEGIN
  -- Get user IDs by email (they must exist first!)
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@clinic.test';
  SELECT id INTO provider_id FROM auth.users WHERE email = 'provider@clinic.test';
  SELECT id INTO assistant_id FROM auth.users WHERE email = 'assistant@clinic.test';
  SELECT id INTO patient_id FROM auth.users WHERE email = 'patient@test.com';

  -- Assign roles (delete existing first to avoid conflicts)
  
  IF admin_id IS NOT NULL THEN
    DELETE FROM user_roles WHERE user_id = admin_id;
    INSERT INTO user_roles (user_id, role)
    VALUES (admin_id, 'clinic_admin');
    RAISE NOTICE 'Admin role assigned to: %', admin_id;
  ELSE
    RAISE NOTICE 'Admin user not found. Create user with email: admin@clinic.test';
  END IF;

  IF provider_id IS NOT NULL THEN
    DELETE FROM user_roles WHERE user_id = provider_id;
    INSERT INTO user_roles (user_id, role)
    VALUES (provider_id, 'provider');
    RAISE NOTICE 'Provider role assigned to: %', provider_id;
  ELSE
    RAISE NOTICE 'Provider user not found. Create user with email: provider@clinic.test';
  END IF;

  IF assistant_id IS NOT NULL THEN
    DELETE FROM user_roles WHERE user_id = assistant_id;
    INSERT INTO user_roles (user_id, role)
    VALUES (assistant_id, 'assistant');
    RAISE NOTICE 'Assistant role assigned to: %', assistant_id;
  ELSE
    RAISE NOTICE 'Assistant user not found. Create user with email: assistant@clinic.test';
  END IF;

  IF patient_id IS NOT NULL THEN
    DELETE FROM user_roles WHERE user_id = patient_id;
    INSERT INTO user_roles (user_id, role)
    VALUES (patient_id, 'patient');
    RAISE NOTICE 'Patient role assigned to: %', patient_id;
  ELSE
    RAISE NOTICE 'Patient user not found. Create user with email: patient@test.com';
  END IF;

END;
$$ LANGUAGE plpgsql;

-- Run the function to assign roles
SELECT assign_test_roles();

-- Verify roles were assigned
SELECT 
  u.email,
  ur.role,
  u.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email IN (
  'admin@clinic.test',
  'provider@clinic.test', 
  'assistant@clinic.test',
  'patient@test.com'
)
ORDER BY u.email;

-- =============================================
-- STEP 3: Create a test patient record for the patient user
-- =============================================

DO $$
DECLARE
  patient_user_id uuid;
  patient_record_id uuid;
BEGIN
  -- Get patient user ID
  SELECT id INTO patient_user_id FROM auth.users WHERE email = 'patient@test.com';
  
  IF patient_user_id IS NOT NULL THEN
    -- Create patient record
    INSERT INTO patients (
      user_id,
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      city,
      state,
      zip,
      emergency_contact_name,
      emergency_contact_phone,
      allergies,
      medical_conditions
    ) VALUES (
      patient_user_id,
      'Jane',
      'Doe',
      'patient@test.com',
      '555-0123',
      '1990-01-15',
      'Female',
      '123 Test Street',
      'Los Angeles',
      'CA',
      '90001',
      'John Doe',
      '555-0124',
      'None',
      'None'
    )
    RETURNING id INTO patient_record_id;
    
    RAISE NOTICE 'Patient record created with ID: %', patient_record_id;
    
    -- Add a sample treatment for the patient
    INSERT INTO treatments (
      patient_id,
      treatment_date,
      treatment_type,
      areas_treated,
      products_used,
      units_used,
      notes,
      provider_notes
    ) VALUES (
      patient_record_id,
      now() - interval '30 days',
      'Botox Treatment',
      ARRAY['Forehead', 'Glabella'],
      ARRAY['Botox Cosmetic 100U'],
      ARRAY[25, 20],
      'Initial consultation and treatment. Patient tolerated procedure well.',
      'Standard dosing protocol followed. Follow-up in 2 weeks.'
    );
    
    RAISE NOTICE 'Sample treatment added for patient';
  ELSE
    RAISE NOTICE 'Patient user not found. Create user first.';
  END IF;
END $$;

-- =============================================
-- VERIFICATION QUERY
-- =============================================
-- Run this to verify everything is set up correctly
SELECT 
  'Total Users' as metric,
  COUNT(*) as count
FROM auth.users
WHERE email LIKE '%@clinic.test' OR email LIKE '%@test.com'

UNION ALL

SELECT 
  'Users with Roles' as metric,
  COUNT(*) as count
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email LIKE '%@clinic.test' OR u.email LIKE '%@test.com'

UNION ALL

SELECT 
  'Patient Records' as metric,
  COUNT(*) as count
FROM patients
WHERE email = 'patient@test.com';

-- =============================================
-- DONE! You can now login with these credentials:
-- =============================================
/*

CLINIC PORTAL (http://localhost:8080 → "Clinic Sign In"):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 Clinic Admin (Full Access)
   Email: admin@clinic.test
   Password: Admin123!

🔐 Provider (Medical Staff)
   Email: provider@clinic.test
   Password: Provider123!

🔐 Assistant (Limited Access)
   Email: assistant@clinic.test
   Password: Assistant123!


PATIENT PORTAL (http://localhost:8080 → "Patient Sign In"):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 Patient
   Email: patient@test.com
   Password: Patient123!
   
   This patient has:
   - Basic profile information
   - One sample treatment record
   - Ready for testing

*/

