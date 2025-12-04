# ⚡ QUICK START - Test Account Setup

## ✅ Users Created Successfully!

Your test users have been created in Supabase:

```
✅ admin@clinic.test
✅ provider@clinic.test  
✅ assistant@clinic.test
✅ patient@test.com
```

## 🔧 One More Step: Assign Roles

To complete setup, run this SQL in Supabase:

### Option 1: Quick SQL (Recommended)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. Click "New Query"
3. Copy and paste this:

```sql
-- Temporarily disable RLS
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Assign roles
INSERT INTO user_roles (user_id, role)
SELECT id, 'clinic_admin'::app_role FROM auth.users WHERE email = 'admin@clinic.test'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'provider'::app_role FROM auth.users WHERE email = 'provider@clinic.test'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'assistant'::app_role FROM auth.users WHERE email = 'assistant@clinic.test'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'patient'::app_role FROM auth.users WHERE email = 'patient@test.com'
ON CONFLICT DO NOTHING;

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
```

4. Click **"Run"**
5. You should see "Success. No rows returned"

### Option 2: Use SQL File

1. Open Supabase Dashboard → SQL Editor
2. Open the file `assign-roles.sql` from your project
3. Copy all contents
4. Paste and Run

---

## 🎉 NOW YOU CAN LOGIN!

### Test Clinic Portal

1. Open: `http://localhost:8080`
2. Click **"Clinic Sign In"**
3. Login with:

```
Email:    admin@clinic.test
Password: Admin123!
```

✅ **You should see the Dashboard!**

### Test Patient Portal

1. Open: `http://localhost:8080`
2. Click **"Patient Sign In"**
3. Login with:

```
Email:    patient@test.com
Password: Patient123!
```

✅ **You should see the Patient Portal!**

---

## 📝 All Login Credentials

### Clinic Portal
```
Admin:     admin@clinic.test / Admin123!
Provider:  provider@clinic.test / Provider123!
Assistant: assistant@clinic.test / Assistant123!
```

### Patient Portal
```
Patient: patient@test.com / Patient123!
```

---

## 🐛 Still Can't Login?

### Check 1: Verify Users Exist
Go to: Supabase → Authentication → Users

You should see all 4 emails with "Confirmed" status ✅

### Check 2: Verify Roles Were Assigned

Run this SQL query:

```sql
SELECT u.email, ur.role 
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email LIKE '%@clinic.test' OR u.email LIKE '%@test.com';
```

You should see:
- admin@clinic.test → clinic_admin
- provider@clinic.test → provider
- assistant@clinic.test → assistant
- patient@test.com → patient

### Check 3: Browser Console

1. Try to login
2. Press F12 to open Developer Tools
3. Check Console tab for errors
4. Check Network tab for failed requests

### Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid login credentials" | Users exist but maybe wrong password (case-sensitive!) |
| Login works but blank screen | Roles not assigned - run SQL above |
| "User not found" | Run create-test-users.js again |
| Console errors | Check Supabase connection in .env |

---

## 🚀 Next: Start Testing!

Once login works:

1. **Quick Test (5 min):** `docs/QUICK_TEST_GUIDE.md`
2. **Full Testing (2-3 hours):** `docs/TESTING_GUIDE.md`
3. **Track Progress:** `docs/TEST_CHECKLIST.md`

---

## 🔄 Need to Reset?

If you want to start over:

1. Delete users in Supabase Dashboard
2. Run `npm run create-test-users` again
3. Run the SQL to assign roles again

---

**You're almost there! Just run that SQL and you can login! 🎉**

