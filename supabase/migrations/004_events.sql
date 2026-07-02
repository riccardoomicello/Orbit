-- Eventi del modulo Agenda/Appuntamenti
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  category text not null check (category in ('salute', 'scadenze', 'hobby', 'viaggi', 'lavoro')),
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  link text,
  reminder_minutes integer,
  is_recurring boolean not null default false,
  -- es. {"frequency": "weekly", "days_of_week": [1,3,5]} — frequency: 'daily' | 'weekly' | 'monthly'
  recurrence_rule jsonb,
  created_at timestamptz default now()
);

alter table events enable row level security;

create index events_user_start_idx on events (user_id, start_at);

create policy "owner_all" on events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.events to authenticated;

-- Sotto-checklist opzionale di un evento
create table event_checklist_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade not null,
  text text not null,
  completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

alter table event_checklist_items enable row level security;

create index event_checklist_items_event_idx on event_checklist_items (event_id);

create policy "owner_all" on event_checklist_items
  for all
  using (
    exists (
      select 1 from events
      where events.id = event_checklist_items.event_id
      and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from events
      where events.id = event_checklist_items.event_id
      and events.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.event_checklist_items to authenticated;
