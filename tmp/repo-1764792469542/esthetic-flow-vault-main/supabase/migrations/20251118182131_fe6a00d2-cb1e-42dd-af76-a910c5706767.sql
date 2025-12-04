-- Fix test users: Add missing email_change column
UPDATE auth.users 
SET email_change = ''
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);