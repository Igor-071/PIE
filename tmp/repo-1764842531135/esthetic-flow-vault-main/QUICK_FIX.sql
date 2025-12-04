-- ==================================================
-- QUICK FIX FOR LOVABLE PROJECT
-- Send this to Lovable support or run in SQL Editor
-- ==================================================

-- Allow users to read their own roles (CRITICAL for login)
CREATE POLICY IF NOT EXISTS "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Verify the policy was created
SELECT 
  tablename, 
  policyname, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;

