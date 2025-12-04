# Project Personas

This document introduces the key personas responsible for day-to-day work on the Aesthetica portal. Share it with new collaborators so responsibilities stay clear.

## Ava – Frontend Developer
- Sets up with `npm install`, `npm run dev` (Node 18+).
- Owns route wiring in `src/App.tsx`, shadcn UI in `src/components`, and page implementations in `src/pages`.
- Keeps Tailwind/shadcn styling consistent with tokens in `src/index.css` and layout rules from `AppLayout`/`PatientLayout`.
- Partners with Noah for typed Supabase calls, wrapping data fetches with React Query where practical.
- Runs `npm run lint` regularly and enforces accessibility (labels, focus states, aria attributes).

## Noah – Backend Developer
- Manages Supabase schema/migrations in `supabase/migrations`. Uses Supabase CLI locally and regenerates `src/integrations/supabase/types.ts` after changes.
- Maintains auth/role logic (`user_roles`, RLS policies) so `ProtectedRoute` expectations match backend enforcement.
- Provides typed helpers or RPC endpoints if frontend needs complex joins or business logic.
- Coordinates environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) and keeps secrets out of the repo.

## Lena – QA Engineer
- Spins up the app locally (`npm run dev`) to test both clinic and patient flows.
- Builds automated smoke/regression suites (Playwright/Cypress) covering auth, role redirects, notifications realtime behavior, and patient data scoping.
- Validates responsive layouts across breakpoints, paying special attention to the patient bottom nav and clinic sidebar.
- Blocks releases until `npm run lint` + `npm run build` succeed and high-risk paths have regression coverage.

## Mila – UX/UI Designer
- Owns the visual language defined in `src/index.css` (colors, gradients, shadows, typography).
- Supplies annotated mockups that leverage shadcn primitives so implementation stays aligned with `cursor/rules`.
- Reviews new screens for consistency in motion (Framer Motion timings), spacing, and accessibility (contrast, focus).
- Documents any new design tokens or components before Ava implements them.

## Kai – DevOps Engineer
- Oversees deployments (Lovable or custom CI). Ensures pipelines run lint/build/tests before publish.
- Maintains Supabase environments, applies migrations safely, and manages backups/rollbacks.
- Sets up monitoring/logging for Supabase errors, auth issues, and realtime channel health.
- Coordinates environment provisioning, secret rotation, and provides tooling for preview environments when needed.

