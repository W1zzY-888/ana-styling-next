# Ana Styling Supabase Setup

Supabase is used for the shared CMS data and image storage. The frontend uses only the public anon key. Do not put a `service_role` key in this project.

## 1. Create The Supabase Project

Create a Supabase project and copy:

- Project URL
- anon public key

## 2. Create Tables, RLS Policies, And Storage

Open the Supabase SQL editor and run the full content of:

```text
supabase/schema.sql
```

This creates:

- `studio_sites` for the website CMS JSON
- `studio_admins` for the allowed admin users
- `ana-styling-media` public bucket for uploaded images
- RLS policies where public users can only read, and only approved authenticated admins can write

## 3. Create Admin Users

In Supabase:

`Authentication` -> `Users` -> `Add user`

Create users for Maxim and Ana with email/password.

Copy each user's `User UID`, then add them as admins in SQL:

```sql
insert into public.studio_admins (user_id)
values
  ('PASTE_MAXIM_USER_UID_HERE'),
  ('PASTE_ANA_USER_UID_HERE')
on conflict (user_id) do nothing;
```

Only users listed in `studio_admins` can save site content or upload/update/delete media.

## 4. Add Initial Website Content

After creating at least one admin user, open `/admin`, sign in, make one small text change, and save. That creates the first `studio_sites` row.

If you prefer to seed from SQL instead, insert a JSON export into `studio_sites.content`.

The app writes only the row with:

```text
studio_sites.id = ana-styling
```

Every save updates `updated_at` and verifies the returned row before the admin shows `Saved`. If Supabase rejects the write, the admin shows `Couldn’t save — Retry` instead of pretending the change is synced.

## 5. Add GitHub Secrets

In GitHub:

`Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`

Add:

```text
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Then rerun the GitHub Pages workflow or push a new commit.

## 6. Local Development

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

## Security Notes

- Public visitors use the anon key and can only `SELECT` website data and read public media.
- Admin changes require Supabase Auth.
- Database writes require an authenticated user whose `auth.uid()` exists in `studio_admins`.
- Storage upload/update/delete requires the same admin check.
- The frontend never uses a `service_role` key.
