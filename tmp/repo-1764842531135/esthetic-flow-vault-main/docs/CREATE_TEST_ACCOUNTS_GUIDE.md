# How to Create Test Accounts for Aesthetica

**Problem:** You can't login because no test accounts exist yet.  
**Solution:** Follow this guide to create test accounts in 5 minutes.

---

## 🚀 Quick Setup (Recommended)

### Step 1: Open Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **esthetic-flow-vault**
3. Click on **"Authentication"** in the left sidebar
4. Click on **"Users"** tab

### Step 2: Create Test Users

Click **"Add User"** button and create these 4 accounts:

#### 🔐 Account 1: Clinic Admin
```
Email: admin@clinic.test
Password: Admin123!
☑️ Auto Confirm User: YES
```
Click "Create User"

#### 🔐 Account 2: Provider (Doctor)
```
Email: provider@clinic.test
Password: Provider123!
☑️ Auto Confirm User: YES
```
Click "Create User"

#### 🔐 Account 3: Assistant
```
Email: assistant@clinic.test
Password: Assistant123!
☑️ Auto Confirm User: YES
```
Click "Create User"

#### 🔐 Account 4: Patient
```
Email: patient@test.com
Password: Patient123!
☑️ Auto Confirm User: YES
```
Click "Create User"

**Important:** Make sure to check ✅ **"Auto Confirm User"** for each account!

### Step 3: Assign Roles to Users

1. In Supabase Dashboard, click **"SQL Editor"** in left sidebar
2. Click **"New Query"**
3. Copy the entire content from `CREATE_TEST_ACCOUNTS.sql`
4. Paste it into the SQL Editor
5. Click **"Run"** button

You should see output like:
```
✓ Admin role assigned to: [uuid]
✓ Provider role assigned to: [uuid]
✓ Assistant role assigned to: [uuid]
✓ Patient role assigned to: [uuid]
✓ Patient record created
✓ Sample treatment added
```

---

## ✅ Test Your Login

### Test Clinic Portal

1. Open: `http://localhost:8080`
2. Click **"Clinic Sign In"**
3. Enter:
   ```
   Email: admin@clinic.test
   Password: Admin123!
   ```
4. Click "Sign In"
5. ✅ You should see the Dashboard!

### Test Patient Portal

1. Open: `http://localhost:8080`
2. Click **"Patient Sign In"**
3. Enter:
   ```
   Email: patient@test.com
   Password: Patient123!
   ```
4. Click "Sign In"
5. ✅ You should see the Patient Portal!

---

## 📝 All Test Credentials Reference

### Clinic Portal Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Clinic Admin** | admin@clinic.test | Admin123! | Full access to everything |
| **Provider** | provider@clinic.test | Provider123! | Patients, treatments, schedule |
| **Assistant** | assistant@clinic.test | Assistant123! | Limited support access |

### Patient Portal Account

| Role | Email | Password | Has Data |
|------|-------|----------|----------|
| **Patient** | patient@test.com | Patient123! | Yes (1 treatment) |

---

## 🔧 Alternative: Manual SQL Method

If you prefer to create users via SQL only (not recommended):

### Option A: Use Supabase Auth Admin API

Create a script to call Supabase Auth API (requires service role key).

### Option B: Create via Application

1. Start your application
2. Go to clinic login page
3. Look for a "Sign Up" option (if available)
4. Create account manually

**Note:** This method requires the sign-up feature to be enabled.

---

## 🐛 Troubleshooting

### Problem: "Invalid login credentials"

**Causes:**
- User not created yet
- Wrong password (case-sensitive!)
- Email not confirmed
- Role not assigned

**Fix:**
1. Go to Supabase → Authentication → Users
2. Find the user by email
3. Check if "Email Confirmed" shows ✅
4. If ❌, click the user and click "Confirm Email"
5. Run the SQL script again to assign roles

### Problem: "User login successful but redirects to blank page"

**Causes:**
- Role not assigned to user
- `user_roles` table missing entry

**Fix:**
1. Run this SQL to check roles:
```sql
SELECT u.email, ur.role 
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'admin@clinic.test';
```

2. If role is NULL, run the `CREATE_TEST_ACCOUNTS.sql` script again

### Problem: "Patient login works but no data shows"

**Causes:**
- Patient record not created in `patients` table
- No patient profile linked to user

**Fix:**
Run this SQL:
```sql
-- Check if patient record exists
SELECT * FROM patients WHERE email = 'patient@test.com';

-- If not, the SQL script should have created it
-- Run CREATE_TEST_ACCOUNTS.sql again
```

### Problem: "Email already exists"

**Solution:**
That's fine! The users already exist. Just run the SQL script to assign roles.

### Problem: Can't access Supabase Dashboard

**Solution:**
1. Make sure you're logged into Supabase
2. Check your project URL in `.env` file
3. Verify project is active (not paused)

---

## 🎯 Quick Verification Checklist

After setup, verify:

- [ ] Can login to clinic portal as admin@clinic.test
- [ ] Can login to clinic portal as provider@clinic.test
- [ ] Can login to patient portal as patient@test.com
- [ ] Dashboard loads for clinic users
- [ ] Patient portal shows treatment record
- [ ] No console errors on login (F12)
- [ ] Can logout successfully

**All checked?** ✅ You're ready to test!

---

## 📚 What's Next?

Now that you have test accounts:

1. **Quick Test:** Follow `docs/QUICK_TEST_GUIDE.md`
2. **Full Testing:** Follow `docs/TESTING_GUIDE.md`
3. **Track Progress:** Use `docs/TEST_CHECKLIST.md`

---

## 🔒 Security Notes

### For Development Only

These credentials are **FOR TESTING ONLY**:
- ⚠️ Never use these in production
- ⚠️ Simple passwords for easy testing
- ⚠️ Publicly documented (not secure)

### For Production

When deploying to production:
1. Create real accounts with strong passwords
2. Use password reset flow
3. Enable 2FA if available
4. Use real email addresses
5. Never commit credentials to Git

---

## 💡 Pro Tips

### Remember Your Passwords

Save these somewhere safe during testing:
```
admin@clinic.test / Admin123!
provider@clinic.test / Provider123!
assistant@clinic.test / Assistant123!
patient@test.com / Patient123!
```

### Browser Password Manager

Let your browser save these passwords for quick testing.

### Multiple Test Patients

To create more test patients, modify the SQL script:
```sql
-- Add more patients with different scenarios
INSERT INTO patients (user_id, first_name, last_name, email, ...)
VALUES (patient_user_id, 'John', 'Smith', 'patient2@test.com', ...);
```

---

## 📞 Still Having Issues?

### Check These First:
1. Supabase project is running (not paused)
2. Database migrations have been run
3. `.env` file has correct Supabase credentials
4. Dev server is running (`npm run dev`)
5. No console errors in browser (F12)

### Get Help:
- Check browser console for specific error messages
- Verify Supabase connection in Network tab (F12)
- Review `docs/BLANK_SCREEN_FIX.md` for auth issues
- Contact development team with error details

---

## ✅ Success!

Once you can login with all test accounts, you're ready to:
- Test all features
- Add more test data
- Run through test scenarios
- Report any bugs found

**Happy Testing! 🚀**

---

**Files Referenced:**
- SQL Script: `CREATE_TEST_ACCOUNTS.sql`
- Testing Guide: `docs/TESTING_GUIDE.md`
- Quick Test: `docs/QUICK_TEST_GUIDE.md`
- Checklist: `docs/TEST_CHECKLIST.md`

