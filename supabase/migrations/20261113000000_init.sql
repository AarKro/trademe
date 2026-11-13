-- TradeMe – initial schema
-- Business rules (from Figma «Screens V4» / DEC-003/004):
--   * Trade flow: Angebot → Zahlung → Ausführung → Freigabe → Bewertung
--   * Payment methods: TWINT, Karte (digital, held until release) or bar (no payment protection)
--   * Free cancellation until 48 h before the appointment, afterwards 20 %
--   * Helper reports "erledigt" → client confirms within 10 days, reminder on day 7,
--     auto-release on day 10 unless a problem was reported
--   * Problems can be reported until day 30 after the completion report; payout stays paused
--   * Platform fee 4 %, charged to the helper (CHF 120 → payout CHF 115.20)

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type trade_status as enum (
  'offen',             -- waiting for / receiving offers
  'vergeben',          -- offer accepted, appointment set
  'zur_bestaetigung',  -- helper reported "erledigt", client must confirm
  'abgeschlossen',     -- released
  'problem',           -- problem reported, payout paused
  'storniert'
);

create type offer_status as enum ('offen', 'angenommen', 'abgelehnt', 'zurueckgezogen');
create type payment_method as enum ('twint', 'karte', 'bar');
create type payment_status as enum ('offen', 'hinterlegt', 'fehlgeschlagen', 'freigegeben', 'erstattet');

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text not null default '',
  avatar_url    text,
  location      text,                       -- e.g. "Zürich, Kreis 4"
  bio           text,
  skills        text[] not null default '{}',
  accepted_payment_methods payment_method[] not null default '{twint,karte,bar}',
  is_verified   boolean not null default false,  -- «Geprüft» (ID scan, set manually for the demo)
  created_at    timestamptz not null default now()
);

-- Create a profile row automatically on sign-up
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Trades
-- ---------------------------------------------------------------------------
create table trades (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references profiles on delete cascade,
  helper_id      uuid references profiles,            -- set when an offer is accepted
  title          text not null,
  description    text,
  category       text,                                -- e.g. "Möbelaufbau"
  budget_chf     numeric(10,2) not null check (budget_chf > 0),
  is_remote      boolean not null default false,      -- «Überall»
  location       text,
  lat            double precision,
  lng            double precision,
  photo_urls     text[] not null default '{}',
  scheduled_at   timestamptz,                         -- agreed appointment
  status         trade_status not null default 'offen',
  completed_reported_at timestamptz,                  -- helper reported "erledigt" (day 0)
  released_at    timestamptz,
  created_at     timestamptz not null default now()
);

create index trades_status_idx on trades (status);
create index trades_client_idx on trades (client_id);
create index trades_helper_idx on trades (helper_id);

-- ---------------------------------------------------------------------------
-- Offers
-- ---------------------------------------------------------------------------
create table offers (
  id            uuid primary key default gen_random_uuid(),
  trade_id      uuid not null references trades on delete cascade,
  helper_id     uuid not null references profiles on delete cascade,
  price_chf     numeric(10,2) not null check (price_chf > 0),
  proposed_at   timestamptz,                          -- proposed appointment (C/03c)
  message       text,
  status        offer_status not null default 'offen',
  created_at    timestamptz not null default now(),
  unique (trade_id, helper_id)
);

