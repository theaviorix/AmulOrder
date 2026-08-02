# Amul Connect

A supplier–retailer ordering & billing app, built with React + Vite and backed by Supabase (Postgres, Auth, Edge Functions).

## Prerequisites

1. Clone the repository.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.
4. A Supabase project (create one at [supabase.com](https://supabase.com) if you don't have one).

## Environment variables

Create a `.env.local` file in the project root:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both values are in your Supabase project's **Settings → API** page.

## Run locally

```bash
npm run dev
```

Open the local URL printed by Vite.

## Build for production

```bash
npm run build
```

Output is written to `./dist`.

## Database

The app expects the following tables in your Supabase project's `public` schema: `profiles`, `supplier_profiles`, `customer_profiles`, `supplier_links`, `products`, `orders`, `bills`, `notifications`, `reviews`. Row Level Security (RLS) should be enabled on all of them, scoped to the authenticated user (see existing policies in the Supabase dashboard for the pattern to follow when adding new tables).

## Edge Functions

Some features (e.g. account deletion) require server-side logic that can't safely run in the browser, and are implemented as Supabase Edge Functions in `supabase/functions/`. Deploy them with the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref your-project-ref
supabase functions deploy delete-account
```

## Deploying the frontend

This is a static Vite app — deploy the `dist/` output to Vercel, Netlify, or any static host. A `vercel.json` is included for Vercel deployments.
