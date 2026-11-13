-- TradeMe – trade state transitions + deadlines
-- Status changes only happen through these functions, so nobody can skip a step.
-- Call them from the app with supabase.rpc('accept_offer', { p_offer_id, p_method }).

-- ---------------------------------------------------------------------------
-- Internal helper: add an in-app notification
-- ---------------------------------------------------------------------------
create function notify(p_user uuid, p_trade uuid, p_kind text, p_body text) returns void
language sql security definer set search_path = public as $$
  insert into notifications (user_id, trade_id, kind, body) values (p_user, p_trade, p_kind, p_body);
$$;
revoke execute on function notify from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Notify the client when an offer comes in
-- ---------------------------------------------------------------------------
create function on_offer_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform notify((select client_id from trades where id = new.trade_id), new.trade_id,
                 'neues_angebot', 'Neues Angebot: CHF ' || new.price_chf);
  return new;
end $$;

create trigger offer_created after insert on offers
  for each row execute function on_offer_created();

-- ---------------------------------------------------------------------------
-- B/05 · Client accepts an offer and picks a payment method
-- ---------------------------------------------------------------------------
create function accept_offer(p_offer_id uuid, p_method payment_method) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  o offers;
  t trades;
begin
  select * into o from offers where id = p_offer_id and status = 'offen';
  if not found then raise exception 'Angebot nicht gefunden oder nicht mehr offen'; end if;

  select * into t from trades where id = o.trade_id for update;
  if t.client_id <> auth.uid() then raise exception 'Nur Auftraggebende können annehmen'; end if;
  if t.status <> 'offen' then raise exception 'Trade ist nicht mehr offen'; end if;

  update offers set status = case when id = o.id then 'angenommen' else 'abgelehnt' end::offer_status
    where trade_id = t.id and status = 'offen';

  update trades set helper_id = o.helper_id, scheduled_at = o.proposed_at, status = 'vergeben'
    where id = t.id;

  -- digital payments are set to 'hinterlegt' by the server once Stripe confirms
  insert into payments (trade_id, method, amount_chf) values (t.id, p_method, o.price_chf);

  insert into messages (trade_id, helper_id, sender_id, body)
    values (t.id, o.helper_id, null, 'Vereinbarung: CHF ' || o.price_chf
            || coalesce(' · ' || to_char(o.proposed_at at time zone 'Europe/Zurich', 'DD.MM. HH24:MI'), ''));

  perform notify(o.helper_id, t.id, 'angebot_angenommen', 'Dein Angebot für «' || t.title || '» wurde angenommen');
  return t.id;
end $$;

