# Aesthetica Test Checklist

**Tester:** _________________  
**Date:** _________________  
**Environment:** ⬜ Localhost ⬜ Production  
**Build/Version:** _________________

---

## 🏥 CLINIC PORTAL

### Login & Authentication
- [ ] Landing page loads without errors
- [ ] "Clinic Sign In" button works
- [ ] Valid credentials → successful login
- [ ] Invalid credentials → error message
- [ ] Dashboard loads after login
- [ ] User name displayed in header

### Dashboard
- [ ] Statistics cards display data
- [ ] Navigation sidebar visible
- [ ] All menu items clickable
- [ ] Notification bell functional
- [ ] Quick actions work

### Patient Management
- [ ] Patient list displays
- [ ] Search patients works
- [ ] Filter patients works
- [ ] "Add New Patient" opens form
- [ ] Create new patient saves successfully
- [ ] Edit patient works
- [ ] View patient detail page
- [ ] Patient tabs all accessible

### Treatment Records
- [ ] View treatment history
- [ ] "Add Treatment" opens form
- [ ] Upload before photo works
- [ ] Upload after photo works
- [ ] Save treatment successful
- [ ] Photos appear in gallery
- [ ] Photo comparison slider works
- [ ] Download treatment summary

### Implant Management
- [ ] Navigate to Implants page
- [ ] "Register Implant" opens form
- [ ] Select patient from dropdown
- [ ] Fill all implant fields
- [ ] Save implant successful
- [ ] View implant card
- [ ] QR code generates
- [ ] Download implant certificate as PDF
- [ ] Search implants works

### Schedule/Appointments
- [ ] Calendar loads correctly
- [ ] View different date ranges
- [ ] Create new appointment
- [ ] Edit appointment
- [ ] Delete/cancel appointment
- [ ] Appointment shows on calendar
- [ ] Time slots selectable

### Inventory
- [ ] View product list
- [ ] Add new product
- [ ] Update stock levels
- [ ] Low stock alerts visible
- [ ] Search products works

### Templates
- [ ] View templates list
- [ ] Create new template
- [ ] Edit template
- [ ] Preview template
- [ ] Delete template

### Reports
- [ ] Select report type
- [ ] Set date range
- [ ] Generate report
- [ ] Export as PDF works
- [ ] Export as CSV works
- [ ] Downloaded files open correctly

### Settings
- [ ] Navigate to Settings
- [ ] View clinic information
- [ ] Edit clinic details
- [ ] Save settings successful
- [ ] User management accessible (if admin)
- [ ] Notification settings work

