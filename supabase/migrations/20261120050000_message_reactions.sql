create table public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text check (emoji in ('👍', '❤️', '😊', '🎉')),
  primary key (message_id, user_id)
);

alter table public.message_reactions enable row level security;
revoke all on public.message_reactions from anon, authenticated;
grant select on public.message_reactions to authenticated;

create policy "thread participants read reactions" on public.message_reactions
for select to authenticated
using (exists (select 1 from public.messages m where m.id = message_id));

-- A null emoji clears the reaction and produces a filterable Realtime update.
create function public.set_message_reaction(p_message_id uuid, p_emoji text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or not exists (
    select 1 from public.messages m
    join public.trades t on t.id = m.trade_id
    where m.id = p_message_id and m.sender_id is not null
      and actor in (t.client_id, m.helper_id)
  ) then
    raise exception 'Message unavailable';
  end if;

  insert into public.message_reactions (message_id, user_id, emoji)
  values (p_message_id, actor, p_emoji)
  on conflict (message_id, user_id) do update set emoji = excluded.emoji;
end;
$$;

revoke all on function public.set_message_reaction(uuid, text) from public;
grant execute on function public.set_message_reaction(uuid, text) to authenticated;

alter publication supabase_realtime add table public.message_reactions;
