create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'worker' check (role in ('admin', 'worker')),
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null default '',
  client_name text not null default '',
  contract_amount numeric(14, 2) not null default 0 check (contract_amount >= 0),
  progress integer not null default 0 check (progress between 0 and 100),
  status text not null default 'In progress' check (status in ('In progress', 'Completed', 'On hold')),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  phone text not null default '',
  worker_type text not null default '',
  site_id uuid references public.sites(id) on delete set null,
  daily_rate numeric(12, 2) not null default 0 check (daily_rate >= 0),
  joined_on date,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete restrict,
  category text not null check (category in (
    'Working Tools', 'Machine Accessories', 'Fuel', 'Labour Advances',
    'Consumable Materials', 'Transport', 'Loading & Unloading'
  )),
  amount numeric(12, 2) not null check (amount > 0),
  description text not null default '',
  expense_date date not null default current_date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  payment_date date not null default current_date,
  payment_type text not null default 'Progress payment',
  description text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete restrict,
  site_id uuid not null references public.sites(id) on delete restrict,
  work_date date not null default current_date,
  status text not null check (status in ('Present', 'Absent', 'Half day', 'Leave')),
  check_in time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (worker_id, work_date)
);

create table if not exists public.advances (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete restrict,
  site_id uuid not null references public.sites(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  advance_date date not null default current_date,
  description text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses
  add column if not exists worker_id uuid references public.workers(id) on delete restrict;

alter table public.expenses drop constraint if exists expenses_category_check;
alter table public.expenses add constraint expenses_category_check check (category in (
  'Working Tools', 'Machine Accessories', 'Fuel', 'Labour Advances',
  'Consumable Materials', 'Transport', 'Loading & Unloading', 'Others'
));

alter table public.expenses drop constraint if exists expenses_advance_worker_check;
alter table public.expenses add constraint expenses_advance_worker_check check (
  (category = 'Labour Advances' and worker_id is not null)
  or (category <> 'Labour Advances' and worker_id is null)
) not valid;

alter table public.advances
  add column if not exists expense_id uuid unique references public.expenses(id) on delete cascade;

create index if not exists workers_site_id_idx on public.workers(site_id);
create index if not exists expenses_worker_id_idx on public.expenses(worker_id);
create index if not exists expenses_site_date_idx on public.expenses(site_id, expense_date desc);
create index if not exists payments_site_date_idx on public.payments(site_id, payment_date desc);
create index if not exists attendance_worker_date_idx on public.attendance(worker_id, work_date desc);
create index if not exists advances_worker_date_idx on public.advances(worker_id, advance_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_expense_advance()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.category = 'Labour Advances' then
    insert into public.advances (
      expense_id, worker_id, site_id, amount, advance_date, description, created_by
    )
    values (
      new.id, new.worker_id, new.site_id, new.amount, new.expense_date, new.description, new.created_by
    )
    on conflict (expense_id) do update set
      worker_id = excluded.worker_id,
      site_id = excluded.site_id,
      amount = excluded.amount,
      advance_date = excluded.advance_date,
      description = excluded.description,
      created_by = excluded.created_by;
  else
    delete from public.advances where expense_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_expense_advance on public.expenses;
create trigger sync_expense_advance
after insert or update on public.expenses
for each row execute procedure public.sync_expense_advance();

insert into public.advances (
  expense_id, worker_id, site_id, amount, advance_date, description, created_by
)
select id, worker_id, site_id, amount, expense_date, description, created_by
from public.expenses
where category = 'Labour Advances' and worker_id is not null
on conflict (expense_id) do update set
  worker_id = excluded.worker_id,
  site_id = excluded.site_id,
  amount = excluded.amount,
  advance_date = excluded.advance_date,
  description = excluded.description,
  created_by = excluded.created_by;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.is_linked_worker(target_worker_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workers
    where id = target_worker_id and user_id = (select auth.uid())
  );
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.sync_worker_profile_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null then
    insert into public.profiles (id, full_name)
    values (new.user_id, new.full_name)
    on conflict (id) do update
    set full_name = excluded.full_name;
  end if;
  return new;
end;
$$;

drop trigger if exists auth_user_profile on auth.users;
create trigger auth_user_profile
after insert on auth.users
for each row execute procedure public.create_profile_for_new_user();

drop trigger if exists sync_worker_profile_name on public.workers;
create trigger sync_worker_profile_name
after insert or update of user_id, full_name on public.workers
for each row execute procedure public.sync_worker_profile_name();

update public.profiles as profile
set full_name = worker.full_name
from public.workers as worker
where worker.user_id = profile.id
  and profile.full_name = '';

do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles', 'sites', 'workers', 'expenses', 'payments', 'attendance', 'advances']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute procedure public.set_updated_at()',
      table_name
    );
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.sites enable row level security;
alter table public.workers enable row level security;
alter table public.expenses enable row level security;
alter table public.payments enable row level security;
alter table public.attendance enable row level security;
alter table public.advances enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()) and role = 'worker');

drop policy if exists sites_read on public.sites;
create policy sites_read on public.sites
for select to authenticated using (true);
drop policy if exists sites_admin_write on public.sites;
create policy sites_admin_write on public.sites
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists workers_read on public.workers;
create policy workers_read on public.workers
for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists workers_admin_write on public.workers;
create policy workers_admin_write on public.workers
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists expenses_admin_access on public.expenses;
create policy expenses_admin_access on public.expenses
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists payments_admin_access on public.payments;
create policy payments_admin_access on public.payments
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists attendance_admin_access on public.attendance;
create policy attendance_admin_access on public.attendance
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
drop policy if exists attendance_worker_read on public.attendance;
create policy attendance_worker_read on public.attendance
for select to authenticated
using ((select public.is_linked_worker(worker_id)));
drop policy if exists attendance_worker_insert on public.attendance;
create policy attendance_worker_insert on public.attendance
for insert to authenticated
with check (
  status = 'Present'
  and work_date = current_date
  and exists (
    select 1
    from public.workers as worker
    where worker.id = attendance.worker_id
      and worker.user_id = (select auth.uid())
      and worker.site_id = attendance.site_id
      and worker.status = 'Active'
  )
);
drop policy if exists advances_admin_access on public.advances;
create policy advances_admin_access on public.advances
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
drop policy if exists advances_worker_read on public.advances;
create policy advances_worker_read on public.advances
for select to authenticated
using ((select public.is_linked_worker(worker_id)));

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.sites,
  public.workers,
  public.expenses,
  public.payments,
  public.attendance,
  public.advances
to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_linked_worker(uuid) to authenticated;