### Logout
- [ ] User menu opens
- [ ] "Sign Out" button works
- [ ] Redirected to landing page
- [ ] Session cleared (can't access protected routes)

---

## 👤 PATIENT PORTAL

### Login & Authentication
- [ ] "Patient Sign In" button works
- [ ] Valid credentials → successful login
- [ ] Invalid credentials → error message
- [ ] Patient dashboard loads
- [ ] Patient name displayed

### Patient Dashboard
- [ ] Navigation menu visible
- [ ] Quick stats display
- [ ] Upcoming appointments shown
- [ ] Recent treatments visible
- [ ] Notifications accessible

### My Records
- [ ] Navigate to "My Records"
- [ ] Treatment timeline displays
- [ ] View treatment details
- [ ] Before/after photos load
- [ ] Can zoom/view full size photos
- [ ] Download treatment summary works

### My Implants
- [ ] Navigate to "My Implants"
- [ ] Implant cards display
- [ ] View implant details
- [ ] QR code visible
- [ ] Download implant card as PDF
- [ ] PDF opens correctly

### Documents
- [ ] Navigate to "Documents"
- [ ] Consent forms listed
- [ ] Treatment plans visible
- [ ] Click document opens preview
- [ ] Download document works
- [ ] PDF downloads correctly

### Profile
- [ ] Navigate to "Profile"
- [ ] Personal info displayed
- [ ] "Edit Profile" button works
- [ ] Update phone number
- [ ] Update address
- [ ] Upload profile photo
- [ ] Save changes successful
- [ ] Changes persist after refresh

### Notifications
- [ ] Notification bell clickable
- [ ] Notifications list displays
- [ ] Mark as read works
- [ ] Clear notifications works

### Logout
- [ ] Logout button works
- [ ] Redirected to patient login
- [ ] Cannot access portal after logout

---

## 🔐 ROLE-BASED ACCESS

### Clinic Admin
- [ ] Can access all pages
- [ ] Can edit all settings
- [ ] Can manage users
- [ ] Can view reports

### Provider
- [ ] Can access patients
- [ ] Can add treatments
- [ ] Can register implants
- [ ] Can view schedule
- [ ] Cannot access user management

### Assistant
- [ ] Can view patient list
- [ ] Can schedule appointments
- [ ] Limited edit capabilities
- [ ] Cannot access settings

### Read-Only
- [ ] Can view patients
- [ ] Can view reports
- [ ] Cannot edit anything
- [ ] No "Add" or "Edit" buttons visible

### Patient
- [ ] Can only access /portal routes
- [ ] Cannot access /dashboard
- [ ] Cannot access /patients
- [ ] Cannot view other patients' data

---

## 📱 MOBILE RESPONSIVENESS

### Layout (test at 375px width)
- [ ] Landing page responsive
- [ ] Login forms usable
- [ ] Dashboard adapts to mobile
- [ ] Patient list scrollable
- [ ] Forms inputs accessible
- [ ] Navigation menu (hamburger) works
- [ ] No horizontal scrolling
- [ ] Buttons are tappable (not too small)
- [ ] Images scale properly

---

## 🐛 ERROR HANDLING

### Form Validation
- [ ] Required fields show error if empty
- [ ] Email validation works
- [ ] Phone number validation works
- [ ] Date validation works
- [ ] Clear error messages

### Network Errors
- [ ] Failed API calls show error toast
- [ ] Timeout handled gracefully
- [ ] Retry option available
- [ ] Loading states visible

### Authentication
- [ ] Expired session redirects to login
- [ ] 5-second auth timeout works
- [ ] Auth errors logged to console
- [ ] App continues even if auth fails

---

## ⚡ PERFORMANCE

- [ ] Landing page loads < 5 seconds
- [ ] Dashboard loads < 3 seconds
- [ ] Patient list loads < 2 seconds
- [ ] Images load progressively
- [ ] No layout shift while loading
- [ ] Smooth animations
- [ ] No lag when typing in forms

---

## 🔍 CONSOLE & DEBUGGING

### Browser Console (F12)
- [ ] No red errors on landing page
- [ ] No errors after login
- [ ] No errors on protected routes
- [ ] Expected warnings only (auth timeout OK)
- [ ] No CORS errors
- [ ] No 404 errors

### Network Tab
- [ ] API calls succeed (200 status)
- [ ] Images load (not 404)
- [ ] Reasonable load times
- [ ] No unnecessary requests

---

## 🎯 CRITICAL PATHS (Must Work)

### Path 1: Clinic Add Patient & Treatment
- [ ] Login → Patients → Add Patient → Save
- [ ] Open Patient → Add Treatment → Upload Photos → Save
- [ ] Photos appear in gallery
**Time:** ~3 min | **Status:** ⬜ Pass ⬜ Fail

### Path 2: Register Implant
- [ ] Login → Implants → Register Implant
- [ ] Select Patient → Fill Details → Save
- [ ] View Card → Download PDF
**Time:** ~2 min | **Status:** ⬜ Pass ⬜ Fail

### Path 3: Patient View Records
- [ ] Patient Login → My Records → View Treatment
- [ ] View Photos → My Implants → Download Card
**Time:** ~2 min | **Status:** ⬜ Pass ⬜ Fail

---

## 📝 NOTES & ISSUES

### Bugs Found
| # | Severity | Page/Feature | Description |
|---|----------|--------------|-------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### Performance Issues
- 
- 
- 

### UX Improvements Suggested
- 
- 
- 

### Questions for Dev Team
- 
- 
- 

---

## ✅ FINAL SIGN-OFF

**Overall Status:**  
⬜ PASS - Ready for production  
⬜ PASS with minor issues - Deploy with notes  
⬜ FAIL - Blocking issues found, do not deploy

**Critical Issues Count:** _______  
**Non-Critical Issues Count:** _______

**Tester Signature:** _________________  
**Date:** _________________

**Approved By:** _________________  
**Date:** _________________

---

## 📊 SUMMARY

**Total Tests:** _______  
**Passed:** _______  
**Failed:** _______  
**Skipped:** _______

**Pass Rate:** _______%

---

**Next Steps:**
- [ ] Report bugs in tracking system
- [ ] Schedule bug fix sprint
- [ ] Retest after fixes
- [ ] Final approval for deployment

---

**Reference:** See [`docs/TESTING_GUIDE.md`](TESTING_GUIDE.md) for detailed testing instructions

