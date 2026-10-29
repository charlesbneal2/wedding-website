-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to rerun: it never drops or overwrites rows.
create table if not exists public.addresses (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null check (length(trim(name))     between 1 and 200),
  email      text not null check (length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  address1   text not null check (length(trim(address1)) between 1 and 300),
  address2   text not null default '' check (length(address2) <= 300),
  city       text not null check (length(trim(city))     between 1 and 100),
  state      text not null check (length(trim(state))    between 1 and 100),
  zip        text not null check (length(trim(zip))      between 1 and 32),
  country    text not null check (length(trim(country))  between 1 and 100),
  -- Format only: US ZIP must be 5 digits or ZIP+4. Other countries are free text.
  check (country <> 'United States' or zip ~ '^\d{5}(-\d{4})?$')
);

-- The site is public, so the browser may only INSERT. Reading rows needs the
-- dashboard (Table Editor) or the secret key; anon can never select/update/delete.
alter table public.addresses enable row level security;
revoke all on public.addresses from anon, authenticated;
grant insert on public.addresses to anon;
drop policy if exists "anyone can submit an address" on public.addresses;
create policy "anyone can submit an address" on public.addresses
  for insert to anon with check (true);

-- Admin page (/admin): signed-in users (you and your partner, created by hand in
-- Authentication -> Users) can read, edit and delete addresses. Public signups
-- MUST stay off (Authentication -> Sign In / Providers -> "Allow new users to
-- sign up"), otherwise any visitor could create an account and read everything.
grant select, update, delete on public.addresses to authenticated;
drop policy if exists "admins read addresses" on public.addresses;
create policy "admins read addresses" on public.addresses
  for select to authenticated using (true);
drop policy if exists "admins edit addresses" on public.addresses;
create policy "admins edit addresses" on public.addresses
  for update to authenticated using (true) with check (true);
drop policy if exists "admins delete addresses" on public.addresses;
create policy "admins delete addresses" on public.addresses
  for delete to authenticated using (true);
