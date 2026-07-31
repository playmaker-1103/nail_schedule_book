create extension if not exists pgcrypto;

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  colour text not null default '#0f766e' check (colour ~ '^#[0-9a-fA-F]{6}$'),
  display_order integer not null default 0 check (display_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  default_duration integer not null check (default_duration between 15 and 240 and default_duration % 15 = 0),
  colour text not null default '#ccfbf1' check (colour ~ '^#[0-9a-fA-F]{6}$'),
  display_order integer not null default 0 check (display_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (length(trim(customer_name)) > 0),
  service_id uuid not null references public.services(id),
  staff_id uuid not null references public.staff(id),
  date date not null,
  start_time time not null,
  duration_minutes integer not null check (duration_minutes between 15 and 240 and duration_minutes % 15 = 0),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_display_order_idx on public.staff(display_order, name);
create index if not exists services_display_order_idx on public.services(display_order, name);
create index if not exists bookings_date_staff_start_idx on public.bookings(date, staff_id, start_time);
create index if not exists bookings_date_customer_idx on public.bookings(date, customer_name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists staff_updated_at on public.staff;
create trigger staff_updated_at
before update on public.staff
for each row execute function public.set_updated_at();

drop trigger if exists services_updated_at on public.services;
create trigger services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

alter table public.staff enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.staff to service_role;
grant select, insert, update, delete on public.services to service_role;
grant select, insert, update, delete on public.bookings to service_role;
