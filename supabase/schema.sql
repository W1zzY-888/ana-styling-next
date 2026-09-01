create table if not exists public.studio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.studio_admins enable row level security;

drop policy if exists "Admins can read their own access" on public.studio_admins;
create policy "Admins can read their own access"
on public.studio_admins
for select
to authenticated
using (user_id = auth.uid());

create table if not exists public.studio_sites (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now(),
  constraint studio_sites_only_ana_styling check (id = 'ana-styling')
);

alter table public.studio_sites enable row level security;

drop policy if exists "Public can read Ana Styling content" on public.studio_sites;
create policy "Public can read Ana Styling content"
on public.studio_sites
for select
to anon, authenticated
using (id = 'ana-styling');

drop policy if exists "Admins can create Ana Styling content" on public.studio_sites;
create policy "Admins can create Ana Styling content"
on public.studio_sites
for insert
to authenticated
with check (
  id = 'ana-styling'
  and exists (
    select 1
    from public.studio_admins
    where studio_admins.user_id = auth.uid()
  )
);

drop policy if exists "Admins can update Ana Styling content" on public.studio_sites;
create policy "Admins can update Ana Styling content"
on public.studio_sites
for update
to authenticated
using (
  id = 'ana-styling'
  and exists (
    select 1
    from public.studio_admins
    where studio_admins.user_id = auth.uid()
  )
)
with check (
  id = 'ana-styling'
  and exists (
    select 1
    from public.studio_admins
    where studio_admins.user_id = auth.uid()
  )
);

drop policy if exists "Admins can delete Ana Styling content" on public.studio_sites;
create policy "Admins can delete Ana Styling content"
on public.studio_sites
for delete
to authenticated
using (
  id = 'ana-styling'
  and exists (
    select 1
    from public.studio_admins
    where studio_admins.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('ana-styling-media', 'ana-styling-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read Ana Styling media" on storage.objects;
create policy "Public can read Ana Styling media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'ana-styling-media');

drop policy if exists "Admins can upload Ana Styling media" on storage.objects;
create policy "Admins can upload Ana Styling media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ana-styling-media'
  and exists (
    select 1
    from public.studio_admins
    where studio_admins.user_id = auth.uid()
  )
);

drop policy if exists "Admins can update Ana Styling media" on storage.objects;
create policy "Admins can update Ana Styling media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'ana-styling-media'
  and exists (
    select 1
    from public.studio_admins
    where studio_admins.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'ana-styling-media'
  and exists (
    select 1
    from public.studio_admins
    where studio_admins.user_id = auth.uid()
  )
);

drop policy if exists "Admins can delete Ana Styling media" on storage.objects;
create policy "Admins can delete Ana Styling media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'ana-styling-media'
  and exists (
    select 1
    from public.studio_admins
    where studio_admins.user_id = auth.uid()
  )
);
