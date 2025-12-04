# Clinic Portal Improvement Plan

## Current State Analysis

### ✅ Fully Implemented
1. **Dashboard** – Live KPI metrics, treatment trends, today's schedule, actionable alerts (implemented via `use-dashboard.ts` + React Query)
2. **Patients** – Full CRUD: list, search, add new patients with Supabase persistence (`use-patients.ts`)
3. **Patient Detail** – Live patient chart with treatment/implant forms, real data from Supabase (`use-patient-detail.ts`)

### ⚠️ Partially Implemented
4. **Global Implants Registry** (`/implants`)
   - **Status**: Static mock data only
   - **Missing**: No Supabase queries, no "Register Implant" dialog, no QR/PDF export actions
   - **Schema**: `implants` table + RLS exist, but UI doesn't wire them

5. **Inventory Management** (`/inventory`)
   - **Status**: Static mock data only
   - **Missing**: No add/edit/delete flows, no stock adjustments when treatments consume units, no receiving workflow
   - **Schema**: `inventory` table exists with `product_name`, `lot_number`, `units_available`, `expiration_date`

6. **Templates** (`/templates`)
   - **Status**: Static display grids only
   - **Missing**: No create/edit/delete for treatment templates, consent forms, or post-care docs; no Supabase persistence
   - **Schema**: `treatment_templates` table exists with `name`, `areas (JSON)`, `default_units`, but no consent/document tables

### ❌ Not Implemented
7. **Settings page** – Sidebar links to `/settings`, but route doesn't exist; no clinic profile, user management, or billing config
8. **Appointment Scheduling** – Dashboard shows "Today's Schedule" but no calendar UI, no booking flow for new appointments
9. **Photo Upload** – Treatment forms reference `before_photos`/`after_photos` arrays, but no actual upload/storage logic (Supabase Storage not wired)
10. **Notifications Management** – `NotificationBell` reads/marks alerts, but no admin panel to create custom notifications or configure triggers
11. **Reports & Analytics** – No exports (PDF/CSV), no financial summaries, no provider performance dashboards
12. **Role & Permissions UI** – RLS enforces roles, but no screens to assign/revoke roles for staff

---

## Missing Logic & Workflows

### 1. Inventory-Treatment Integration
- **Gap**: Treatments log `lot_number` and `units_used`, but inventory stock doesn't decrement automatically.
- **Impact**: Manual reconciliation; risk of using expired lots.
- **Solution**: After creating a treatment, trigger an inventory mutation to reduce `units_available` if lot exists; surface warnings if stock is insufficient or lot expired.

### 2. Implant Registration from Global Page
- **Gap**: `/implants` shows all implants but "Register Implant" does nothing.
- **Impact**: Staff must open a patient chart to register an implant; no bulk entry flow.
- **Solution**: Add dialog on `/implants` with patient selector (searchable dropdown), mirror the form from `PatientDetail`, write to Supabase, and refresh the table.

### 3. Template Application During Treatment Entry
- **Gap**: Treatment dialog has manual fields; no "Apply Template" quick-fill.
- **Impact**: Slower data entry, inconsistent area/unit values.
- **Solution**: Fetch `treatment_templates` in the treatment form, add a select, pre-populate `areas_treated`/`units_used` when chosen.

### 4. Document Management
- **Gap**: Patient detail has a "Documents" tab, but it's static; no upload/download or consent signature workflow.
- **Impact**: Paper-based or external storage for consents/photos.
- **Solution**: Create Supabase Storage buckets (`patient-documents`, `treatment-photos`), add upload UI, store URLs in new `documents` table, enforce RLS.

### 5. Scheduling & Appointments
- **Gap**: Dashboard reads `treatments` filtered by date for "Today's Schedule," but no way to create future appointments.
- **Impact**: Staff use external calendars.
- **Solution**: Add `appointments` table with `patient_id`, `appointment_date`, `status`, `notes`; build calendar view (FullCalendar or shadcn date picker + list); link to treatment creation once completed.

