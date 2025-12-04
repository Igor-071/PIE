# Quick Test Guide - Aesthetica

**Use this for rapid smoke testing before deployment**

---

## 🚀 Quick Access

**Local:** `http://localhost:8080`  
**Production:** `https://esthetic-flow-vault.lovable.app`

---

## ⚡ 5-Minute Smoke Test

### 1. Landing Page (30 seconds)
```
✓ Open application
✓ Page loads within 5 seconds
✓ Two cards visible: "For Clinics" and "For Patients"
✓ No console errors (F12)
```

### 2. Clinic Login (1 minute)
```
✓ Click "Clinic Sign In"
✓ Enter credentials
✓ Login successful → Dashboard loads
✓ Username visible in header
```

### 3. Clinic Features (2 minutes)
```
✓ Click "Patients" - list loads
✓ Click "Schedule" - calendar displays
✓ Click "Implants" - page loads
✓ Click "Settings" - form displays
✓ User menu → Sign Out works
```

### 4. Patient Login (1 minute)
```
✓ Click "Patient Sign In"
✓ Enter patient credentials
✓ Login successful → Patient portal loads
✓ Patient name visible
```

### 5. Patient Features (30 seconds)
```
✓ "My Records" - treatments visible
✓ "My Implants" - implants listed
✓ "Documents" - forms accessible
✓ Sign Out works
```

**If all ✓ checks pass → Application is healthy ✅**

---

## 🎯 Critical Paths

### Clinic: Register Patient & Treatment
```
1. Login as Provider
2. Patients → Add New Patient
3. Fill required fields → Save
4. Open patient → Add Treatment
5. Upload before/after photos
6. Save treatment
7. Verify photos appear in gallery
```
**Time:** 3 minutes | **Critical:** Yes

### Clinic: Register Implant
```
1. Login as Provider
2. Implants → Register Implant
3. Select patient
4. Fill implant details (manufacturer, serial, etc.)
5. Save implant
6. View implant card
7. Download as PDF
```
**Time:** 2 minutes | **Critical:** Yes

### Patient: View Records & Implant
```
1. Login as Patient
2. My Records → View treatment history
3. Click treatment → View photos
4. My Implants → View implant card
5. Download implant certificate
```
**Time:** 2 minutes | **Critical:** Yes

---

## 🔐 Test Accounts Needed

### Clinic Staff
| Role | Purpose | Can Access |
|------|---------|-----------|
| Clinic Admin | Full testing | Everything |
| Provider | Medical staff | Patients, treatments, schedule |
| Assistant | Support staff | Limited access |
| Read-Only | View only | Reports, patient list (no edit) |

### Patients
| Type | Purpose |
|------|---------|
| Patient with treatments | Test records view |
| Patient with implants | Test implant cards |
| New patient | Test registration |

---

## ⚠️ Common Issues

### Blank Screen
- **Cause:** Auth timeout or connection issue
- **Check:** Browser console (F12) for errors
- **Fix:** Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### Login Failed
- **Cause:** Wrong credentials or DB connection
- **Check:** Network tab in DevTools
- **Fix:** Verify test account exists in Supabase

### Photos Not Loading
- **Cause:** Storage bucket permissions
- **Check:** Network tab for 403/404 errors
- **Fix:** Check Supabase Storage policies

### 404 on Routes
- **Cause:** React Router not configured
- **Check:** URL in address bar
- **Fix:** Use navigation buttons, don't type URLs manually

---

## 📱 Mobile Quick Test

```
1. Open DevTools (F12)
2. Toggle device toolbar (iPhone size)
3. Test landing page - responsive?
4. Login on mobile - form usable?
5. Navigation menu - hamburger works?
6. Patient list - scrollable?
7. Forms - inputs accessible?
```
**Time:** 2 minutes

---

## 🐛 Quick Bug Report

**Found a bug? Report it fast:**

```
What: [One sentence description]
Where: [Page/URL]
Role: [User type]
Steps: [1. 2. 3.]
Expected: [What should happen]
Got: [What actually happened]
Console: [Any red errors from F12]
```

**Send to:** [Team Slack / GitHub Issues / Email]

---

## ✅ Pre-Deployment Checklist

Before pushing to production:

```
□ 5-minute smoke test passes
□ All 3 critical paths work
□ No console errors on any page
□ Mobile view functional
□ Both logins work (clinic + patient)
□ Data saves and persists
□ PDFs download correctly
□ Photos upload successfully
□ Settings save correctly
□ Logout works everywhere
```

**All checked? Ship it! 🚀**

---

## 🆘 Emergency Rollback

If production breaks:

```bash
# Revert to last working version
git revert HEAD
git push origin main

# Or rollback on Lovable.dev:
# Go to Deployments → Select last good deploy → Promote
```

---

## 📊 Daily Health Check

Run this every morning on production:

```
1. Open production URL
2. Landing page loads? ✓
3. Clinic login works? ✓
4. Patient login works? ✓
5. Any console errors? ✗
6. Uptime monitor green? ✓
```

**Time:** 1 minute | **Frequency:** Daily

---

## 🎓 First-Time Tester Setup

New to testing this app? Start here:

```
1. Read this guide (you're doing it!)
2. Get test credentials from team
3. Clear browser cache
4. Run 5-minute smoke test
5. Try 1 critical path
6. Report results to team
```

**Next:** Read full `TESTING_GUIDE.md` for comprehensive testing

---

## 🔗 Related Docs

- **Full Testing Guide:** `docs/TESTING_GUIDE.md`
- **Bug Fix Log:** `docs/BLANK_SCREEN_FIX.md`
- **Setup Instructions:** `docs/SETUP_INSTRUCTIONS.md`
- **Deployment Status:** `docs/DEPLOYMENT_STATUS.md`

---

## 📞 Quick Contacts

**Broken in dev?** → Check console, hard refresh  
**Broken in production?** → Alert team immediately  
**Not sure if bug?** → Test on both local and production

---

**Pro Tip:** Keep this guide open in a browser tab while testing!

**Last Updated:** November 18, 2024

