begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ana-styling-reviews', 'ana-styling-reviews', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Visitors can upload Ana Styling review photos" on storage.objects;
create policy "Visitors can upload Ana Styling review photos"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'ana-styling-reviews'
  and (storage.foldername(name))[1] = 'reviews'
);

drop policy if exists "Public can read Ana Styling review photos" on storage.objects;
create policy "Public can read Ana Styling review photos"
on storage.objects for select to anon, authenticated
using (bucket_id = 'ana-styling-reviews');

drop policy if exists "Admins can manage Ana Styling review photos" on storage.objects;
create policy "Admins can manage Ana Styling review photos"
on storage.objects for all to authenticated
using (
  bucket_id = 'ana-styling-reviews'
  and exists (select 1 from public.studio_admins where user_id = auth.uid())
)
with check (
  bucket_id = 'ana-styling-reviews'
  and exists (select 1 from public.studio_admins where user_id = auth.uid())
);

create table if not exists public.studio_reviews (
  id uuid primary key default gen_random_uuid(),
  studio_id text not null default 'ana-styling',
  name text not null,
  review_text text not null,
  photo_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint studio_reviews_only_ana_styling check (studio_id = 'ana-styling')
);

alter table public.studio_reviews enable row level security;

drop policy if exists "Public can read published Ana Styling reviews" on public.studio_reviews;
create policy "Public can read published Ana Styling reviews"
on public.studio_reviews
for select
to anon, authenticated
using (studio_id = 'ana-styling' and published = true);

drop policy if exists "Visitors can submit Ana Styling reviews" on public.studio_reviews;
create policy "Visitors can submit Ana Styling reviews"
on public.studio_reviews
for insert
to anon, authenticated
with check (studio_id = 'ana-styling' and published = false);

drop policy if exists "Admins can read Ana Styling reviews" on public.studio_reviews;
create policy "Admins can read Ana Styling reviews"
on public.studio_reviews
for select
to authenticated
using (
  studio_id = 'ana-styling'
  and exists (
    select 1
    from public.studio_admins
    where studio_admins.user_id = auth.uid()
  )
);

drop policy if exists "Admins can update Ana Styling reviews" on public.studio_reviews;
create policy "Admins can update Ana Styling reviews"
on public.studio_reviews
for update
to authenticated
using (
  studio_id = 'ana-styling'
  and exists (
    select 1
    from public.studio_admins
    where studio_admins.user_id = auth.uid()
  )
)
with check (
  studio_id = 'ana-styling'
  and exists (
    select 1
    from public.studio_admins
    where studio_admins.user_id = auth.uid()
  )
);

drop policy if exists "Admins can delete Ana Styling reviews" on public.studio_reviews;
create policy "Admins can delete Ana Styling reviews"
on public.studio_reviews
for delete
to authenticated
using (
  studio_id = 'ana-styling'
  and exists (
    select 1
    from public.studio_admins
    where studio_admins.user_id = auth.uid()
  )
);

grant select, insert on public.studio_reviews to anon, authenticated;
grant update, delete on public.studio_reviews to authenticated;

commit;

