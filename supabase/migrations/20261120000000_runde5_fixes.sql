-- TradeMe – fixes from the end-to-end test A-6 (Runde 5)
--
--   1. Helpers who made an offer can still open the trade after it went to someone else.
--      Before, their «Angebot abgelehnt / an jemand anderen vergeben» notification led to
--      «Dieser Trade konnte nicht geladen werden», because only open trades and the two
--      parties were readable. The address stays private (trade_addresses checks helper_id).
--   2. Amounts in notifications and the «Vereinbarung» chat message read «CHF 65» / «CHF 62.50»
--      instead of «CHF 65.00».

-- ---------------------------------------------------------------------------
-- 1. Trades readable for everyone who made an offer.
--    A security definer lookup avoids a policy loop (the offers policy reads trades).
-- ---------------------------------------------------------------------------
create function has_offered(p_trade_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from offers where trade_id = p_trade_id and helper_id = auth.uid())
$$;

drop policy "trades readable" on trades;
create policy "trades readable" on trades for select
  using (status = 'offen' or auth.uid() in (client_id, helper_id) or has_offered(id));

-- ---------------------------------------------------------------------------
-- 2. «CHF 65» for whole francs, «CHF 62.50» otherwise
-- ---------------------------------------------------------------------------
create function chf(p numeric) returns text
language sql immutable as $$
  select 'CHF ' || case when p = trunc(p) then trunc(p)::text else to_char(p, 'FM999999990.00') end
$$;

create or replace function on_offer_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  t trades;
  helper_name text;
begin
  select * into t from trades where id = new.trade_id;
  select nullif(display_name, '') into helper_name from profiles where id = new.helper_id;
  perform notify(t.client_id, t.id, 'neues_angebot',
                 'Neues Angebot für «' || t.title || '»: ' || chf(new.price_chf)
                 || coalesce(' von ' || helper_name, ''),
                 '/trades/' || t.id);
  return new;
end $$;

-- unchanged from 20261114000000_runde5.sql except the amount in the system message
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
    values (t.id, o.helper_id, null, 'Vereinbarung: ' || chf(o.price_chf)
            || coalesce(' · ' || to_char(o.proposed_at at time zone 'Europe/Zurich', 'DD.MM. HH24:MI'), ''));

  return t.id;
end $$;

revoke execute on function has_offered(uuid) from public, anon;
grant execute on function has_offered(uuid) to authenticated;
