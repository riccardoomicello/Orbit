-- Le policy RLS da sole non bastano: serve anche il GRANT a livello di tabella
-- per il ruolo "authenticated", altrimenti PostgREST risponde 403 (42501)
-- prima ancora di valutare le policy.
grant select, insert, update, delete on public.routines to authenticated;
grant select, insert, update, delete on public.routine_logs to authenticated;
