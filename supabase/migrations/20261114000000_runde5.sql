-- TradeMe – Runde 5 (usability tests), see TASKS_RUNDE5.md section 2 (A-1).
--
--   1. Private address per trade (trade_addresses), visible to the helper only after payment
--   2. Wanted date / time span (trades.wanted_from, trades.wanted_until)
--   3. Filter fields (trades.tags, trades.payment_methods)
--   4. Status and parties of a trade can only change through the trade functions
--   5. delete_trade() and decline_offer()
--   6. Notifications: one trigger per event, link to the right screen, realtime
--   7. Coarse home location on the profile (map)

-- ---------------------------------------------------------------------------
-- 1. Private address (B-2 writes it, C-3 shows it)
--    trades.location stays the rough area for map and list.
-- ---------------------------------------------------------------------------
create table trade_addresses (
  trade_id  uuid primary key references trades on delete cascade,
  street    text not null,
  zip       text not null,
  city      text not null
);

alter table trade_addresses enable row level security;

-- the client always reads and writes the address of their own trade
create policy "client manages address" on trade_addresses for all
  using (exists (select 1 from trades t where t.id = trade_addresses.trade_id and t.client_id = auth.uid()))
  with check (exists (select 1 from trades t where t.id = trade_addresses.trade_id and t.client_id = auth.uid()));

-- the helper sees it once the money is held (TWINT/Karte) or cash was chosen,
-- and no longer after a cancellation
create policy "helper reads address after payment" on trade_addresses for select
  using (exists (select 1 from trades t join payments p on p.trade_id = t.id
                 where t.id = trade_addresses.trade_id
                   and t.helper_id = auth.uid()
                   and t.status <> 'storniert'
                   and (p.status in ('hinterlegt', 'freigegeben') or p.method = 'bar')));

-- ---------------------------------------------------------------------------
-- 2. Wanted date: from a point in time (wanted_until null) or a span from–until.
--    scheduled_at stays the appointment agreed through the offer.
--    The default keeps the current create form working until B-2 sends the field.
-- ---------------------------------------------------------------------------
alter table trades
  add column wanted_from  timestamptz,
  add column wanted_until timestamptz;

update trades set wanted_from = created_at where wanted_from is null;

alter table trades
  alter column wanted_from set default now(),
  alter column wanted_from set not null,
  add constraint trades_wanted_span check (wanted_until is null or wanted_until >= wanted_from);

-- ---------------------------------------------------------------------------
-- 3. Filters (C-4): free tags and the payment methods the client accepts
-- ---------------------------------------------------------------------------
alter table trades
  add column tags            text[]           not null default '{}',
  add column payment_methods payment_method[] not null default '{twint,karte,bar}',
  add constraint trades_payment_methods_not_empty check (cardinality(payment_methods) > 0);

create index trades_tags_idx on trades using gin (tags);

-- ---------------------------------------------------------------------------
-- 4. Editing an open trade (policy «client edits open trade») may change the content,
--    but never status, parties or the dates the flow sets. The trade functions run as
--    the database owner, so they are not affected by this check.
-- ---------------------------------------------------------------------------
create function protect_trade_columns() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated')
     and (new.status, new.client_id, new.helper_id, new.completed_reported_at, new.released_at, new.created_at)
         is distinct from
         (old.status, old.client_id, old.helper_id, old.completed_reported_at, old.released_at, old.created_at)
  then
    raise exception 'Status und Beteiligte ändern sich nur über die Trade-Funktionen';
  end if;
  return new;
end $$;

create trigger trades_protect_columns before update on trades
  for each row execute function protect_trade_columns();

-- ---------------------------------------------------------------------------
-- 6a. notify() gets a link to the screen the notification opens
--     (the old 4-argument version is replaced; existing calls keep working)
-- ---------------------------------------------------------------------------
alter table notifications add column link text;   -- e.g. '/trades/<id>', '/chat/<trade>/<helper>'

update notifications n
   set link = case when n.user_id = t.client_id then '/trades/' else '/auftraege/' end || t.id
  from trades t
 where t.id = n.trade_id and n.link is null;

create index notifications_user_idx on notifications (user_id, created_at desc);

drop function notify(uuid, uuid, text, text);
create function notify(p_user uuid, p_trade uuid, p_kind text, p_body text, p_link text default null)
returns void
language sql security definer set search_path = public as $$
  insert into notifications (user_id, trade_id, kind, body, link)
  select p_user, p_trade, p_kind, p_body, p_link
  where p_user is not null;
$$;