-- ---------------------------------------------------------------------------
-- C/06 · Helper reports "erledigt" (day 0 of the 10-day confirmation window)
-- ---------------------------------------------------------------------------
create function report_done(p_trade_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare t trades;
begin
  select * into t from trades where id = p_trade_id for update;
  if t.helper_id is distinct from auth.uid() then raise exception 'Nur die helfende Person kann abschliessen'; end if;
  if t.status <> 'vergeben' then raise exception 'Trade ist nicht im Status «vergeben»'; end if;

  update trades set status = 'zur_bestaetigung', completed_reported_at = now() where id = t.id;
  perform notify(t.client_id, t.id, 'erledigt_gemeldet', 'Abschluss prüfen: «' || t.title || '» ist erledigt');
end $$;

-- ---------------------------------------------------------------------------
-- B/08 · Client releases the payment
-- ---------------------------------------------------------------------------
create function release_trade(p_trade_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare t trades;
begin
  select * into t from trades where id = p_trade_id for update;
  if t.client_id <> auth.uid() then raise exception 'Nur Auftraggebende können freigeben'; end if;
  if t.status <> 'zur_bestaetigung' then raise exception 'Trade wartet nicht auf Freigabe'; end if;
  perform _release(t);
end $$;

create function _release(t trades) returns void
language plpgsql security definer set search_path = public as $$
begin
  update trades set status = 'abgeschlossen', released_at = now() where id = t.id;
  update payments set status = 'freigegeben' where trade_id = t.id and method <> 'bar';
  perform notify(t.helper_id, t.id, 'freigegeben', '«' || t.title || '» wurde freigegeben');
end $$;
revoke execute on function _release from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- B/15 · Report a problem (until day 30 after the completion report)
-- ---------------------------------------------------------------------------
create function report_problem(p_trade_id uuid, p_reason text, p_details text default null) returns void
language plpgsql security definer set search_path = public as $$
declare t trades;
begin
  select * into t from trades where id = p_trade_id for update;
  if auth.uid() not in (t.client_id, t.helper_id) then raise exception 'Kein Zugriff'; end if;
  if t.status not in ('vergeben', 'zur_bestaetigung', 'abgeschlossen') then
    raise exception 'Für diesen Trade kann kein Problem gemeldet werden';
  end if;
  if t.completed_reported_at is not null and now() > t.completed_reported_at + interval '30 days' then
    raise exception 'Die Frist von 30 Tagen ist abgelaufen';
  end if;

  insert into reports (trade_id, reporter_id, reason, details) values (t.id, auth.uid(), p_reason, p_details);
  update trades set status = 'problem' where id = t.id;
  perform notify(case when auth.uid() = t.client_id then t.helper_id else t.client_id end, t.id,
                 'problem_gemeldet', 'Zu «' || t.title || '» wurde ein Problem gemeldet. Die Auszahlung ist pausiert.');
end $$;

-- ---------------------------------------------------------------------------
-- Cancel: free until 48 h before the appointment, afterwards 20 %.
-- Returns the cancellation fee in percent (0 or 20).
-- ---------------------------------------------------------------------------
create function cancel_trade(p_trade_id uuid) returns int
language plpgsql security definer set search_path = public as $$
declare
  t trades;
  fee int := 0;
begin
  select * into t from trades where id = p_trade_id for update;
  if t.client_id <> auth.uid() then raise exception 'Nur Auftraggebende können stornieren'; end if;
  if t.status not in ('offen', 'vergeben') then raise exception 'Trade kann nicht mehr storniert werden'; end if;

  if t.status = 'vergeben' and t.scheduled_at is not null and t.scheduled_at - now() < interval '48 hours' then
    fee := 20;
  end if;

  update trades set status = 'storniert' where id = t.id;
  update offers set status = 'abgelehnt' where trade_id = t.id and status = 'offen';
  update payments set status = 'erstattet' where trade_id = t.id and status = 'hinterlegt';
  if t.helper_id is not null then
    perform notify(t.helper_id, t.id, 'storniert', '«' || t.title || '» wurde storniert');
  end if;
  return fee;
end $$;

-- ---------------------------------------------------------------------------
-- Deadlines: reminder on day 7, automatic release on day 10.
-- Runs hourly via pg_cron.
-- ---------------------------------------------------------------------------
create function process_deadlines() returns void
language plpgsql security definer set search_path = public as $$
declare t trades;
begin
  -- B/14 reminder (once)
  for t in
    select * from trades
    where status = 'zur_bestaetigung'
      and completed_reported_at < now() - interval '7 days'
      and not exists (select 1 from notifications n where n.trade_id = trades.id and n.kind = 'erinnerung_tag7')
  loop
    perform notify(t.client_id, t.id, 'erinnerung_tag7',
                   'Noch 3 Tage: Bitte bestätige den Abschluss von «' || t.title || '»');
  end loop;

  -- auto release
  for t in
    select * from trades
    where status = 'zur_bestaetigung' and completed_reported_at < now() - interval '10 days'
  loop
    perform _release(t);
  end loop;
end $$;
revoke execute on function process_deadlines from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('trademe-deadlines', '0 * * * *', 'select public.process_deadlines()');