### 6. Staff & Settings Management
- **Gap**: No UI to create staff accounts, assign roles, or configure clinic name/logo.
- **Impact**: Admin must use Supabase dashboard directly.
- **Solution**: Build `/settings` page with tabs: Clinic Profile (edit `profiles`), Team (list `user_roles`, invite staff), Preferences (notification toggles).

### 7. Realtime Updates Beyond Notifications
- **Gap**: Only `notifications` table uses realtime subscriptions; inventory/treatment lists don't auto-refresh when other users make changes.
- **Impact**: Stale data until manual refresh.
- **Solution**: Add Supabase realtime channels for `inventory`, `patients`, `treatments`, `implants` in relevant hooks; invalidate queries on insert/update/delete events.

---

## Recommended Prioritization

### Phase 1: Core Clinical Workflows (Weeks 1–2)
1. **Wire Implants page to Supabase** – Add `useImplants` hook, table query, "Register Implant" dialog with patient search.
2. **Wire Inventory page to Supabase** – Add `useInventory` hook, CRUD dialogs (add product, adjust stock, mark expired).
3. **Integrate Inventory with Treatments** – Auto-decrement stock when treatment is logged; show lot validation warnings.
4. **Template CRUD + Application** – Build forms to create/edit `treatment_templates`, add template selector to treatment entry.

### Phase 2: Scheduling & Documents (Weeks 3–4)
5. **Appointments System** – Create `appointments` table + calendar UI, link to treatment creation post-visit.
6. **Document Upload** – Set up Supabase Storage, add upload UI in patient detail, create `documents` table with file URLs + metadata.
7. **Photo Upload for Treatments** – Same Storage approach for before/after photos; display in `PhotoGallery` component.

### Phase 3: Admin & Reporting (Week 5+)
8. **Settings Page** – Clinic profile editor, team/role management, notification preferences.
9. **Reports Dashboard** – Export treatments/inventory to CSV/PDF; add financial summary (revenue by provider/month).
10. **Realtime Enhancements** – Subscribe to all critical tables for live updates across sessions.
11. **Audit Log** – Record who created/modified records (add `created_by`/`updated_by` columns + triggers).

---

## Technical Debt & Architecture Notes

- **Consistent Hook Pattern**: Patient pages use direct Supabase calls; clinic pages now use React Query hooks. Migrate patient side to hooks for consistency.
- **Type Safety**: All new features should leverage `Tables<"table_name">` and `TablesInsert<"table_name">` from `types.ts`.
- **Error Handling**: Add retry logic + user-friendly error messages in mutations (currently some hooks just log to console).
- **Loading States**: Ensure all tables/forms show skeletons or spinners during async ops (some pages already do this, others don't).
- **Accessibility**: Aria labels, keyboard navigation, focus management for all new dialogs/forms.
- **Mobile Responsive**: Clinic portal is desktop-first; test all new screens at tablet breakpoints (current components handle this well, but dialogs may need adjustments).

---

## Success Metrics

- **Inventory Accuracy**: Stock levels match physical inventory ±2 units.
- **Data Entry Speed**: Average time to log a treatment drops by 30% with templates + auto-stock.
- **User Adoption**: 80%+ of staff use in-app scheduling vs. external tools within 1 month.
- **Error Rate**: <5% of treatments logged with invalid/expired lots after validation.
- **Patient Satisfaction**: 90%+ of patients can download implant cards/documents via portal.

---

## Next Steps

1. **Review with stakeholders** – Prioritize features based on clinic urgency.
2. **Create Jira/Linear tickets** – Break Phase 1 tasks into individual issues with acceptance criteria.
3. **Allocate team** – Assign Ava (frontend), Noah (backend migrations), Lena (QA coverage), Mila (mockups for new screens).
4. **Set sprint goals** – Target 2-week sprints, deliver Phase 1 by end of Sprint 2.
5. **Schedule demo sessions** – Show progress weekly to validate UX with real clinic staff.

