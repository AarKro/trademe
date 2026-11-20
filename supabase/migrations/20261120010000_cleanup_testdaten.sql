-- Remove test data before the demo (requested by Aaron on 20.11.2026).
-- Explicit IDs only, taken from an inventory of the production data on 20.11.2026, so nothing
-- real can be hit by accident. Running this again (e.g. on a fresh database) does nothing.
--
-- Kept: the accounts of real people (Aaron, Fritz, Finn, Säse, Max, Pati, Mäxi, Saskia Schnorf).

-- 1. All 15 trades from testing. Offers, chats, payments, ratings, reports, notifications and
--    addresses of these trades are removed with them (on delete cascade).
delete from trades where id in (
  'e1dfd26e-cb1b-4089-b3b4-431301a2a79e', -- TEST B/01 – Möbelaufbau in Zürich
  'e0ed6820-b5fe-4216-8eda-5bb7deff0dce', -- TEST B/01 – Hilfe von überall
  'c37c17aa-6d1d-4707-94a5-0b4659df01d3', -- Test
  'c9de08e3-4b61-4c46-87db-8ecd94fa2302', -- test
  '31e7f65e-ea58-4f37-9271-2c8d5285602d', -- Lampe installieren (offen)
  '4ef0312a-572d-48e7-a509-388391059249', -- Lampe installieren (abgeschlossen)
  '9b8cc6e2-72d5-4043-bd25-b88d76ee26bd', -- Eine Website
  'db0134ef-4e19-4eeb-a3b3-3ca72f62661d', -- A-Test: Regal aufbauen
  '186f65ab-270b-401b-b2cc-4012525e2e53', -- A-Test: Bild aufhängen
  '7583cf87-32cf-404e-bc86-f503f59b0cbe', -- A-6 Gesamttest: Lampe im Flur montieren
  '402771ff-caff-48e8-b8d0-50ea125a26da', -- A-6 Runde 2: Vorhänge aufhängen
  '7c2fb6df-0ba3-4e59-8a34-d5ce75f533f6', -- UX-Test: Bild aufhängen
  '57a9ba55-c86b-4cc8-8c50-80868445f51b', -- UX: Bild aufhängen
  'f68e43d3-febd-4fd6-b8b8-2f8fb0e40dd2', -- UX: Regal montieren
  'ed210269-8d3b-48d0-be96-e1cf55fb6059'  -- UX: Lampe anschliessen
);

-- 2. The 7 test accounts. Deleting the login removes the profile, its offers and notifications
--    (on delete cascade). Leftovers that point at a test profile without cascade go first.
create temporary table test_accounts (id uuid primary key);
insert into test_accounts values
  ('534798b5-3b49-4212-b496-3bf9c65686d2'), -- Claude Test
  ('936c1cd7-791e-4e34-8623-19755b5db08d'), -- TradeMe B Test Client
  ('5e81e367-df7c-41fb-944b-70a831eef69e'), -- TradeMe B Test Helper
  ('0613a119-f2fa-41ef-9d70-33b939d85e4c'), -- Agent A.
  ('39d3781a-3a61-4b96-81cd-339e15256978'), -- Bea Test
  ('2e1e511d-cc9a-4ba0-b1a5-1ded123fce1b'), -- Cleo Test
  ('47417fe6-8b35-4516-9b17-d4d0a0f7f585'); -- test

delete from ratings  where author_id in (select id from test_accounts) or subject_id in (select id from test_accounts);
delete from reports  where reporter_id in (select id from test_accounts);
delete from messages where sender_id in (select id from test_accounts) or helper_id in (select id from test_accounts);
update trades set helper_id = null where helper_id in (select id from test_accounts) and status = 'offen';
delete from trades   where helper_id in (select id from test_accounts) or client_id in (select id from test_accounts);
delete from auth.users where id in (select id from test_accounts);
drop table test_accounts;
