-- ============================================================================
-- SKEDOO: SUPABASE POSTGRESQL SCHEMA (Sesuai skedoo.pdf Master Plan)
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda (supabase.com)
-- ============================================================================

-- 1. Aktifkan ekstensi UUID
create extension if not exists "uuid-ossp";

-- 2. Tabel Profil Pengguna
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  nickname text,
  avatar_url text,
  gcal_access_token text,
  gcal_refresh_token text,
  push_subscription jsonb, -- Untuk Web Push Notification
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabel Duo Space (Ruang Berdua / Sahabat)
create table if not exists public.duo_spaces (
  id uuid default gen_random_uuid() primary key,
  name text default 'Our Bestie Space',
  pairing_code varchar(8) unique not null,
  user1_id uuid references public.profiles(id) on delete set null,
  user2_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Kategori Jadwal (Kuliah, Organisasi, Project, Belajar, Free Time)
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references public.duo_spaces(id) on delete cascade,
  name text not null,
  color_code text not null, -- contoh: #889C86, #7A919E
  icon_name text default 'calendar'
);

-- 5. Tabel Jadwal (Schedules)
create table if not exists public.schedules (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references public.duo_spaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  description text,
  location text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  is_recurring boolean default false,
  recurrence_pattern jsonb,
  is_both boolean default false, -- Apakah agenda bersama?
  gcal_event_id text, -- ID sinkronisasi Google Calendar
  reminder_minutes integer default 15,
  sound_tone text default 'lofi_gentle', -- Melodi notifikasi
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Aktifkan Supabase Realtime untuk tabel schedules (sinkronisasi instan antar 2 orang)
alter publication supabase_realtime add table public.schedules;

-- 7. Aturan Row Level Security (RLS) agar data bisa diakses oleh aplikasi
alter table public.profiles enable row level security;
alter table public.duo_spaces enable row level security;
alter table public.categories enable row level security;
alter table public.schedules enable row level security;

-- Policy sederhana untuk akses anon & authenticated
create policy "Public schedules select" on public.schedules for select using (true);
create policy "Public schedules insert" on public.schedules for insert with check (true);
create policy "Public schedules update" on public.schedules for update using (true);
create policy "Public schedules delete" on public.schedules for delete using (true);

create policy "Public duo_spaces select" on public.duo_spaces for select using (true);
create policy "Public duo_spaces insert" on public.duo_spaces for insert with check (true);
