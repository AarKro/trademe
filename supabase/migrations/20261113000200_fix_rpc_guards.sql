-- Fix: the trade-flow functions compared with `<>` against auth.uid(). For anonymous
-- callers auth.uid() is null, `x <> null` is null, and the permission check never fired.
-- Now: every function requires a signed-in user, uses `is distinct from`, and fails
-- when the trade/offer doesn't exist. Anonymous callers can't execute them at all.

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

  perform notify(o.helper_id, t.id, 'angebot_angenommen', 'Dein Angebot für «' || t.title || '» wurde angenommen');
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
  perform notify(t.client_id, t.id, 'erledigt_gemeldet', 'Abschluss prüfen: «' || t.title || '» ist erledigt');
end $$;

create or replace function release_trade(p_trade_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare t trades;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select * into t from trades where id = p_trade_id for update;
  if not found then raise exception 'Trade nicht gefunden'; end if;
  if t.client_id is distinct from auth.uid() then raise exception 'Nur Auftraggebende können freigeben'; end if;
  if t.status is distinct from 'zur_bestaetigung' then raise exception 'Trade wartet nicht auf Freigabe'; end if;
  perform _release(t);
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
  perform notify(case when auth.uid() = t.client_id then t.helper_id else t.client_id end, t.id,
                 'problem_gemeldet', 'Zu «' || t.title || '» wurde ein Problem gemeldet. Die Auszahlung ist pausiert.');
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
  if t.helper_id is not null then
    perform notify(t.helper_id, t.id, 'storniert', '«' || t.title || '» wurde storniert');
  end if;
  return fee;
end $$;

-- Only signed-in users may call the trade-flow functions
revoke execute on function accept_offer(uuid, payment_method) from public, anon;
revoke execute on function report_done(uuid) from public, anon;
revoke execute on function release_trade(uuid) from public, anon;
revoke execute on function report_problem(uuid, text, text) from public, anon;
revoke execute on function cancel_trade(uuid) from public, anon;
grant execute on function accept_offer(uuid, payment_method), report_done(uuid), release_trade(uuid),
  report_problem(uuid, text, text), cancel_trade(uuid) to authenticated;

-- Internal helpers must not be callable from the API (Supabase grants anon/authenticated by default)
revoke execute on function notify(uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function _release(trades) from public, anon, authenticated;
revoke execute on function process_deadlines() from public, anon, authenticated;
revoke execute on function handle_new_user() from public, anon, authenticated;
revoke execute on function on_offer_created() from public, anon, authenticated;
