# 🔐 Test Login Credentials - Quick Reference

**Keep this handy while testing!**

---

## 🏥 Clinic Portal

**URL:** `http://localhost:8080` → Click **"Clinic Sign In"**

### Clinic Admin (Full Access)
```
Email:    admin@clinic.test
Password: Admin123!
```
**Can Access:** Everything (all features)

### Provider (Medical Staff)
```
Email:    provider@clinic.test
Password: Provider123!
```
**Can Access:** Patients, Treatments, Schedule, Implants

### Assistant (Support Staff)
```
Email:    assistant@clinic.test
Password: Assistant123!
```
**Can Access:** Limited features, Schedule, Patient list

---

## 👤 Patient Portal

**URL:** `http://localhost:8080` → Click **"Patient Sign In"**

### Patient
```
Email:    patient@test.com
Password: Patient123!
```
**Can Access:** Own records, treatments, implants, documents

**Test Data Included:**
- ✅ Full profile information
- ✅ 1 sample treatment record
- ✅ Ready for testing

---

## ⚠️ First Time? Create Accounts First!

If you get "Invalid login credentials", you need to create the test accounts:

**Quick Steps:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Authentication → Users → Add User
4. Create each account above (use "Auto Confirm User" ✅)
5. Run `CREATE_TEST_ACCOUNTS.sql` in SQL Editor

**Full Guide:** [`docs/CREATE_TEST_ACCOUNTS_GUIDE.md`](docs/CREATE_TEST_ACCOUNTS_GUIDE.md)

---

## 🧪 Quick Test Flow

### Test Clinic Login
1. Open `http://localhost:8080`
2. Click "Clinic Sign In"
3. Use: `admin@clinic.test` / `Admin123!`
4. ✅ Should see Dashboard

### Test Patient Login
1. Open `http://localhost:8080`
2. Click "Patient Sign In"
3. Use: `patient@test.com` / `Patient123!`
4. ✅ Should see Patient Portal

---

## 💾 Save These!

**Copy this to keep passwords handy:**

```
# Clinic Logins
admin@clinic.test / Admin123!
provider@clinic.test / Provider123!
assistant@clinic.test / Assistant123!

# Patient Login
patient@test.com / Patient123!
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid login credentials" | Create accounts first (see guide above) |
| Login works but blank screen | Run SQL script to assign roles |
| "Email not confirmed" | Check ✅ Auto Confirm in Supabase |
| Can't access dashboard | User role not assigned properly |

**Still stuck?** Check `docs/CREATE_TEST_ACCOUNTS_GUIDE.md` for detailed troubleshooting.

---

## 🚀 Ready to Test?

Once you can login:
- **5-min test:** `docs/QUICK_TEST_GUIDE.md`
- **Full test:** `docs/TESTING_GUIDE.md`
- **Track progress:** `docs/TEST_CHECKLIST.md`

---

**⚠️ These are TEST credentials only - DO NOT use in production!**

Last Updated: November 18, 2024

