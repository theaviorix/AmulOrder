# AGENTS.md

## Project Context

This is a supplier–retailer ordering & billing app ("Amul Connect"), built with React + Vite and Supabase (Postgres, Auth, Edge Functions). Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and deployment.

## Key Files

- `src/`: frontend application source.
- `src/lib/supabaseClient.js`: Supabase client instance.
- `src/lib/supabaseAuth.js`: auth helpers (sign up/in/out, session, profile lookups).
- `src/lib/AppSession.jsx`: React context providing the current session (role, profile id, etc.) to pages.
- `src/pages/supplier/`, `src/pages/customer/`: role-specific pages, routed in `src/App.jsx`.
- `supabase/functions/`: server-side Edge Functions for anything that needs the service-role key (e.g. account deletion).
- `.env.local`: local-only environment values (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`); never commit secrets.

## Legacy code, present but not authoritative

`src/lib/store.js`, `src/lib/api.js`, and `src/lib/localAuth.js` are an older localStorage-backed mock data layer from before this app was migrated to Supabase. `store.js` is still imported by several live pages (e.g. `supplier/Customers.jsx`, `supplier/Overview.jsx`) for orders/bills/messages, so it isn't fully dead — but new work should read/write through `supabase` directly (see `supabaseClient.js`) rather than extending the mock store. `api.js` and `localAuth.js` are only used by orphaned, unrouted pages and can likely be deleted along with those pages.

## Working Notes

- Use `npm run dev` for local development; it talks directly to your Supabase project via the env vars in `.env.local`.
- Prefer adding logic to Supabase (RLS policies, Postgres functions, or an Edge Function under `supabase/functions/`) over baking business logic into the mock `store.js` layer.
- Never put the Supabase service-role key in frontend code — anything that needs it belongs in a Supabase Edge Function.
- Run `npm run lint` and `npm run build` before finishing code changes.
