-- Ecom Hub paid-course access. Apply in the Supabase SQL editor or as a migration.
create table if not exists public.course_purchases (
  stripe_session_id text primary key,
  email text not null,
  paid_at timestamptz not null default now(),
  amount_cents integer,
  currency text,
  created_at timestamptz not null default now()
);

alter table public.course_purchases enable row level security;
revoke all on table public.course_purchases from anon;
grant select on table public.course_purchases to authenticated;

drop policy if exists "Students can read their own paid access" on public.course_purchases;
create policy "Students can read their own paid access"
on public.course_purchases for select to authenticated
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- The webhook uses the service-role key and is the only writer.
