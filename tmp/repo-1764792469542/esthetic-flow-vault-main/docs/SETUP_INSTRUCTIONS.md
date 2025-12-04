# Setup Instructions

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

#### Option A: Use Default Demo Credentials (For Testing)
The app comes with default Supabase credentials for demo purposes. Skip to step 3.

#### Option B: Use Your Own Supabase Project
1. Create a Supabase project at https://supabase.com
2. Create `env/.env.local` file:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Run Database Migrations

**IMPORTANT**: You must run migrations for the app to work!

#### Option A: Using Supabase CLI (Recommended)
```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push
```

#### Option B: Using Supabase Dashboard (Manual)
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Run each migration file in order:
   - `supabase/migrations/20251111082542_2e64c3c6-79d6-4505-b982-66539963ed0d.sql`
   - `supabase/migrations/20251111082916_dbb53de1-362b-4f77-bf1f-deafa8a64111.sql`
   - `supabase/migrations/20251111084341_d0c2fe57-33e4-420a-aa29-a4006269123e.sql`
   - `supabase/migrations/20251111155046_31daf35c-b0a2-4703-9079-56d1338ac4a1.sql`
   - `supabase/migrations/20251118000000_appointments.sql`
   - `supabase/migrations/20251118000001_documents_and_storage.sql`
   - `supabase/migrations/20251118000002_settings_and_audit.sql`
   - `supabase/migrations/20251118000003_patient_users.sql`

### 4. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

---

## Verify Setup

### Check if Migrations Ran Successfully

1. Go to Supabase Dashboard → Table Editor
2. Verify these tables exist:
   - `patients`
   - `treatments`
   - `implants`
   - `inventory`
   - `appointments`
   - `documents`
   - `treatment_photos`
   - `treatment_templates`
   - `clinic_settings` ← **REQUIRED FOR SETTINGS PAGE**
   - `staff` ← **REQUIRED FOR SETTINGS PAGE**
   - `notification_preferences`
   - `patient_users` ← **REQUIRED FOR PATIENT PORTAL**
   - `audit_log`

3. Check if `clinic_settings` has data:
```sql
SELECT * FROM clinic_settings;
```

If empty, the migration INSERT might have failed. Run manually:
```sql
INSERT INTO clinic_settings (clinic_name, email, phone, address, city, state, zip, country)
VALUES (
  'Esthetic Flow Clinic',
  'clinic@estheticflow.com',
  '(555) 123-4567',
  '123 Beauty Lane',
  'Beverly Hills',
  'CA',
  '90210',
  'USA'
);
```

---

## Troubleshooting

### Settings Page Shows Loading Spinner Forever

**Cause**: `clinic_settings` or `staff` table doesn't exist or has RLS issues.

**Fix**:
1. Run migrations (see step 3 above)
2. Verify tables exist in Supabase Dashboard
3. Check browser console for errors (F12)
4. Verify RLS policies:
```sql
-- Check clinic_settings policies
SELECT * FROM pg_policies WHERE tablename = 'clinic_settings';

-- Check staff policies  
SELECT * FROM pg_policies WHERE tablename = 'staff';
```

### Patient Portal Doesn't Work

**Cause**: `patient_users` table doesn't exist.

**Fix**: Run migration `20251118000003_patient_users.sql`

### "relation does not exist" Error

**Cause**: Migrations haven't been run.

**Fix**: Run all migrations in order (see step 3)

### RLS Policy Errors

**Cause**: User doesn't have permission to access tables.

**Fix**: 
1. Check if you're logged in
2. Verify your user has the correct role in metadata
3. Check RLS policies in Supabase Dashboard → Authentication → Policies

---

## First Time Login

### Clinic Portal
1. Go to `http://localhost:8080/login/clinic`
2. Create an admin account:
   - In Supabase Dashboard → Authentication → Users
   - Click "Add User"
   - Add email and password
   - Add user metadata (optional):
     ```json
     {
       "role": "clinic_admin"
     }
     ```
3. Login with those credentials

### Patient Portal
1. Patient accounts must be created by clinic staff
2. Or manually create in Supabase Dashboard:
```sql
-- First create a patient record
INSERT INTO patients (first_name, last_name, email, phone)
VALUES ('John', 'Doe', 'patient@example.com', '555-0100');

-- Then create auth user (use Supabase Dashboard → Authentication → Add User)

-- Finally link them
INSERT INTO patient_users (id, patient_id, email)
VALUES (
  'auth_user_id_here',  -- Get from auth.users table
  'patient_id_here',     -- Get from patients table
  'patient@example.com'
);
```

---

## Common Issues

### Issue: TypeScript Errors
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Vite Build Errors
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Issue: Supabase Connection Fails
1. Check internet connection
2. Verify Supabase URL and key in env variables
3. Check if Supabase project is paused (unpause in dashboard)

---

## Production Deployment

### 1. Build the App
```bash
npm run build
```

Output will be in `dist/` folder.

### 2. Deploy to Vercel/Netlify
- Upload `dist/` folder
- Set environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### 3. Run Migrations on Production Database
Use Supabase CLI to push migrations to production:
```bash
supabase link --project-ref production-project-ref
supabase db push
```

---

## Need Help?

- Check `/docs/qa-test-results.md` for known issues
- Check `/docs/DEPLOYMENT_STATUS.md` for deployment checklist
- Check browser console (F12) for error messages
- Check Supabase Dashboard → Logs for server errors

