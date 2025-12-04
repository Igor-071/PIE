# Aesthetica Testing Guide

**Version:** 1.0  
**Last Updated:** November 18, 2024  
**Application:** Aesthetica - Injectable & Implant Records Management

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Test Environment Setup](#test-environment-setup)
3. [Clinic Portal Testing](#clinic-portal-testing)
4. [Patient Portal Testing](#patient-portal-testing)
5. [Test Scenarios](#test-scenarios)
6. [Known Issues](#known-issues)
7. [Reporting Bugs](#reporting-bugs)

---

## 🚀 Getting Started

### Access URLs

**Local Development:**
- URL: `http://localhost:8080`
- Requires: Local dev server running

**Production (Lovable.dev):**
- URL: `https://esthetic-flow-vault.lovable.app`

### Test Accounts

You'll need test accounts for both clinic staff and patients. These should be set up in the Supabase database.

**Default Test Accounts Structure:**

```
Clinic Staff:
├── Clinic Admin (full access)
├── Provider (doctor/practitioner)
├── Assistant (limited access)
└── Read-Only User (view only)

Patients:
└── Test Patient Account
```

---

## 🔧 Test Environment Setup

### Prerequisites

1. **Browser Requirements:**
   - Chrome 90+ (recommended)
   - Firefox 88+
   - Safari 14+
   - Edge 90+

2. **Tools Needed:**
   - Browser with Developer Tools (F12)
   - Notepad for tracking issues

3. **Before Testing:**
   - Clear browser cache (Cmd+Shift+Delete / Ctrl+Shift+Delete)
   - Open Developer Console (F12)
   - Check Console tab for errors

### First Load Checklist

When you first open the application:

- [ ] Landing page loads within 5 seconds
- [ ] No JavaScript errors in console
- [ ] Two cards visible: "For Clinics" and "For Patients"
- [ ] Both sign-in buttons are clickable
- [ ] Images and fonts load correctly

---

## 🏥 Clinic Portal Testing

### 1. Login Process

#### Access Clinic Login
1. From landing page, click **"Clinic Sign In"** button
2. Verify you're redirected to `/login/clinic`
3. Check that login form displays correctly

#### Test Login
**Scenario A: Valid Credentials**
```
1. Enter valid clinic email
2. Enter valid password
3. Click "Sign In"
4. Expected: Redirected to /dashboard
5. Expected: No error messages
```

**Scenario B: Invalid Credentials**
```
1. Enter invalid email or password
2. Click "Sign In"
3. Expected: Error toast appears
4. Expected: Stays on login page
5. Check error message is clear
```

**Scenario C: Empty Fields**
```
1. Leave fields empty
2. Click "Sign In"
3. Expected: Validation errors shown
4. Expected: Form doesn't submit
```

### 2. Dashboard (Clinic Admin/Provider)

After successful login, you should see the main dashboard:

#### Navigation Test
- [ ] Sidebar visible on left
- [ ] All menu items clickable:
  - Dashboard
  - Patients
  - Schedule
  - Implants
  - Inventory
  - Templates
  - Reports
  - Settings
- [ ] Notification bell in header
- [ ] User profile/logout button

#### Dashboard Content
- [ ] Welcome message with user name
- [ ] Statistics cards displaying:
  - Total Patients
  - Appointments Today
  - Pending Recalls
  - Low Stock Items
- [ ] Recent activity feed
- [ ] Quick action buttons work

### 3. Patient Management

#### Navigate to Patients Page
1. Click "Patients" in sidebar
2. Verify `/patients` route loads

#### Test Patient List
- [ ] Patient table displays
- [ ] Search bar functional
- [ ] Filter buttons work
- [ ] Pagination controls visible
- [ ] "Add New Patient" button present

#### Create New Patient
```
1. Click "Add New Patient" button
2. Fill in patient details:
   - Full Name (required)
   - Email (required)
   - Phone
   - Date of Birth
   - Address
3. Click "Save"
4. Expected: Patient created successfully
5. Expected: Redirected to patient detail page or list refreshes
```

#### View Patient Details
```
1. Click on any patient in the list
2. Verify redirected to /patients/{id}
3. Check tabs are visible:
   - Overview
   - Treatment Records
   - Implants
   - Documents
   - Photos
4. Verify patient information displays correctly
```

#### Test Patient Actions
- [ ] Edit patient information
- [ ] Upload patient photo
- [ ] Add treatment note
- [ ] Add appointment
- [ ] Generate patient QR code

### 4. Treatment Records

#### Add New Treatment
```
1. Go to a patient's detail page
2. Click "Treatment Records" tab
3. Click "Add Treatment"
4. Fill in:
   - Date
   - Treatment type
   - Products used
   - Injection sites
   - Notes
   - Photos (before/after)
5. Save treatment
6. Expected: Treatment appears in patient's record
```

#### Upload Photos
- [ ] Before photos upload correctly
- [ ] After photos upload correctly
- [ ] Photos appear in gallery
- [ ] Compare slider works for before/after

### 5. Implant Management

#### Navigate to Implants
1. Click "Implants" in sidebar
2. Verify `/implants` route loads

#### Register New Implant
```
1. Click "Register Implant"
2. Select patient from dropdown
3. Fill in implant details:
   - Device Name
   - Manufacturer
   - Model Number
   - Serial Number
   - Lot Number
   - UDI (if available)
   - Implant Date
   - Body Side/Location
4. Save implant
5. Expected: Implant registered successfully
```

#### Test Implant Features
- [ ] Search implants by serial number
- [ ] Filter by manufacturer
- [ ] View implant card
- [ ] Generate QR code for implant
- [ ] Export implant certificate

### 6. Inventory Management

#### Navigate to Inventory
1. Click "Inventory" in sidebar
2. Verify `/inventory` route loads

#### Test Inventory Functions
- [ ] View all products
- [ ] Add new product
- [ ] Update stock levels
- [ ] Set low stock alerts
- [ ] Record product usage
- [ ] View expiration dates

### 7. Schedule/Appointments

#### Navigate to Schedule
1. Click "Schedule" in sidebar
2. Verify `/schedule` route loads

#### Test Calendar
- [ ] Calendar displays current month
- [ ] Navigate between months
- [ ] View day/week/month views
- [ ] Click on time slot to create appointment

#### Create Appointment
```
1. Click a time slot or "New Appointment"
2. Fill in:
   - Patient (search and select)
   - Date and Time
   - Duration
   - Provider
   - Appointment Type
   - Notes
3. Save appointment
4. Expected: Appointment appears on calendar
```

#### Manage Appointments
- [ ] View appointment details
- [ ] Edit appointment
- [ ] Reschedule appointment
- [ ] Cancel appointment
- [ ] Mark as completed

### 8. Templates

#### Navigate to Templates
1. Click "Templates" in sidebar
2. Verify `/templates` route loads

#### Test Template Functions
- [ ] View consent form templates
- [ ] View treatment plan templates
- [ ] Create new template
- [ ] Edit existing template
- [ ] Delete template
- [ ] Preview template

### 9. Reports

#### Navigate to Reports
1. Click "Reports" in sidebar
2. Verify `/reports` route loads

#### Generate Reports
- [ ] Select report type
- [ ] Set date range
- [ ] Apply filters
- [ ] Generate report
- [ ] Export as PDF
- [ ] Export as CSV

### 10. Settings

#### Navigate to Settings
1. Click "Settings" in sidebar
2. Verify `/settings` route loads

#### Test Settings Tabs
- [ ] Clinic Information
- [ ] User Management
- [ ] Notification Settings
- [ ] Integrations
- [ ] Billing

#### Update Settings
- [ ] Edit clinic name and address
- [ ] Add/remove staff users
- [ ] Configure email notifications
- [ ] Update logo
- [ ] Save changes successfully

### 11. Logout

```
1. Click user menu in header
2. Click "Sign Out"
3. Expected: Redirected to landing page
4. Expected: Session cleared
5. Verify: Cannot access protected routes without login
```

---

## 👤 Patient Portal Testing

### 1. Patient Login Process

#### Access Patient Login
1. From landing page, click **"Patient Sign In"** button
2. Verify you're redirected to `/login/patient`
3. Check that patient login form displays

#### Test Patient Login
**Scenario A: Valid Patient Credentials**
```
1. Enter patient email
2. Enter patient password
3. Click "Sign In"
4. Expected: Redirected to /portal
5. Expected: Patient dashboard loads
```

**Scenario B: Invalid Patient Credentials**
```
1. Enter invalid credentials
2. Click "Sign In"
3. Expected: Error message displays
4. Expected: Stays on patient login page
```

### 2. Patient Dashboard

After successful login:

#### Verify Dashboard Elements
- [ ] Patient name and photo displayed
- [ ] Navigation menu visible:
  - Dashboard
  - My Records
  - My Implants
  - Documents
  - Profile
- [ ] Quick stats visible:
  - Last appointment
  - Next appointment
  - Total treatments
  - Implants registered

#### Dashboard Content
- [ ] Upcoming appointments list
- [ ] Recent treatments summary
- [ ] Important notifications/recalls
- [ ] Quick action buttons

### 3. My Records (Patient View)

#### Navigate to Records
1. Click "My Records" in patient menu
2. Verify `/portal/records` route loads

#### Test Records View
- [ ] Timeline of all treatments visible
- [ ] Treatment dates displayed
- [ ] Treatment details viewable
- [ ] Before/after photos accessible
- [ ] Download treatment summary option

#### View Treatment Details
```
1. Click on a treatment record
2. Expected: Expanded view shows:
   - Date of treatment
   - Provider name
   - Products used
   - Areas treated
   - Before/after photos
   - Post-care instructions
3. Verify: All information is read-only (patient cannot edit)
```

### 4. My Implants (Patient View)

#### Navigate to Implants
1. Click "My Implants" in patient menu
2. Verify `/portal/implants` route loads

#### Test Implant Features
- [ ] All patient's implants listed
- [ ] Implant cards display correctly
- [ ] View implant certificate
- [ ] Download implant card as PDF
- [ ] QR code visible on card

#### View Implant Details
```
1. Click on an implant
2. Expected: Detailed view shows:
   - Device name and type
   - Manufacturer information
   - Serial/Lot numbers
   - Implant date
   - Body location
   - Warranty information
   - QR code for verification
3. Download implant card
4. Verify PDF generates correctly
```

### 5. Documents (Patient View)

#### Navigate to Documents
1. Click "Documents" in patient menu
2. Verify `/portal/documents` route loads

#### Test Document Functions
- [ ] Consent forms listed
- [ ] Treatment plans visible
- [ ] Invoices/receipts available
- [ ] Pre/post care instructions

#### Document Actions
```
1. Click on a document
2. Expected: Document preview opens
3. Test download button
4. Expected: Document downloads as PDF
5. Verify: Downloaded file opens correctly
```

### 6. Profile (Patient View)

#### Navigate to Profile
1. Click "Profile" in patient menu
2. Verify `/portal/profile` route loads

#### View Profile Information
- [ ] Personal information displayed:
  - Name
  - Email
  - Phone
  - Date of Birth
  - Address
- [ ] Profile photo visible
- [ ] Update profile button available

#### Update Profile
```
1. Click "Edit Profile"
2. Update allowed fields:
   - Phone number
   - Address
   - Profile photo
3. Save changes
4. Expected: Success message
5. Verify: Changes reflected immediately
```

#### Change Password
```
1. Click "Change Password"
2. Enter current password
3. Enter new password
4. Confirm new password
5. Save
6. Expected: Password updated successfully
7. Test: Login with new password
```

### 7. Patient Notifications

#### Check Notification Bell
- [ ] Click notification bell icon
- [ ] Notifications dropdown appears
- [ ] View unread notifications
- [ ] Mark notifications as read
- [ ] Clear all notifications

#### Types of Notifications to Test
- [ ] Appointment reminders
- [ ] Recall alerts
- [ ] New document available
- [ ] Treatment follow-up reminders

### 8. Patient Logout

```
1. Click user menu or logout button
2. Click "Sign Out"
3. Expected: Redirected to patient login page
4. Verify: Cannot access /portal routes without login
```

---

## 🧪 Test Scenarios

### Scenario 1: End-to-End Clinic Workflow

**Objective:** Test complete patient journey from clinic perspective

```
1. Login as Clinic Admin
2. Create new patient
3. Schedule an appointment
4. Record treatment (add photos)
5. Register implant for patient
6. Generate implant card
7. Add consent form
8. Create invoice
9. Verify all data saved correctly
10. Logout
```

**Expected Result:** All steps complete without errors, data persists

### Scenario 2: End-to-End Patient Workflow

**Objective:** Test complete patient experience

```
1. Login as Patient
2. View dashboard
3. Check upcoming appointments
4. Browse treatment history
5. View before/after photos
6. Download implant card
7. Access consent forms
8. Update profile information
9. Logout
```

**Expected Result:** All patient features accessible, read-only where appropriate

### Scenario 3: Multi-Role Access Test

**Objective:** Verify role-based access control

```
Test A: Clinic Admin
- Should access: All features
- Test: Try accessing all pages

Test B: Provider
- Should access: Patients, treatments, schedule
- Test: Verify can view/edit patient records

Test C: Assistant
- Should access: Schedule, basic patient info
- Should NOT access: Settings, financial reports
- Test: Try accessing restricted pages

Test D: Read-Only
- Should access: View-only access to most features
- Should NOT access: Edit/delete functions
- Test: Verify no edit buttons available

Test E: Patient
- Should access: Only own records
- Should NOT access: Other patients' data
- Test: Try accessing /patients or /dashboard
```

**Expected Result:** Each role has appropriate access level

### Scenario 4: Photo Upload & Gallery

**Objective:** Test image handling

```
1. Login as Provider
2. Go to patient treatment records
3. Add new treatment
4. Upload before photo (test various formats):
   - JPG
   - PNG
   - HEIC (if supported)
5. Upload after photo
6. Save treatment
7. View photo gallery
8. Test photo comparison slider
9. Download photos
10. Verify quality maintained
```

**Expected Result:** All image formats handled, quality preserved

### Scenario 5: Implant Recall Alert

**Objective:** Test notification system

```
1. Setup: Register implant with specific lot number
2. Trigger: Create recall alert for that lot number
3. Test Clinic View:
   - Check dashboard shows recall alert
   - Verify affected patients listed
   - Test "Notify Patient" button
4. Test Patient View:
   - Login as affected patient
   - Check notification bell
   - Verify recall alert visible
   - Check implant card shows warning
5. Verify: Email notification sent (if configured)
```

**Expected Result:** Recall propagates to all affected parties

### Scenario 6: Mobile Responsiveness

**Objective:** Test on mobile devices

```
1. Open app on mobile device or use browser dev tools
2. Resize to mobile viewport (375px width)
3. Test all pages:
   - Landing page
   - Login forms
   - Dashboard
   - Patient list
   - Calendar
   - Forms
4. Verify:
   - Layout adapts correctly
   - Buttons are tappable
   - Forms are usable
   - Navigation works (hamburger menu)
   - No horizontal scroll
```

**Expected Result:** Fully functional on mobile

### Scenario 7: Search & Filter

**Objective:** Test search functionality

```
1. Go to Patients page
2. Test search by:
   - Patient name (partial match)
   - Email address
   - Phone number
   - Patient ID
3. Test filters:
   - Active/Inactive patients
   - Date range
   - Assigned provider
4. Test sorting:
   - Name (A-Z, Z-A)
   - Last visit date
   - Creation date
```

**Expected Result:** Search returns accurate results, filters work

### Scenario 8: Data Export

**Objective:** Test export functionality

```
1. Navigate to Reports page
2. Select date range
3. Generate report
4. Test export formats:
   - PDF download
   - CSV download
5. Open downloaded files
6. Verify:
   - Data is complete
   - Formatting is correct
   - File opens without errors
```

**Expected Result:** Clean, formatted exports

---

## ⚠️ Known Issues

### Current Limitations

1. **Environment Variables**
   - `.env` file must have correct permissions
   - Solution: File is now properly configured

2. **Auth Timeout**
   - If Supabase connection is slow, 5-second timeout triggers
   - Solution: Working as designed, app continues to function

3. **Large Image Uploads**
   - Files over 10MB may be slow
   - Recommendation: Compress images before upload

4. **Browser Compatibility**
   - IE11 not supported
   - Use modern browsers only

### Expected Console Messages

These are **NORMAL** and not errors:

```
✅ "Auth initialization timeout" - Slow Supabase connection
✅ "Error fetching user role" - User not in database yet
✅ Development mode messages from Vite
```

### Messages That Indicate Problems

Report these immediately:

```
❌ "Fatal error initializing auth"
❌ Network errors persisting
❌ 500 Internal Server Errors
❌ CORS errors
❌ TypeScript errors in console
```

---

## 🐛 Reporting Bugs

### Bug Report Template

When you find an issue, report it with these details:

```markdown
**Bug Title:** [Short description]

**Severity:** [Critical / High / Medium / Low]

**Environment:**
- URL: [localhost or lovable.dev]
- Browser: [Chrome 120, etc.]
- User Role: [Clinic Admin / Provider / Patient]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots:**
[Attach if applicable]

**Console Errors:**
[Copy from F12 Console tab]

**Additional Notes:**
[Any other relevant information]
```

### Where to Report

- **Development Issues:** GitHub Issues
- **Production Bugs:** Slack/Email to dev team
- **Security Issues:** Email directly to security team

---

## ✅ Testing Checklist

### Pre-Test Setup
- [ ] Browser cache cleared
- [ ] Console open (F12)
- [ ] Test accounts available
- [ ] Notepad ready for notes

### Clinic Portal
- [ ] Login/Logout works
- [ ] Dashboard loads and displays data
- [ ] Patient CRUD operations work
- [ ] Treatment records can be added
- [ ] Photos upload successfully
- [ ] Implants can be registered
- [ ] Schedule/calendar functions
- [ ] Inventory management works
- [ ] Reports generate correctly
- [ ] Settings can be updated
- [ ] All navigation links work
- [ ] Search and filters function
- [ ] Data persists after refresh

### Patient Portal
- [ ] Patient login works
- [ ] Dashboard displays correctly
- [ ] View treatment history
- [ ] View implants and download cards
- [ ] Access documents
- [ ] Update profile
- [ ] Notifications visible
- [ ] Cannot access clinic routes
- [ ] Logout works

### Cross-Cutting
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Role-based access enforced
- [ ] Data validation working
- [ ] Error messages clear
- [ ] Loading states visible
- [ ] Success toasts appear
- [ ] QR codes generate
- [ ] PDFs download correctly
- [ ] Images display properly

---

## 📊 Test Results Template

```markdown
# Test Session Report

**Date:** [Date]
**Tester:** [Your Name]
**Environment:** [Localhost / Production]
**Duration:** [Hours]

## Summary
- Total Tests: X
- Passed: X
- Failed: X
- Blocked: X

## Detailed Results

### Clinic Portal
| Feature | Status | Notes |
|---------|--------|-------|
| Login | ✅ | Working correctly |
| Dashboard | ✅ | All widgets load |
| Patients | ⚠️ | Search slow with 1000+ patients |
| ... | ... | ... |

### Patient Portal
| Feature | Status | Notes |
|---------|--------|-------|
| Login | ✅ | Working correctly |
| Records | ✅ | Photos display well |
| ... | ... | ... |

## Bugs Found
1. [Bug details with severity]
2. [Bug details with severity]

## Recommendations
- [Improvement suggestions]
- [Performance notes]
- [UX feedback]
```

---

## 🎯 Success Criteria

The application is considered **READY FOR PRODUCTION** when:

✅ All critical features work without errors  
✅ No security vulnerabilities  
✅ Role-based access properly enforced  
✅ Data persists correctly  
✅ Mobile responsive  
✅ No blocking bugs  
✅ Performance acceptable (< 3s page loads)  
✅ Error handling graceful  
✅ Documentation complete  

---

## 📞 Support Contacts

**Development Team:** [Email/Slack]  
**Project Manager:** [Contact]  
**Emergency Contact:** [Phone]

---

**Happy Testing! 🚀**

*Remember: The goal is to break things now so they don't break in production. Be thorough and creative with your tests!*

