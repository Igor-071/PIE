-- Helper function for setup page to assign roles
-- This allows users to assign their own role during setup

CREATE OR REPLACE FUNCTION assign_user_role(p_user_id uuid, p_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow if called by the user themselves or no role exists yet
  IF auth.uid() = p_user_id OR NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id) THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, p_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION assign_user_role(uuid, app_role) TO authenticated;

-- Allow users to insert their own roles during setup
CREATE POLICY "Users can insert own role during setup"
ON user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- CRITICAL: Allow users to read their own roles (needed for login)
CREATE POLICY "Users can view their own roles"
ON user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

