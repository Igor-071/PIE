-- Assign roles to test users
-- Run this to fix role assignment

-- Temporarily disable RLS to insert roles
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Delete any existing roles for test users
DELETE FROM user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('admin@clinic.test', 'provider@clinic.test', 'assistant@clinic.test', 'patient@test.com')
);

-- Assign admin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'clinic_admin'::app_role
FROM auth.users
WHERE email = 'admin@clinic.test'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign provider role
INSERT INTO user_roles (user_id, role)
SELECT id, 'provider'::app_role
FROM auth.users
WHERE email = 'provider@clinic.test'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign assistant role
INSERT INTO user_roles (user_id, role)
SELECT id, 'assistant'::app_role
FROM auth.users
WHERE email = 'assistant@clinic.test'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign patient role
INSERT INTO user_roles (user_id, role)
SELECT id, 'patient'::app_role
FROM auth.users
WHERE email = 'patient@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Verify roles were assigned
SELECT 
  u.email,
  ur.role,
  'Role assigned successfully' as status
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email IN ('admin@clinic.test', 'provider@clinic.test', 'assistant@clinic.test', 'patient@test.com')
ORDER BY u.email;

