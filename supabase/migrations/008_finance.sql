-- Modulo Finanza: transazioni (entrate/uscite/trasferimenti), budget mensile
-- per categoria e abbonamenti ricorrenti. Nessuna tabella "conti": il saldo di
-- ogni conto si calcola sommando le transazioni (account è un valore fisso,
-- non una riga a parte). Nessuna tabella "categorie": la lista di default vive
-- nel frontend, l'utente può usarne di nuove semplicemente scrivendole.

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric(12,2) not null check (amount > 0),
  description text,
  category text,
  account text not null check (account in ('personale', 'aziendale', 'contanti', 'crypto')),
  -- valorizzato solo per type = 'transfer'
  transfer_to_account text check (transfer_to_account in ('personale', 'aziendale', 'contanti', 'crypto')),
  date date not null default current_date,
  created_at timestamptz default now()
);

alter table transactions enable row level security;

create index transactions_user_date_idx on transactions (user_id, date desc);

create policy "owner_all" on transactions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.transactions to service_role;

-- Limite di budget per categoria: una riga per categoria, riutilizzata ogni
-- mese (upsert su user_id + category), non una riga per mese.
create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  monthly_limit numeric(12,2) not null check (monthly_limit > 0),
  created_at timestamptz default now(),
  unique (user_id, category)
);

alter table budgets enable row level security;

create policy "owner_all" on budgets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.budgets to authenticated;
grant select, insert, update, delete on public.budgets to service_role;

-- Abbonamenti ricorrenti, con promemoria push configurabile (default 3 giorni prima)
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  amount numeric(12,2) not null check (amount > 0),
  frequency text not null check (frequency in ('monthly', 'yearly')),
  next_renewal_date date not null,
  reminder_days_before integer not null default 3,
  created_at timestamptz default now()
);

alter table subscriptions enable row level security;

create index subscriptions_user_renewal_idx on subscriptions (user_id, next_renewal_date);

create policy "owner_all" on subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.subscriptions to authenticated;
grant select, insert, update, delete on public.subscriptions to service_role;
