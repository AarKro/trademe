-- Only the author can change the stars/comment or remove the rating.
create function public.edit_own_rating(p_rating_id uuid, p_stars integer, p_comment text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_stars is null or p_stars not between 1 and 5 or length(p_comment) > 1000 then
    raise exception 'Invalid rating';
  end if;
  update public.ratings
  set stars = p_stars, comment = nullif(btrim(p_comment), '')
  where id = p_rating_id and author_id = auth.uid();
  if not found then raise exception 'Rating unavailable'; end if;
end;
$$;

create function public.delete_own_rating(p_rating_id uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.ratings where id = p_rating_id and author_id = auth.uid();
$$;

revoke all on function public.edit_own_rating(uuid, integer, text) from public;
revoke all on function public.delete_own_rating(uuid) from public;
grant execute on function public.edit_own_rating(uuid, integer, text) to authenticated;
grant execute on function public.delete_own_rating(uuid) to authenticated;