-- ---------------------------------------------------------------------------
-- Payments (Stripe test mode for twint/karte, bookkeeping only for bar)
-- ---------------------------------------------------------------------------
create table payments (
  id                 uuid primary key default gen_random_uuid(),
  trade_id           uuid not null unique references trades on delete cascade,
  method             payment_method not null,
  amount_chf         numeric(10,2) not null,
  fee_chf            numeric(10,2) generated always as (round(amount_chf * 0.04, 2)) stored,
  payout_chf         numeric(10,2) generated always as (amount_chf - round(amount_chf * 0.04, 2)) stored,
  status             payment_status not null default 'offen',
  stripe_payment_intent_id text,
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Chat messages (one thread per trade + helper)
-- ---------------------------------------------------------------------------
create table messages (
  id          uuid primary key default gen_random_uuid(),
  trade_id    uuid not null references trades on delete cascade,
  helper_id   uuid not null references profiles,     -- identifies the thread within a trade
  sender_id   uuid references profiles,              -- null = system message («Vereinbarung»)
  body        text not null,
  created_at  timestamptz not null default now()
);

create index messages_thread_idx on messages (trade_id, helper_id, created_at);

-- ---------------------------------------------------------------------------
-- Ratings (both directions, one per trade and author)
-- ---------------------------------------------------------------------------
create table ratings (
  id          uuid primary key default gen_random_uuid(),
  trade_id    uuid not null references trades on delete cascade,
  author_id   uuid not null references profiles,
  subject_id  uuid not null references profiles,
  stars       int not null check (stars between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (trade_id, author_id)
);

create view profile_stats with (security_invoker = true) as
select
  p.id,
  coalesce(round(avg(r.stars)::numeric, 1), 0) as rating_avg,
  count(r.id)                                    as rating_count,
  (select count(*) from trades t where t.helper_id = p.id and t.status = 'abgeschlossen') as trades_done
from profiles p
left join ratings r on r.subject_id = p.id
group by p.id;

-- ---------------------------------------------------------------------------
-- Problem reports (B/15)
-- ---------------------------------------------------------------------------
create table reports (
  id          uuid primary key default gen_random_uuid(),
  trade_id    uuid not null references trades on delete cascade,
  reporter_id uuid not null references profiles,
  reason      text not null,
  details     text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- In-app notifications (instead of push; reminders, offers, …)
-- ---------------------------------------------------------------------------
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles on delete cascade,
  trade_id    uuid references trades on delete cascade,
  kind        text not null,       -- 'neues_angebot' | 'erinnerung_tag7' | 'freigegeben' | …
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function is_trade_party(t trades) returns boolean
language sql stable as $$
  select auth.uid() = t.client_id or auth.uid() = t.helper_id
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table profiles      enable row level security;
alter table trades        enable row level security;
alter table offers        enable row level security;
alter table payments      enable row level security;
alter table messages      enable row level security;
alter table ratings       enable row level security;
alter table reports       enable row level security;
alter table notifications enable row level security;

-- profiles: public read, own write
create policy "profiles readable" on profiles for select using (true);
create policy "own profile update" on profiles for update using (auth.uid() = id);

-- trades: open trades are public, others only for the parties
create policy "trades readable" on trades for select
  using (status = 'offen' or auth.uid() in (client_id, helper_id));
create policy "client creates trade" on trades for insert
  with check (auth.uid() = client_id);
-- status changes go through the functions in the next migration
create policy "client edits open trade" on trades for update
  using (auth.uid() = client_id and status = 'offen')
  with check (status = 'offen' and helper_id is null);

-- offers: visible to the trade's client and the offering helper
create policy "offers readable" on offers for select
  using (auth.uid() = helper_id
         or auth.uid() = (select client_id from trades where trades.id = trade_id));
create policy "helper creates offer" on offers for insert
  with check (auth.uid() = helper_id
              and auth.uid() <> (select client_id from trades where trades.id = trade_id));
-- helpers can edit/withdraw their own open offer; accepting goes through accept_offer()
create policy "helper edits own offer" on offers for update
  using (auth.uid() = helper_id and status = 'offen')
  with check (status in ('offen', 'zurueckgezogen'));

-- payments: read by parties; written by the server (service role) only
create policy "payments readable" on payments for select
  using (exists (select 1 from trades t where t.id = trade_id and is_trade_party(t)));

-- messages: the client of the trade and the helper of the thread
create policy "messages readable" on messages for select
  using (auth.uid() = helper_id
         or auth.uid() = (select client_id from trades where trades.id = trade_id));
create policy "messages insert" on messages for insert
  with check (sender_id = auth.uid()
              and (auth.uid() = helper_id
                   or auth.uid() = (select client_id from trades where trades.id = trade_id)));

-- ratings: public read, parties of a finished trade can rate each other
create policy "ratings readable" on ratings for select using (true);
create policy "ratings insert" on ratings for insert
  with check (author_id = auth.uid()
              and exists (select 1 from trades t
                          where t.id = trade_id and t.status = 'abgeschlossen'
                            and is_trade_party(t)
                            and subject_id in (t.client_id, t.helper_id)
                            and subject_id <> auth.uid()));

-- reports: parties can report and see their own reports
create policy "reports readable" on reports for select using (reporter_id = auth.uid());
create policy "reports insert" on reports for insert
  with check (reporter_id = auth.uid()
              and exists (select 1 from trades t where t.id = trade_id and is_trade_party(t)));

-- notifications: own only
create policy "own notifications" on notifications for select using (user_id = auth.uid());
create policy "mark notification read" on notifications for update using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime (live chat + live trade/offer updates)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table messages, offers, trades, notifications;

-- ---------------------------------------------------------------------------
-- Storage: photos for trades and avatars
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos public read" on storage.objects for select
  using (bucket_id = 'photos');
-- upload into a folder named after your user id: photos/<uid>/<file>
create policy "photos own upload" on storage.objects for insert
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos own delete" on storage.objects for delete
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
