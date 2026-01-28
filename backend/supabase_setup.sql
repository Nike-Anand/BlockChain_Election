-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users Table
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  username text unique not null,
  password text not null,
  voter_id text unique not null,
  role text check (role in ('admin', 'voter', 'commission')) default 'voter',
  pass1 text,
  pass2 text,
  pass3 text,
  pass4 text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Parties Table
create table public.parties (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  symbol text not null,
  description text,
  manifesto text,
  image_url text,
  votes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Votes Table (Ledger)
create table public.votes (
  id uuid default uuid_generate_v4() primary key,
  user_id text unique not null, -- Stores Voter ID (EPIC)
  party_name text not null,
  booth_id text default 'ONLINE',
  tx_hash text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Election Settings (Singleton)
create table public.settings (
  id integer primary key default 1,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  is_active boolean default false,
  registration_open boolean default true,
  min_voting_age integer default 18,
  check (id = 1) -- Ensure only one row
);

-- Insert Default Settings
insert into public.settings (id, is_active, registration_open)
values (1, false, true)
on conflict (id) do nothing;

-- Insert Admin User (Default)
insert into public.users (username, password, voter_id, role, pass1, pass2, pass3, pass4)
values ('admin', '123', 'ADMIN', 'admin', 'pass1', 'pass2', 'pass3', 'pass4')
on conflict (username) do nothing;

-- Insert Election Commission User
insert into public.users (username, password, voter_id, role)
values ('commission', 'comm123', 'COMMISSION', 'commission')
on conflict (username) do nothing;

-- Insert 4-Factor Authorization Key Holders
insert into public.users (username, password, voter_id, role)
values 
  ('Secretariat 1', 'pass1', 'SE', 'admin'),
  ('Secretariat 2', 'pass2', 'SE-2', 'admin'),
  ('Observer', 'pass3', 'OB', 'admin'),
  ('Administrator', 'pass4', 'ADM', 'admin')
on conflict (voter_id) do nothing;

-- RLS Policies (Optional but Good Practice - Disable for now for ease of API access)
alter table public.users enable row level security;
alter table public.parties enable row level security;
alter table public.votes enable row level security;
alter table public.settings enable row level security;

-- Allow Anon/Service Role full access (since Python backend handles auth)
create policy "Enable access for service role" on public.users for all using (true) with check (true);
create policy "Enable access for service role" on public.parties for all using (true) with check (true);
create policy "Enable access for service role" on public.votes for all using (true) with check (true);
create policy "Enable access for service role" on public.settings for all using (true) with check (true);