-- ---------------------------------------------------------------------------
-- 5a. Delete an open trade (B-3). Only the client, only while «offen».
--     The trade and its offers are removed for real. Helpers with an open offer get a
--     notification without trade link (it would be deleted together with the trade).
--     After «vergeben» there is only cancel_trade().
-- ---------------------------------------------------------------------------
create function delete_trade(p_trade_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  t trades;
  o offers;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select * into t from trades where id = p_trade_id for update;
  if not found then raise exception 'Trade nicht gefunden'; end if;
  if t.client_id is distinct from auth.uid() then raise exception 'Nur Auftraggebende können löschen'; end if;
  if t.status is distinct from 'offen' then
    raise exception 'Nur offene Trades können gelöscht werden. Danach geht nur noch Stornieren.';
  end if;

  for o in select * from offers where trade_id = t.id and status = 'offen' loop
    perform notify(o.helper_id, null, 'trade_geloescht',
                   '«' || t.title || '» wurde gelöscht. Dein Angebot ist damit hinfällig.');
  end loop;

  delete from trades where id = t.id;   -- offers, messages and address go with it
end $$;

-- ---------------------------------------------------------------------------
-- 5b. Decline a single offer (B-5). The helper is notified by the offer trigger below.
-- ---------------------------------------------------------------------------
create function decline_offer(p_offer_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  o offers;
  t trades;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select * into o from offers where id = p_offer_id for update;
  if not found then raise exception 'Angebot nicht gefunden'; end if;
  select * into t from trades where id = o.trade_id;
  if t.client_id is distinct from auth.uid() then raise exception 'Nur Auftraggebende können ablehnen'; end if;
  if o.status is distinct from 'offen' then raise exception 'Angebot ist nicht mehr offen'; end if;
  if t.status is distinct from 'offen' then raise exception 'Trade ist nicht mehr offen'; end if;

  update offers set status = 'abgelehnt' where id = o.id;
end $$;

-- ---------------------------------------------------------------------------
-- 6b. Notification triggers. All status notifications now come from one place
--     (on_trade_status_changed), so the trade functions below no longer call notify().
--     auth.uid() is the person who caused the change; they are not notified about it.
-- ---------------------------------------------------------------------------

-- New offer → client (unchanged, now with link and the helper's name)
create or replace function on_offer_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  t trades;
  helper_name text;
begin
  select * into t from trades where id = new.trade_id;
  select nullif(display_name, '') into helper_name from profiles where id = new.helper_id;
  perform notify(t.client_id, t.id, 'neues_angebot',
                 'Neues Angebot für «' || t.title || '»: CHF ' || new.price_chf
                 || coalesce(' von ' || helper_name, ''),
                 '/trades/' || t.id);
  return new;
end $$;

-- Offer declined → helper (decline_offer, accept_offer for the other offers, cancel_trade)
create function on_offer_declined() returns trigger
language plpgsql security definer set search_path = public as $$
declare t trades;
begin
  select * into t from trades where id = new.trade_id;
  perform notify(new.helper_id, t.id, 'angebot_abgelehnt',
    case
      when t.status = 'storniert' then
        '«' || t.title || '» wurde storniert. Dein Angebot ist damit hinfällig.'
      when exists (select 1 from offers where trade_id = t.id and status = 'angenommen') then
        '«' || t.title || '» wurde an jemand anderen vergeben. Danke für dein Angebot!'
      else
        'Dein Angebot für «' || t.title || '» wurde abgelehnt.'
    end,
    '/auftraege/' || t.id);
  return new;
end $$;

create trigger offer_declined after update of status on offers
  for each row when (new.status = 'abgelehnt' and old.status is distinct from 'abgelehnt')
  execute function on_offer_declined();

-- Trade status changed → the other party
create function on_trade_status_changed() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  actor       uuid := auth.uid();   -- null for the hourly auto-release
  client_link text := '/trades/' || new.id;
  helper_link text := '/auftraege/' || new.id;
  rate_link   text := '/trades/' || new.id || '/bewerten';
begin
  case new.status
    when 'vergeben' then
      perform notify(new.helper_id, new.id, 'angebot_angenommen',
                     'Dein Angebot für «' || new.title || '» wurde angenommen', helper_link);

    when 'zur_bestaetigung' then
      perform notify(new.client_id, new.id, 'erledigt_gemeldet',
                     'Abschluss prüfen: «' || new.title || '» ist erledigt', client_link);

    when 'abgeschlossen' then
      perform notify(new.helper_id, new.id, 'freigegeben',
                     '«' || new.title || '» wurde freigegeben. Bewerte jetzt, wie es gelaufen ist.', rate_link);
      perform notify(new.client_id, new.id, 'bewerten',
                     case when actor is null
                       then '«' || new.title || '» wurde nach 10 Tagen automatisch freigegeben. Bewerte jetzt, wie es gelaufen ist.'
                       else 'Bewerte jetzt, wie «' || new.title || '» gelaufen ist.'
                     end, rate_link);

    when 'problem' then
      if new.client_id is distinct from actor then
        perform notify(new.client_id, new.id, 'problem_gemeldet',
                       'Zu «' || new.title || '» wurde ein Problem gemeldet. Die Auszahlung ist pausiert.', client_link);
      end if;
      if new.helper_id is distinct from actor then
        perform notify(new.helper_id, new.id, 'problem_gemeldet',
                       'Zu «' || new.title || '» wurde ein Problem gemeldet. Die Auszahlung ist pausiert.', helper_link);
      end if;

    when 'storniert' then
      if new.helper_id is distinct from actor then
        perform notify(new.helper_id, new.id, 'storniert', '«' || new.title || '» wurde storniert', helper_link);
      end if;

    else null;
  end case;
  return new;
end $$;

create trigger trade_status_changed after update of status on trades
  for each row when (new.status is distinct from old.status)
  execute function on_trade_status_changed();

-- New chat message → the other side of the thread.
-- Several unread messages in the same chat update one notification instead of piling up.
create function on_message_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  recipient   uuid;
  sender_name text;
  chat_link   text := '/chat/' || new.trade_id || '/' || new.helper_id;
  preview     text;
begin
  if new.sender_id is null then return new; end if;   -- system message («Vereinbarung»)

  recipient := case when new.sender_id = new.helper_id
                    then (select client_id from trades where id = new.trade_id)
                    else new.helper_id end;
  select coalesce(nullif(display_name, ''), 'Jemand') into sender_name from profiles where id = new.sender_id;
  preview := 'Neue Nachricht von ' || sender_name || ': ' || left(new.body, 80)
             || case when length(new.body) > 80 then '…' else '' end;

  update notifications set body = preview, created_at = now()
   where user_id = recipient and kind = 'nachricht' and link = chat_link and read_at is null;
  if not found then
    perform notify(recipient, new.trade_id, 'nachricht', preview, chat_link);
  end if;
  return new;
end $$;

create trigger message_created after insert on messages
  for each row execute function on_message_created();

-- New rating → the rated person. Ratings are blind until both have rated (#13).
create function on_rating_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  t           trades;
  author_name text;
begin
  select * into t from trades where id = new.trade_id;
  select coalesce(nullif(display_name, ''), 'Jemand') into author_name from profiles where id = new.author_id;

  if exists (select 1 from ratings where trade_id = new.trade_id and author_id = new.subject_id) then
    perform notify(new.subject_id, t.id, 'neue_bewertung',
                   author_name || ' hat dich für «' || t.title || '» bewertet. Eure Bewertungen sind jetzt sichtbar.',
                   '/profil/bewertungen');
  else
    perform notify(new.subject_id, t.id, 'neue_bewertung',
                   author_name || ' hat dich für «' || t.title || '» bewertet. Bewerte zurück, dann seht ihr beide eure Bewertung.',
                   '/trades/' || t.id || '/bewerten');
  end if;
  return new;
end $$;

create trigger rating_created after insert on ratings
  for each row execute function on_rating_created();

-- ---------------------------------------------------------------------------
-- 6c. Trade functions without their own notify() (the status trigger does it now).
--     Logic is unchanged from 20261113000200_fix_rpc_guards.sql.
-- ---------------------------------------------------------------------------
create or replace function accept_offer(p_offer_id uuid, p_method payment_method) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  o offers;
  t trades;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;

  select * into o from offers where id = p_offer_id and status = 'offen';
  if not found then raise exception 'Angebot nicht gefunden oder nicht mehr offen'; end if;

  select * into t from trades where id = o.trade_id for update;
  if not found then raise exception 'Trade nicht gefunden'; end if;
  if t.client_id is distinct from auth.uid() then raise exception 'Nur Auftraggebende können annehmen'; end if;
  if t.status is distinct from 'offen' then raise exception 'Trade ist nicht mehr offen'; end if;

  update offers set status = case when id = o.id then 'angenommen' else 'abgelehnt' end::offer_status
    where trade_id = t.id and status = 'offen';

  update trades set helper_id = o.helper_id, scheduled_at = o.proposed_at, status = 'vergeben'
    where id = t.id;

  insert into payments (trade_id, method, amount_chf) values (t.id, p_method, o.price_chf);

  insert into messages (trade_id, helper_id, sender_id, body)
    values (t.id, o.helper_id, null, 'Vereinbarung: CHF ' || o.price_chf
            || coalesce(' · ' || to_char(o.proposed_at at time zone 'Europe/Zurich', 'DD.MM. HH24:MI'), ''));

  return t.id;
end $$;

create or replace function report_done(p_trade_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare t trades;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select * into t from trades where id = p_trade_id for update;
  if not found then raise exception 'Trade nicht gefunden'; end if;
  if t.helper_id is distinct from auth.uid() then raise exception 'Nur die helfende Person kann abschliessen'; end if;
  if t.status is distinct from 'vergeben' then raise exception 'Trade ist nicht im Status «vergeben»'; end if;

  update trades set status = 'zur_bestaetigung', completed_reported_at = now() where id = t.id;
end $$;

create or replace function _release(t trades) returns void
language plpgsql security definer set search_path = public as $$
begin
  update trades set status = 'abgeschlossen', released_at = now() where id = t.id;
  update payments set status = 'freigegeben' where trade_id = t.id and method <> 'bar';
end $$;

create or replace function report_problem(p_trade_id uuid, p_reason text, p_details text default null) returns void
language plpgsql security definer set search_path = public as $$
declare t trades;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select * into t from trades where id = p_trade_id for update;
  if not found then raise exception 'Trade nicht gefunden'; end if;
  if auth.uid() is distinct from t.client_id and auth.uid() is distinct from t.helper_id then
    raise exception 'Kein Zugriff';
  end if;
  if t.status not in ('vergeben', 'zur_bestaetigung', 'abgeschlossen') then
    raise exception 'Für diesen Trade kann kein Problem gemeldet werden';
  end if;
  if t.completed_reported_at is not null and now() > t.completed_reported_at + interval '30 days' then
    raise exception 'Die Frist von 30 Tagen ist abgelaufen';
  end if;

  insert into reports (trade_id, reporter_id, reason, details) values (t.id, auth.uid(), p_reason, p_details);
  update trades set status = 'problem' where id = t.id;
end $$;

create or replace function cancel_trade(p_trade_id uuid) returns int
language plpgsql security definer set search_path = public as $$
declare
  t trades;
  fee int := 0;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select * into t from trades where id = p_trade_id for update;
  if not found then raise exception 'Trade nicht gefunden'; end if;
  if t.client_id is distinct from auth.uid() then raise exception 'Nur Auftraggebende können stornieren'; end if;
  if t.status not in ('offen', 'vergeben') then raise exception 'Trade kann nicht mehr storniert werden'; end if;

  if t.status = 'vergeben' and t.scheduled_at is not null and t.scheduled_at - now() < interval '48 hours' then
    fee := 20;
  end if;

  update trades set status = 'storniert' where id = t.id;
  update offers set status = 'abgelehnt' where trade_id = t.id and status = 'offen';
  update payments set status = 'erstattet' where trade_id = t.id and status = 'hinterlegt';
  return fee;
end $$;

-- Day-7 reminder (unchanged, now with link)
create or replace function process_deadlines() returns void
language plpgsql security definer set search_path = public as $$
declare t trades;
begin
  for t in
    select * from trades
    where status = 'zur_bestaetigung'
      and completed_reported_at < now() - interval '7 days'
      and not exists (select 1 from notifications n where n.trade_id = trades.id and n.kind = 'erinnerung_tag7')
  loop
    perform notify(t.client_id, t.id, 'erinnerung_tag7',
                   'Noch 3 Tage: Bitte bestätige den Abschluss von «' || t.title || '»', '/trades/' || t.id);
  end loop;

  for t in
    select * from trades
    where status = 'zur_bestaetigung' and completed_reported_at < now() - interval '10 days'
  loop
    perform _release(t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 6d. Realtime: notifications were already added in the init migration; only add if missing
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 7. Home location for the map (C-5). Profiles are public, so it is stored coarsely:
--    rounded to 2 decimals (about 1 km).
-- ---------------------------------------------------------------------------
alter table profiles
  add column home_lat   double precision,
  add column home_lng   double precision,
  add column home_label text;              -- e.g. "Zürich, Kreis 4"

create function coarsen_home_location() returns trigger
language plpgsql set search_path = public as $$
begin
  new.home_lat := round(new.home_lat::numeric, 2)::double precision;
  new.home_lng := round(new.home_lng::numeric, 2)::double precision;
  return new;
end $$;

create trigger profiles_coarse_home before insert or update of home_lat, home_lng on profiles
  for each row execute function coarsen_home_location();

-- ---------------------------------------------------------------------------
-- Permissions: new functions only for signed-in users, internal ones not at all
-- ---------------------------------------------------------------------------
revoke execute on function delete_trade(uuid) from public, anon;
revoke execute on function decline_offer(uuid) from public, anon;
grant execute on function delete_trade(uuid), decline_offer(uuid) to authenticated;

revoke execute on function notify(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke execute on function protect_trade_columns()   from public, anon, authenticated;
revoke execute on function on_offer_declined()       from public, anon, authenticated;
revoke execute on function on_trade_status_changed() from public, anon, authenticated;
revoke execute on function on_message_created()      from public, anon, authenticated;
revoke execute on function on_rating_created()       from public, anon, authenticated;
revoke execute on function coarsen_home_location()   from public, anon, authenticated;
