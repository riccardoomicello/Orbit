-- Routine (mattina / pomeriggio / sera), frequenza giornaliera
create table routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  time_of_day text not null check (time_of_day in ('mattina', 'pomeriggio', 'sera')),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz default now()
);

alter table routines enable row level security;

create policy "owner_all" on routines
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Log giornaliero per ogni routine: fatto / non fatto / riposo programmato
create table routine_logs (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references routines(id) on delete cascade not null,
  log_date date not null,
  status text not null check (status in ('done', 'not_done', 'rest')),
  created_at timestamptz default now(),
  unique (routine_id, log_date)
);

alter table routine_logs enable row level security;

create index routine_logs_routine_date_idx on routine_logs (routine_id, log_date desc);

create policy "owner_all" on routine_logs
  for all
  using (
    exists (
      select 1 from routines
      where routines.id = routine_logs.routine_id
      and routines.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from routines
      where routines.id = routine_logs.routine_id
      and routines.user_id = auth.uid()
    )
  );
