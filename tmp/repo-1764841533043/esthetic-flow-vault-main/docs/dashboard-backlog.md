# Clinic Dashboard Backlog

This backlog tracks the work required to turn the clinic dashboard into a live, actionable control center. Each item includes an owner plus suggested acceptance criteria.

## 1. Live KPI Cards (Ava + Noah)
- Replace static stat cards with Supabase-backed queries for active patients, weekly treatments, stocked products, and expiring lots.
- Use React Query with loading/empty/error states that match the glass aesthetic.
- Noah to expose a single RPC or view that aggregates the metrics with role-aware filters.

## 2. Treatment Trends Visualization (Ava + Mila)
- Embed `TreatmentChart` (or updated visual) on the dashboard to show treatment volume over the past 6 months.
- Mila to supply layout/motion guidance so the chart coexists with other KPI panels without overwhelming the grid.
- Include tooltips and legends accessible via keyboard/focus.

## 3. Today’s Schedule & Quick Actions (Ava + Mila)
- Build a “Today” rail listing upcoming appointments, prep tasks, and follow-ups with status chips.
- Provide quick actions (book appointment, add patient, reorder product) surfaced via shadcn buttons/cards.
- Designs should highlight role-based priorities (providers vs. admins).

## 4. Actionable Alerts Feed (Ava + Noah)
- Merge expiry alerts, low-stock items, overdue tasks, and unread patient messages into a single alert list.
- Support acknowledge/snooze actions that write back to Supabase and emit to notifications.
- Noah to extend alert tables/RLS; Ava to hook into `NotificationBell` patterns for realtime updates.

## 5. Regression & Responsiveness Coverage (Lena)
- Author test cases covering live KPI data, alerts feed, and Today rail interactions across desktop/tablet breakpoints.
- Ensure role-based access prevents patients from loading clinic metrics.
- Capture edge cases (no appointments today, no alerts, degraded Supabase response).

## 6. Deployment & Monitoring Readiness (Kai)
- Plan migrations/deploy steps for new Supabase views/functions/tables powering dashboard metrics.
- Add monitoring for dashboard query latency and alert fan-out reliability; wire alerts to ops tooling.
- Verify environment variables and secrets needed for any new services.

