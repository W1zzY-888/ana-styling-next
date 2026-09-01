create table if not exists public.studio_sites (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.studio_sites enable row level security;

drop policy if exists "Public can read Ana Styling content" on public.studio_sites;
create policy "Public can read Ana Styling content"
on public.studio_sites
for select
using (id = 'ana-styling');

drop policy if exists "Studio can write Ana Styling content" on public.studio_sites;
create policy "Studio can write Ana Styling content"
on public.studio_sites
for insert
with check (id = 'ana-styling');

drop policy if exists "Studio can update Ana Styling content" on public.studio_sites;
create policy "Studio can update Ana Styling content"
on public.studio_sites
for update
using (id = 'ana-styling')
with check (id = 'ana-styling');

insert into storage.buckets (id, name, public)
values ('ana-styling-media', 'ana-styling-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read Ana Styling media" on storage.objects;
create policy "Public can read Ana Styling media"
on storage.objects
for select
using (bucket_id = 'ana-styling-media');

drop policy if exists "Studio can upload Ana Styling media" on storage.objects;
create policy "Studio can upload Ana Styling media"
on storage.objects
for insert
with check (bucket_id = 'ana-styling-media');

drop policy if exists "Studio can update Ana Styling media" on storage.objects;
create policy "Studio can update Ana Styling media"
on storage.objects
for update
using (bucket_id = 'ana-styling-media')
with check (bucket_id = 'ana-styling-media');

drop policy if exists "Studio can delete Ana Styling media" on storage.objects;
create policy "Studio can delete Ana Styling media"
on storage.objects
for delete
using (bucket_id = 'ana-styling-media');
