# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/9c98db84-7ea7-4660-8cbf-53021f90a02c

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9c98db84-7ea7-4660-8cbf-53021f90a02c) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# (Optional) Step 3b: If you want to override the built-in dev Supabase project,
# copy the example env file and update it with your own project credentials.
cp env/.env.example env/.env.local
# Otherwise you can skip this step—the repo ships with default VITE_SUPABASE_* values.

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9c98db84-7ea7-4660-8cbf-53021f90a02c) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## 🔐 First Time Setup: Create Test Accounts

**⚠️ IMPORTANT:** Before you can login, you need to create test accounts!

### ⚡ SUPER EASY SETUP (2 minutes - No Supabase knowledge needed!)

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open the setup page in your browser:**
   ```
   http://localhost:8080/setup
   ```

3. **Click "Create Test Accounts" button**

4. **Done!** ✅ All accounts created automatically!

**📖 Detailed Instructions:** See [`SETUP_NOW.md`](SETUP_NOW.md)

### Login Credentials

Once test accounts are created, use these to login:

**Clinic Portal** (click "Clinic Sign In"):
- Admin: `admin@clinic.test` / `Admin123!`
- Provider: `provider@clinic.test` / `Provider123!`

**Patient Portal** (click "Patient Sign In"):
- Patient: `patient@test.com` / `Patient123!`

---

## 🧪 Testing the Application

### Quick Testing
For rapid smoke testing before deployment:
- **Quick Test Guide:** [`docs/QUICK_TEST_GUIDE.md`](docs/QUICK_TEST_GUIDE.md) - 5-minute smoke test

### Comprehensive Testing
For thorough end-to-end testing of both clinic and patient portals:
- **Full Testing Guide:** [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md) - Complete testing instructions

### Testing Both Portals

#### Clinic Portal Testing
Test as clinic staff (Admin/Provider/Assistant):
1. Login via "Clinic Sign In" button
2. Test patient management (create, edit, view)
3. Add treatment records with photos
4. Register implants
5. Manage appointments/schedule
6. Generate reports
7. Configure settings

#### Patient Portal Testing
Test as a patient:
1. Login via "Patient Sign In" button
2. View treatment history
3. Access implant cards with QR codes
4. Download documents and consent forms
5. Update profile information

### Required Test Accounts
You'll need:
- **Clinic Admin** - Full access to all features (admin@clinic.test)
- **Provider** - Medical staff access (provider@clinic.test)
- **Assistant** - Limited support access (assistant@clinic.test)
- **Patient** - Patient portal access (patient@test.com)

See the testing guides for detailed test scenarios and expected results.

## 📚 Documentation

- [`docs/SETUP_INSTRUCTIONS.md`](docs/SETUP_INSTRUCTIONS.md) - Development setup
- [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md) - Comprehensive testing instructions
- [`docs/QUICK_TEST_GUIDE.md`](docs/QUICK_TEST_GUIDE.md) - Quick smoke tests
- [`docs/BLANK_SCREEN_FIX.md`](docs/BLANK_SCREEN_FIX.md) - Recent bug fixes and QA report
- [`docs/DEPLOYMENT_STATUS.md`](docs/DEPLOYMENT_STATUS.md) - Deployment information
