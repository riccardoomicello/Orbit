-- Tiene traccia dei promemoria evento già notificati, per non inviarli due volte.
-- Chiave su (event_id, occurrence_at, notify_at): se l'utente cambia il promemoria
-- o l'orario dell'evento, notify_at cambia e il vecchio invio non blocca il nuovo
-- (equivale a "cancellare" il promemoria precedente senza bisogno di un job da annullare).
create table event_reminders_sent (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade not null,
  occurrence_at timestamptz not null,
  notify_at timestamptz not null,
  sent_at timestamptz default now(),
  unique (event_id, occurrence_at, notify_at)
);

alter table event_reminders_sent enable row level security;

create index event_reminders_sent_notify_idx on event_reminders_sent (notify_at);

create policy "owner_all" on event_reminders_sent
  for all
  using (
    exists (
      select 1 from events
      where events.id = event_reminders_sent.event_id
      and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from events
      where events.id = event_reminders_sent.event_id
      and events.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.event_reminders_sent to authenticated;

-- push_subscriptions (migration 001) non ha mai ricevuto il grant esplicito ad "authenticated"
-- (stesso problema diagnosticato per le tabelle di Routine): senza questo, la sottoscrizione
-- push fallisce con 403 e i promemoria non possono funzionare.
grant select, insert, update, delete on public.push_subscriptions to authenticated;
