-- Web Push: notifications also arrive on the phone (installed PWA), not only inside the app.
--
--   push_subscriptions       one row per device a user switched on (Benachrichtigungen → «Aktivieren»)
--   save/delete_push_…       called by the app (lib/push.ts)
--   notifications.pushed_at  which version of a notification was pushed already
--   trigger push_notification after a new notification (or a chat notification with a new message)
--                            calls the Vercel route /api/send-push, which sends the Web Push.
--                            pg_net makes the HTTP call asynchronously, so nothing waits for it.

create table push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles on delete cascade,
  endpoint    text not null unique,     -- push service URL of the device (Apple/Google/Mozilla)
  p256dh      text not null,            -- device keys for the encrypted message
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index push_subscriptions_user_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;
create policy "own push subscriptions readable" on push_subscriptions for select using (user_id = auth.uid());

-- A device belongs to whoever switched it on last (e.g. a shared phone after a new login).
create function save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_user_agent text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  if p_endpoint !~ '^https://' then raise exception 'Ungültiger Push-Endpunkt'; end if;
  insert into push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, p_user_agent)
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
        user_agent = excluded.user_agent, created_at = now();
end $$;

create function delete_push_subscription(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from push_subscriptions where endpoint = p_endpoint and user_id = auth.uid();
$$;

revoke execute on function save_push_subscription(text, text, text, text) from public, anon;
revoke execute on function delete_push_subscription(text) from public, anon;
grant execute on function save_push_subscription(text, text, text, text), delete_push_subscription(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Send a push for new notifications
-- ---------------------------------------------------------------------------
alter table notifications add column pushed_at timestamptz;

create extension if not exists pg_net with schema extensions;

create function push_notification() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  -- only users who switched push on somewhere
  if exists (select 1 from push_subscriptions where user_id = new.user_id) then
    perform net.http_post(
      url     := 'https://trademe-eosin.vercel.app/api/send-push',
      body    := jsonb_build_object('id', new.id),
      headers := jsonb_build_object('Content-Type', 'application/json')
    );
  end if;
  return new;
end $$;

revoke execute on function push_notification() from public, anon, authenticated;

-- insert = new notification · update of body = chat notification with the newest message
create trigger notification_push after insert or update of body on notifications
  for each row when (new.read_at is null)
  execute function push_notification();
