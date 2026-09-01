# Ana Styling Supabase Setup

The site can run without Supabase, but admin changes are then saved only in the current browser. To make Ana's edits persist online and appear for everyone, connect Supabase.

## 1. Create The Supabase Project

Create a Supabase project and copy:

- Project URL
- anon public key

## 2. Create Database And Storage

Open the Supabase SQL editor and run:

```sql
-- Paste the full content of supabase/schema.sql here.
```

This creates:

- `studio_sites` table for portfolio, services, publications, hero and site text
- `ana-styling-media` public storage bucket for uploaded images

## 3. Add GitHub Secrets

In GitHub:

`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add:

```text
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Then rerun the GitHub Pages workflow or push a new commit.

## 4. Local Development

Create `.env.local`:

```text
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=ana-styling-media
NEXT_PUBLIC_STUDIO_ID=ana-styling
```

Then run:

```bash
npm run dev
```

## Important

This is a lightweight CMS connection for the current password-protected prototype. For the final production version, replace the shared password gate with Supabase Auth and stricter write policies.
