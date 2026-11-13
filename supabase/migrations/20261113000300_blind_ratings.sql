-- Ratings stay hidden until both parties have rated each other, or 14 days have passed
-- (Figma A/13: «Sie erscheint in Leas Profil, sobald Lea dich auch bewertet hat – spätestens
-- in 14 Tagen.» · A/14: «Sandras Bewertung siehst du nach dem Senden.»).
-- Like Airbnb: nobody can see the other rating before writing their own, so nobody rates in revenge.
--
-- Your own rating is always visible to you. profile_stats (security_invoker) automatically
-- only counts visible ratings, so averages also stay blind.

-- Checking the counter-rating inside the ratings policy itself would recurse,
-- so a security definer function looks it up without RLS.
create function rating_is_public(p_trade_id uuid, p_subject_id uuid, p_created_at timestamptz) returns boolean
language sql stable security definer set search_path = public as $$
  select p_created_at < now() - interval '14 days'
      or exists (select 1 from ratings other
                 where other.trade_id = p_trade_id
                   and other.author_id = p_subject_id)
$$;

drop policy "ratings readable" on ratings;
create policy "ratings readable" on ratings for select
  using (author_id = auth.uid() or rating_is_public(trade_id, subject_id, created_at));
