-- Schedula il controllo periodico dei promemoria evento (ogni 5 minuti).
-- Richiede che la function "check-reminders" sia già stata distribuita
-- (Dashboard Supabase > Edge Functions > New Function).
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'check-event-reminders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://tarueddaislukbnjqduk.supabase.co/functions/v1/check-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_TBY7KqytSsmXJr1D7vcO6g_UKLQEz1P'
    ),
    body := '{}'::jsonb
  );
  $$
);
