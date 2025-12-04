# 🚨 URGENT: Lovable Support Request - RLS Policy Missing

## Problem
Users cannot log into the clinic portal after role-based navigation was added. The `user_roles` table has Row Level Security (RLS) enabled but is missing a critical SELECT policy.

## Root Cause
The `user_roles` table blocks users from reading their own roles due to missing RLS policies.

## Required Fix
Please run this SQL in the Supabase database:

```sql
-- CRITICAL: Allow users to read their own roles (needed for login)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

## Verification
After running the SQL, verify with:

```sql
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'user_roles';
```

You should see policies for both INSERT and SELECT operations.

## Impact
**HIGH** - Without this fix, clinic staff cannot log in.

## Workaround
Until fixed, the app shows all navigation items to all users as a fallback.

---

### For Lovable Support Team

This is a standard RLS policy needed for the `user_roles` table. The migration file is located at:
`supabase/migrations/20251118120000_setup_helper.sql`

The migration includes the policy but hasn't been applied to the production database yet.

