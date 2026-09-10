-- Apply after the existing Reviews setup. This clears existing reviews once.
-- Other site content, portfolio images and stored files are preserved.
begin;

alter table public.studio_reviews add column if not exists rating smallint;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.studio_reviews'::regclass
      and conname = 'studio_reviews_rating_range'
  ) then
    alter table public.studio_reviews add constraint studio_reviews_rating_range
      check (rating between 1 and 5);
  end if;
end $$;

drop policy if exists "Review submissions require a rating" on public.studio_reviews;
create policy "Review submissions require a rating"
on public.studio_reviews as restrictive for insert to anon, authenticated
with check (rating is not null and rating between 1 and 5 and photo_url is null);

drop policy if exists "Visitors can upload Ana Styling review photos" on storage.objects;

create table if not exists public.studio_review_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);
alter table public.studio_review_migrations enable row level security;
revoke all on public.studio_review_migrations from public, anon, authenticated;

do $$
declare
  applied_id text;
begin
  insert into public.studio_review_migrations (id)
  values ('20260910_reviews_stars_reset')
  on conflict (id) do nothing
  returning id into applied_id;

  if applied_id is not null then
    delete from public.studio_reviews where studio_id = 'ana-styling';
    update public.studio_sites
    set content = jsonb_set(content, '{reviews}', '[]'::jsonb, true),
        updated_at = now()
    where id = 'ana-styling';
  end if;
end $$;

notify pgrst, 'reload schema';
commit;

