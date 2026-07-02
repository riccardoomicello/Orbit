-- Stesso problema già visto per "authenticated" (migrations 003 e 005): questo progetto
-- non ha i default privileges standard di Supabase, quindi va concesso esplicitamente
-- l'accesso anche al ruolo "service_role", usato dalle Edge Function (es. check-reminders)
-- per bypassare la RLS e leggere/scrivere su tutte le tabelle.
grant select, insert, update, delete on public.events to service_role;
grant select, insert, update, delete on public.event_checklist_items to service_role;
grant select, insert, update, delete on public.event_reminders_sent to service_role;
grant select, insert, update, delete on public.push_subscriptions to service_role;
grant select, insert, update, delete on public.routines to service_role;
grant select, insert, update, delete on public.routine_logs to service_role;
