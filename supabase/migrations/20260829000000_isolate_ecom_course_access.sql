-- Safe to run in a Supabase project shared with Purity OS.
-- This table belongs only to Ecom Hub and does not change Purity tables, policies, or data.
create table if not exists public.ecom_course_purchases (
  stripe_session_id text primary key,
  email text not null,
  paid_at timestamptz not null default now(),
  amount_cents integer,
  currency text,
  created_at timestamptz not null default now()
);

alter table public.ecom_course_purchases enable row level security;
revoke all on table public.ecom_course_purchases from anon;
grant select on table public.ecom_course_purchases to authenticated;

drop policy if exists "Ecom students can read their own paid access" on public.ecom_course_purchases;
create policy "Ecom students can read their own paid access"
on public.ecom_course_purchases for select to authenticated
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
