# 🔧 Troubleshooting Login Issues

## ✅ **Things to Check:**

### 1. Verify Roles in Database

Go to Lovable → Database → `user_roles` table

You should see exactly 4 rows:
```
user_id: 555703a9-a729-4c36-b8da-39cbf8edf581 | role: clinic_admin
user_id: [provider ID] | role: provider
user_id: [assistant ID] | role: assistant  
user_id: [patient ID] | role: patient
```

### 2. Clear Browser Cache

**Chrome/Edge:**
- Press `Cmd + Shift + Delete` (Mac) or `Ctrl + Shift + Delete` (Windows)
- Select "Cached images and files"
- Click "Clear data"

**Or use Incognito/Private window:**
- `Cmd + Shift + N` (Mac) or `Ctrl + Shift + N` (Windows)
- Try login in private window

### 3. Hard Refresh the App

- Go to: `http://localhost:8080/login/clinic`
- Press `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
- This forces a hard refresh

### 4. Check Browser Console for Errors

1. Press `F12` or `Cmd + Option + I` (Mac)
2. Click **"Console"** tab
3. Try to login
4. Look for red error messages

**Common errors:**
- "Error fetching user role" - Role not found
- "User not authorized" - RLS policy issue
- Network errors - Connection problem

### 5. Restart Dev Server

In your terminal:
```bash
# Stop the server (Ctrl + C)
# Then restart:
npm run dev
```

## 🐛 **If You See Error Messages:**

### Error: "Invalid login credentials"
- Username or password is wrong
- Try: `admin@clinic.test` / `Admin123!` (case-sensitive!)

### Error: Login works but redirects to blank page
- Role is not assigned
- Go back to step 1 and verify roles exist

### Error: "Error fetching user role"
- The `user_roles` table is empty
- Add roles again in Lovable

## 📊 **Debug Query:**

To check if roles are properly assigned, in Lovable SQL editor run:

```sql
SELECT 
  u.email,
  u.id as user_id,
  ur.role,
  CASE 
    WHEN ur.role IS NULL THEN '❌ NO ROLE ASSIGNED'
    ELSE '✅ Role OK'
  END as status
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email IN (
  'admin@clinic.test',
  'provider@clinic.test',
  'assistant@clinic.test',
  'patient@test.com'
)
ORDER BY u.email;
```

Expected result:
```
admin@clinic.test | [uuid] | clinic_admin | ✅ Role OK
assistant@clinic.test | [uuid] | assistant | ✅ Role OK
patient@test.com | [uuid] | patient | ✅ Role OK
provider@clinic.test | [uuid] | provider | ✅ Role OK
```

If you see "❌ NO ROLE ASSIGNED" then roles weren't saved properly.

## 🔄 **Nuclear Option: Reset Everything**

If nothing works, delete and recreate:

```sql
-- Delete all test users
DELETE FROM user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@clinic.test' OR email LIKE '%@test.com'
);
```

Then go to `/setup` page and click "Create Test Accounts" again.

## 📞 **Still Not Working?**

Check these:
1. Is dev server running? (`npm run dev`)
2. Is Supabase project active? (not paused)
3. Are you using the right URL? (`http://localhost:8080`)
4. Did you try in incognito/private window?
5. Any firewall/VPN blocking connections?

