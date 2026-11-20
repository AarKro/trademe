-- Demo data, round 2 (Aaron, 20.11.2026): ~20 more people, open trades with offers,
-- finished trades with mutual ratings and two running trades, so TradeMe looks like ~30 active users.
-- These people only fill the platform (profiles, trades, ratings). They have no password, so nobody
-- can log in as them. The 5 main demo accounts (Sandra, Lea, …) were created through the app.
-- Generated, so the IDs are fixed literals. Inserting an existing ID would fail: run once.

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', 'e22f302c-833d-4596-a50d-5ad10c3f28a9', 'authenticated', 'authenticated', 'jonas.weber@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Jonas Weber"}', now() - interval '70 days', now() - interval '70 days', '', '', '', '');
update profiles set location = 'Zürich, Kreis 3', bio = 'Schreiner von Beruf. Abends und am Wochenende baue ich Möbel auf und montiere Regale.', skills = array['Möbelaufbau','Bohren & Montieren']::text[], created_at = now() - interval '70 days', is_verified = true where id = 'e22f302c-833d-4596-a50d-5ad10c3f28a9';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '50211cb4-350d-4f6d-a244-3877c7fbc9cb', 'authenticated', 'authenticated', 'elif.yilmaz@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Elif Yilmaz"}', now() - interval '67 days', now() - interval '67 days', '', '', '', '');
update profiles set location = 'Zürich-Altstetten', bio = 'Ich putze gründlich und gerne – auch Endreinigungen mit Abnahmegarantie.', skills = array['Reinigung','Haushalt']::text[], created_at = now() - interval '67 days', is_verified = true where id = '50211cb4-350d-4f6d-a244-3877c7fbc9cb';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', 'da58c77b-356c-4479-94bd-bc3d3f8feed5', 'authenticated', 'authenticated', 'luca.bernasconi@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Luca Bernasconi"}', now() - interval '64 days', now() - interval '64 days', '', '', '', '');
update profiles set location = 'Zürich-Wipkingen', bio = 'Velomechaniker in Ausbildung. Ich flicke Platten, stelle Bremsen ein und mache den Winterservice.', skills = array['Velo-Reparatur','Technik']::text[], created_at = now() - interval '64 days' where id = 'da58c77b-356c-4479-94bd-bc3d3f8feed5';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '04472a03-aea5-4b1b-928a-7f3fcfa2f488', 'authenticated', 'authenticated', 'mia.schmid@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Mia Schmid"}', now() - interval '61 days', now() - interval '61 days', '', '', '', '');
update profiles set location = 'Zürich-Oerlikon', bio = 'Studentin (Pädagogik). Ich gebe Nachhilfe und helfe beim Einkaufen.', skills = array['Nachhilfe','Einkaufshilfe']::text[], created_at = now() - interval '61 days' where id = '04472a03-aea5-4b1b-928a-7f3fcfa2f488';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', 'c3d37af4-a3e9-431e-8da3-0da85ffc3027', 'authenticated', 'authenticated', 'noah.brunner@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Noah Brunner"}', now() - interval '58 days', now() - interval '58 days', '', '', '', '');
update profiles set location = 'Zürich-Altstetten', bio = 'Ich habe einen Lieferwagen und starke Arme – Zügeln, Transporte, Entsorgung.', skills = array['Umzug','Transport']::text[], created_at = now() - interval '58 days' where id = 'c3d37af4-a3e9-431e-8da3-0da85ffc3027';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', 'da9abb7f-c408-45ad-b286-a2dec932fc59', 'authenticated', 'authenticated', 'sophie.mueller@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Sophie Müller"}', now() - interval '55 days', now() - interval '55 days', '', '', '', '');
update profiles set location = 'Zürich, Kreis 7', bio = 'Hobbygärtnerin mit eigenem Werkzeug. Hecken, Rasen, Balkonpflanzen.', skills = array['Gartenarbeit','Pflanzen']::text[], created_at = now() - interval '55 days' where id = 'da9abb7f-c408-45ad-b286-a2dec932fc59';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '4d576ca9-7c42-4b5f-88e8-30747f38c937', 'authenticated', 'authenticated', 'david.kovac@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"David Kovač"}', now() - interval '52 days', now() - interval '52 days', '', '', '', '');
update profiles set location = 'Zürich-Schwamendingen', bio = 'Elektroinstallateur EFZ. Lampen, Steckdosen und kleine Reparaturen.', skills = array['Lampen montieren','Elektro']::text[], created_at = now() - interval '52 days', is_verified = true where id = '4d576ca9-7c42-4b5f-88e8-30747f38c937';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '8212fc00-c559-4f4b-bf38-b40ad144042a', 'authenticated', 'authenticated', 'chiara.ferrari@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Chiara Ferrari"}', now() - interval '49 days', now() - interval '49 days', '', '', '', '');
update profiles set location = 'Zürich-Wollishofen', bio = 'Tierliebhaberin. Ich gehe mit Hunden spazieren und schaue zu Katzen.', skills = array['Haustiere','Haushalt']::text[], created_at = now() - interval '49 days' where id = '8212fc00-c559-4f4b-bf38-b40ad144042a';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '956e15f1-b00e-4c58-91c5-bc9f33a0ce5d', 'authenticated', 'authenticated', 'samuel.graf@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Samuel Graf"}', now() - interval '46 days', now() - interval '46 days', '', '', '', '');
update profiles set location = 'Winterthur', bio = 'Fotograf und Webdesigner. Ich arbeite gerne remote.', skills = array['Webdesign','Fotografie']::text[], created_at = now() - interval '46 days', is_verified = true where id = '956e15f1-b00e-4c58-91c5-bc9f33a0ce5d';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', 'd88277d7-ec21-4725-ab73-c500385ee0d1', 'authenticated', 'authenticated', 'lina.frei@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Lina Frei"}', now() - interval '43 days', now() - interval '43 days', '', '', '', '');
update profiles set location = 'Zürich, Kreis 6', bio = 'Grafikerin. Logos, Flyer und Illustrationen für kleine Projekte.', skills = array['Grafik','Illustration']::text[], created_at = now() - interval '43 days' where id = 'd88277d7-ec21-4725-ab73-c500385ee0d1';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '7315fa27-b241-4295-9bd9-a69b115e3a41', 'authenticated', 'authenticated', 'yannick.steiner@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Yannick Steiner"}', now() - interval '40 days', now() - interval '40 days', '', '', '', '');
update profiles set location = 'Zürich-Affoltern', bio = 'Früh auf den Beinen: Schnee räumen, Laub rechen, Rasen mähen.', skills = array['Gartenarbeit','Schneeräumen']::text[], created_at = now() - interval '40 days' where id = '7315fa27-b241-4295-9bd9-a69b115e3a41';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '9b0724d2-ba65-4b93-9903-377d133babff', 'authenticated', 'authenticated', 'aylin.demir@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Aylin Demir"}', now() - interval '37 days', now() - interval '37 days', '', '', '', '');
update profiles set location = 'Zürich, Kreis 4', bio = 'Ich helfe beim Aufräumen, Packen und Putzen.', skills = array['Umzug','Reinigung']::text[], created_at = now() - interval '37 days' where id = '9b0724d2-ba65-4b93-9903-377d133babff';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', 'd47d4881-8e4c-4abb-bb4c-398002501770', 'authenticated', 'authenticated', 'beat.zuercher@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Beat Zürcher"}', now() - interval '34 days', now() - interval '34 days', '', '', '', '');
update profiles set location = 'Zürich-Seefeld', bio = 'Pensioniert, aber mit vielen Projekten in Haus und Garten.', skills = array[]::text[], created_at = now() - interval '34 days' where id = 'd47d4881-8e4c-4abb-bb4c-398002501770';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', 'a5767d0f-f89e-4497-b5d6-c7c27dc67e20', 'authenticated', 'authenticated', 'ursula.hofmann@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Ursula Hofmann"}', now() - interval '31 days', now() - interval '31 days', '', '', '', '');
update profiles set location = 'Zürich-Hottingen', bio = 'Ich bin 78 und froh um Hilfe bei Dingen, die nicht mehr so gut gehen.', skills = array[]::text[], created_at = now() - interval '31 days' where id = 'a5767d0f-f89e-4497-b5d6-c7c27dc67e20';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', 'c67fe723-4e91-446a-8b0e-e3c848512cc2', 'authenticated', 'authenticated', 'fabian.lehmann@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Fabian Lehmann"}', now() - interval '28 days', now() - interval '28 days', '', '', '', '');
update profiles set location = 'Zürich, Kreis 5', bio = 'Neu in Zürich und gerade am Einrichten.', skills = array[]::text[], created_at = now() - interval '28 days' where id = 'c67fe723-4e91-446a-8b0e-e3c848512cc2';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', 'e6deb078-7303-4433-91ac-41f7e654b714', 'authenticated', 'authenticated', 'priya.nair@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Priya Nair"}', now() - interval '25 days', now() - interval '25 days', '', '', '', '');
update profiles set location = 'Zürich, Kreis 1', bio = 'Zwei Jobs, eine Tochter – ich suche zuverlässige Unterstützung.', skills = array[]::text[], created_at = now() - interval '25 days' where id = 'e6deb078-7303-4433-91ac-41f7e654b714';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '571cf6ed-4eb0-4fee-836e-2626d9b0918f', 'authenticated', 'authenticated', 'martin.gerber@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Martin Gerber"}', now() - interval '22 days', now() - interval '22 days', '', '', '', '');
update profiles set location = 'Zürich-Höngg', bio = 'Haus mit Garten in Höngg.', skills = array[]::text[], created_at = now() - interval '22 days' where id = '571cf6ed-4eb0-4fee-836e-2626d9b0918f';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '609a8672-cbcc-4e91-ba39-eaf16d5224ab', 'authenticated', 'authenticated', 'laura.bianchi@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Laura Bianchi"}', now() - interval '19 days', now() - interval '19 days', '', '', '', '');
update profiles set location = 'Zürich-Wiedikon', bio = 'Ich renoviere gerade meine Wohnung.', skills = array['Italienisch']::text[], created_at = now() - interval '19 days' where id = '609a8672-cbcc-4e91-ba39-eaf16d5224ab';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '7772b2c2-5fcb-4167-9063-9018da7a31fb', 'authenticated', 'authenticated', 'thomas.wyss@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Thomas Wyss"}', now() - interval '16 days', now() - interval '16 days', '', '', '', '');
update profiles set location = 'Zürich-Oerlikon', bio = 'Pendler mit Velo und wenig Zeit.', skills = array[]::text[], created_at = now() - interval '16 days' where id = '7772b2c2-5fcb-4167-9063-9018da7a31fb';

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', 'f46caf9b-2782-439f-b6bf-e87c648fa9b2', 'authenticated', 'authenticated', 'hannah.fischer@example.com', '{"provider":"email","providers":["email"]}', '{"display_name":"Hannah Fischer"}', now() - interval '13 days', now() - interval '13 days', '', '', '', '');
update profiles set location = 'Zürich, Kreis 6', bio = 'Yogalehrerin mit Katze Mimi.', skills = array['Yoga']::text[], created_at = now() - interval '13 days' where id = 'f46caf9b-2782-439f-b6bf-e87c648fa9b2';

create temporary table demo_people as select id, display_name from profiles where display_name in ('Lea Meier', 'Tim Huber');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('fcc4094c-6048-4469-b3cd-73d9179e914b', 'd47d4881-8e4c-4abb-bb4c-398002501770', 'e22f302c-833d-4596-a50d-5ad10c3f28a9', 'Regal an die Wand montieren', 'Wandregal 1,2 m, Betonwand. Dübel sind vorhanden.', 'Möbelaufbau', 70, false, '8008 Zürich', 47.356, 8.556, '2026-10-08 10:00 Europe/Zurich'::timestamptz, 'abgeschlossen', '2026-10-08 10:00 Europe/Zurich'::timestamptz + interval '3 hours', '2026-10-08 10:00 Europe/Zurich'::timestamptz + interval '1 day', '2026-10-08 10:00 Europe/Zurich'::timestamptz - interval '4 days', '2026-10-08 10:00 Europe/Zurich'::timestamptz, null, array['Bohren']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('fcc4094c-6048-4469-b3cd-73d9179e914b', 'Seefeldstrasse 50', '8008', 'Zürich');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('fcc4094c-6048-4469-b3cd-73d9179e914b', 'e22f302c-833d-4596-a50d-5ad10c3f28a9', 65, '2026-10-08 10:00 Europe/Zurich'::timestamptz, 'Mit Schlagbohrmaschine kein Problem.', 'angenommen', '2026-10-08 10:00 Europe/Zurich'::timestamptz - interval '3 days');
insert into payments (trade_id, method, amount_chf, status, created_at) values ('fcc4094c-6048-4469-b3cd-73d9179e914b', 'bar', 65, 'offen', '2026-10-08 10:00 Europe/Zurich'::timestamptz - interval '2 days');
insert into ratings (trade_id, author_id, subject_id, stars, comment, created_at) values
  ('fcc4094c-6048-4469-b3cd-73d9179e914b', 'd47d4881-8e4c-4abb-bb4c-398002501770', 'e22f302c-833d-4596-a50d-5ad10c3f28a9', 5, 'Sehr exakt gearbeitet, das Regal hängt bombenfest.', '2026-10-08 10:00 Europe/Zurich'::timestamptz + interval '1 day'),
  ('fcc4094c-6048-4469-b3cd-73d9179e914b', 'e22f302c-833d-4596-a50d-5ad10c3f28a9', 'd47d4881-8e4c-4abb-bb4c-398002501770', 5, 'Herzlicher Empfang und klare Angaben.', '2026-10-08 10:00 Europe/Zurich'::timestamptz + interval '2 days');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('27ef81ec-8d2b-4e27-b150-a450f9df81d0', 'a5767d0f-f89e-4497-b5d6-c7c27dc67e20', '50211cb4-350d-4f6d-a244-3877c7fbc9cb', 'Wohnung putzen', '3-Zimmer-Wohnung, Bad und Küche gründlich.', 'Hilfe im Haushalt', 120, false, '8032 Zürich', 47.369, 8.56, '2026-10-10 09:00 Europe/Zurich'::timestamptz, 'abgeschlossen', '2026-10-10 09:00 Europe/Zurich'::timestamptz + interval '3 hours', '2026-10-10 09:00 Europe/Zurich'::timestamptz + interval '1 day', '2026-10-10 09:00 Europe/Zurich'::timestamptz - interval '4 days', '2026-10-10 09:00 Europe/Zurich'::timestamptz, null, array['Reinigung']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('27ef81ec-8d2b-4e27-b150-a450f9df81d0', 'Hottingerstrasse 20', '8032', 'Zürich');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('27ef81ec-8d2b-4e27-b150-a450f9df81d0', '50211cb4-350d-4f6d-a244-3877c7fbc9cb', 110, '2026-10-10 09:00 Europe/Zurich'::timestamptz, 'Ich bringe eigene Putzmittel mit.', 'angenommen', '2026-10-10 09:00 Europe/Zurich'::timestamptz - interval '3 days');
insert into payments (trade_id, method, amount_chf, status, created_at) values ('27ef81ec-8d2b-4e27-b150-a450f9df81d0', 'bar', 110, 'offen', '2026-10-10 09:00 Europe/Zurich'::timestamptz - interval '2 days');
insert into ratings (trade_id, author_id, subject_id, stars, comment, created_at) values
  ('27ef81ec-8d2b-4e27-b150-a450f9df81d0', 'a5767d0f-f89e-4497-b5d6-c7c27dc67e20', '50211cb4-350d-4f6d-a244-3877c7fbc9cb', 5, 'Blitzblank! Elif ist ein Schatz.', '2026-10-10 09:00 Europe/Zurich'::timestamptz + interval '1 day'),
  ('27ef81ec-8d2b-4e27-b150-a450f9df81d0', '50211cb4-350d-4f6d-a244-3877c7fbc9cb', 'a5767d0f-f89e-4497-b5d6-c7c27dc67e20', 5, 'Frau Hofmann ist sehr lieb, gerne wieder.', '2026-10-10 09:00 Europe/Zurich'::timestamptz + interval '2 days');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('98485999-d140-43c0-9fd0-501bc080e47d', 'c67fe723-4e91-446a-8b0e-e3c848512cc2', 'c3d37af4-a3e9-431e-8da3-0da85ffc3027', 'Möbel vom Brocki abholen', 'Kommode und Tisch vom Brocki-Land in Altstetten in den 2. Stock.', 'Umzug', 90, false, '8005 Zürich', 47.387, 8.52, '2026-10-12 14:00 Europe/Zurich'::timestamptz, 'abgeschlossen', '2026-10-12 14:00 Europe/Zurich'::timestamptz + interval '3 hours', '2026-10-12 14:00 Europe/Zurich'::timestamptz + interval '1 day', '2026-10-12 14:00 Europe/Zurich'::timestamptz - interval '4 days', '2026-10-12 14:00 Europe/Zurich'::timestamptz, null, array['Transport']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('98485999-d140-43c0-9fd0-501bc080e47d', 'Limmatstrasse 150', '8005', 'Zürich');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('98485999-d140-43c0-9fd0-501bc080e47d', 'c3d37af4-a3e9-431e-8da3-0da85ffc3027', 90, '2026-10-12 14:00 Europe/Zurich'::timestamptz, 'Mit Lieferwagen, in einer Stunde erledigt.', 'angenommen', '2026-10-12 14:00 Europe/Zurich'::timestamptz - interval '3 days');
insert into payments (trade_id, method, amount_chf, status, created_at) values ('98485999-d140-43c0-9fd0-501bc080e47d', 'bar', 90, 'offen', '2026-10-12 14:00 Europe/Zurich'::timestamptz - interval '2 days');
insert into ratings (trade_id, author_id, subject_id, stars, comment, created_at) values
  ('98485999-d140-43c0-9fd0-501bc080e47d', 'c67fe723-4e91-446a-8b0e-e3c848512cc2', 'c3d37af4-a3e9-431e-8da3-0da85ffc3027', 5, 'Pünktlich und super effizient.', '2026-10-12 14:00 Europe/Zurich'::timestamptz + interval '1 day'),
  ('98485999-d140-43c0-9fd0-501bc080e47d', 'c3d37af4-a3e9-431e-8da3-0da85ffc3027', 'c67fe723-4e91-446a-8b0e-e3c848512cc2', 4, 'Alles gut, nur der Lift war defekt.', '2026-10-12 14:00 Europe/Zurich'::timestamptz + interval '2 days');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('6cf0474b-a124-4758-8ccd-96ebb07ca2dd', 'e6deb078-7303-4433-91ac-41f7e654b714', '04472a03-aea5-4b1b-928a-7f3fcfa2f488', 'Wocheneinkauf erledigen', 'Einkaufsliste kommt per Chat, Coop am Central.', 'Hilfe im Haushalt', 35, false, '8001 Zürich', 47.3717, 8.5432, '2026-10-14 17:00 Europe/Zurich'::timestamptz, 'abgeschlossen', '2026-10-14 17:00 Europe/Zurich'::timestamptz + interval '3 hours', '2026-10-14 17:00 Europe/Zurich'::timestamptz + interval '1 day', '2026-10-14 17:00 Europe/Zurich'::timestamptz - interval '4 days', '2026-10-14 17:00 Europe/Zurich'::timestamptz, null, array['Einkauf']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('6cf0474b-a124-4758-8ccd-96ebb07ca2dd', 'Niederdorfstrasse 10', '8001', 'Zürich');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('6cf0474b-a124-4758-8ccd-96ebb07ca2dd', '04472a03-aea5-4b1b-928a-7f3fcfa2f488', 30, '2026-10-14 17:00 Europe/Zurich'::timestamptz, 'Kann ich am Freitagabend machen.', 'angenommen', '2026-10-14 17:00 Europe/Zurich'::timestamptz - interval '3 days');
insert into payments (trade_id, method, amount_chf, status, created_at) values ('6cf0474b-a124-4758-8ccd-96ebb07ca2dd', 'bar', 30, 'offen', '2026-10-14 17:00 Europe/Zurich'::timestamptz - interval '2 days');
insert into ratings (trade_id, author_id, subject_id, stars, comment, created_at) values
  ('6cf0474b-a124-4758-8ccd-96ebb07ca2dd', 'e6deb078-7303-4433-91ac-41f7e654b714', '04472a03-aea5-4b1b-928a-7f3fcfa2f488', 5, 'Hat sogar an die Ersatzprodukte gedacht. Danke!', '2026-10-14 17:00 Europe/Zurich'::timestamptz + interval '1 day'),
  ('6cf0474b-a124-4758-8ccd-96ebb07ca2dd', '04472a03-aea5-4b1b-928a-7f3fcfa2f488', 'e6deb078-7303-4433-91ac-41f7e654b714', 5, 'Klare Liste, alles easy.', '2026-10-14 17:00 Europe/Zurich'::timestamptz + interval '2 days');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('99b84561-9d15-4424-b748-b39f61ea1b82', '571cf6ed-4eb0-4fee-836e-2626d9b0918f', 'da9abb7f-c408-45ad-b286-a2dec932fc59', 'Hecke schneiden im Vorgarten', 'Buchenhecke, ca. 12 m. Grünabfuhr am Montag.', 'Gartenarbeit', 100, false, '8049 Zürich', 47.404, 8.496, '2026-10-16 09:00 Europe/Zurich'::timestamptz, 'abgeschlossen', '2026-10-16 09:00 Europe/Zurich'::timestamptz + interval '3 hours', '2026-10-16 09:00 Europe/Zurich'::timestamptz + interval '1 day', '2026-10-16 09:00 Europe/Zurich'::timestamptz - interval '4 days', '2026-10-16 09:00 Europe/Zurich'::timestamptz, null, array['Garten']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('99b84561-9d15-4424-b748-b39f61ea1b82', 'Limmattalstrasse 200', '8049', 'Zürich');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('99b84561-9d15-4424-b748-b39f61ea1b82', 'da9abb7f-c408-45ad-b286-a2dec932fc59', 95, '2026-10-16 09:00 Europe/Zurich'::timestamptz, 'Bringe Heckenschere und Säcke mit.', 'angenommen', '2026-10-16 09:00 Europe/Zurich'::timestamptz - interval '3 days');
insert into payments (trade_id, method, amount_chf, status, created_at) values ('99b84561-9d15-4424-b748-b39f61ea1b82', 'bar', 95, 'offen', '2026-10-16 09:00 Europe/Zurich'::timestamptz - interval '2 days');
insert into ratings (trade_id, author_id, subject_id, stars, comment, created_at) values
  ('99b84561-9d15-4424-b748-b39f61ea1b82', '571cf6ed-4eb0-4fee-836e-2626d9b0918f', 'da9abb7f-c408-45ad-b286-a2dec932fc59', 4, 'Schöne Arbeit, hat etwas länger gedauert als gedacht.', '2026-10-16 09:00 Europe/Zurich'::timestamptz + interval '1 day'),
  ('99b84561-9d15-4424-b748-b39f61ea1b82', 'da9abb7f-c408-45ad-b286-a2dec932fc59', '571cf6ed-4eb0-4fee-836e-2626d9b0918f', 5, 'Kaffee und Gipfeli inklusive – merci!', '2026-10-16 09:00 Europe/Zurich'::timestamptz + interval '2 days');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('933533e8-8dd9-4527-ac32-9e6f9a302dec', '609a8672-cbcc-4e91-ba39-eaf16d5224ab', '4d576ca9-7c42-4b5f-88e8-30747f38c937', 'Zwei Deckenlampen montieren', 'Wohnzimmer und Flur, Lampen sind gekauft.', 'Technikhilfe', 80, false, '8003 Zürich', 47.372, 8.516, '2026-10-18 18:00 Europe/Zurich'::timestamptz, 'abgeschlossen', '2026-10-18 18:00 Europe/Zurich'::timestamptz + interval '3 hours', '2026-10-18 18:00 Europe/Zurich'::timestamptz + interval '1 day', '2026-10-18 18:00 Europe/Zurich'::timestamptz - interval '4 days', '2026-10-18 18:00 Europe/Zurich'::timestamptz, null, array['Elektro']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('933533e8-8dd9-4527-ac32-9e6f9a302dec', 'Birmensdorferstrasse 100', '8003', 'Zürich');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('933533e8-8dd9-4527-ac32-9e6f9a302dec', '4d576ca9-7c42-4b5f-88e8-30747f38c937', 80, '2026-10-18 18:00 Europe/Zurich'::timestamptz, 'Als Elektriker mache ich das fachgerecht.', 'angenommen', '2026-10-18 18:00 Europe/Zurich'::timestamptz - interval '3 days');
insert into payments (trade_id, method, amount_chf, status, created_at) values ('933533e8-8dd9-4527-ac32-9e6f9a302dec', 'bar', 80, 'offen', '2026-10-18 18:00 Europe/Zurich'::timestamptz - interval '2 days');
insert into ratings (trade_id, author_id, subject_id, stars, comment, created_at) values
  ('933533e8-8dd9-4527-ac32-9e6f9a302dec', '609a8672-cbcc-4e91-ba39-eaf16d5224ab', '4d576ca9-7c42-4b5f-88e8-30747f38c937', 5, 'Fachmännisch und schnell. Absolut empfehlenswert.', '2026-10-18 18:00 Europe/Zurich'::timestamptz + interval '1 day'),
  ('933533e8-8dd9-4527-ac32-9e6f9a302dec', '4d576ca9-7c42-4b5f-88e8-30747f38c937', '609a8672-cbcc-4e91-ba39-eaf16d5224ab', 5, 'Gut vorbereitet, Leiter war da.', '2026-10-18 18:00 Europe/Zurich'::timestamptz + interval '2 days');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('10785b71-d9fb-4b70-bc9f-a1d47de90e69', '7772b2c2-5fcb-4167-9063-9018da7a31fb', 'da58c77b-356c-4479-94bd-bc3d3f8feed5', 'Velo-Bremsen einstellen', 'Scheibenbremsen schleifen, vorne und hinten.', 'Technikhilfe', 40, false, '8050 Zürich', 47.412, 8.544, '2026-10-20 12:00 Europe/Zurich'::timestamptz, 'abgeschlossen', '2026-10-20 12:00 Europe/Zurich'::timestamptz + interval '3 hours', '2026-10-20 12:00 Europe/Zurich'::timestamptz + interval '1 day', '2026-10-20 12:00 Europe/Zurich'::timestamptz - interval '4 days', '2026-10-20 12:00 Europe/Zurich'::timestamptz, null, array['Velo']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('10785b71-d9fb-4b70-bc9f-a1d47de90e69', 'Schaffhauserstrasse 350', '8050', 'Zürich');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('10785b71-d9fb-4b70-bc9f-a1d47de90e69', 'da58c77b-356c-4479-94bd-bc3d3f8feed5', 35, '2026-10-20 12:00 Europe/Zurich'::timestamptz, 'Kein Problem, dauert ca. 30 Minuten.', 'angenommen', '2026-10-20 12:00 Europe/Zurich'::timestamptz - interval '3 days');
insert into payments (trade_id, method, amount_chf, status, created_at) values ('10785b71-d9fb-4b70-bc9f-a1d47de90e69', 'bar', 35, 'offen', '2026-10-20 12:00 Europe/Zurich'::timestamptz - interval '2 days');
insert into ratings (trade_id, author_id, subject_id, stars, comment, created_at) values
  ('10785b71-d9fb-4b70-bc9f-a1d47de90e69', '7772b2c2-5fcb-4167-9063-9018da7a31fb', 'da58c77b-356c-4479-94bd-bc3d3f8feed5', 5, 'Bremst wieder wie neu. Top!', '2026-10-20 12:00 Europe/Zurich'::timestamptz + interval '1 day'),
  ('10785b71-d9fb-4b70-bc9f-a1d47de90e69', 'da58c77b-356c-4479-94bd-bc3d3f8feed5', '7772b2c2-5fcb-4167-9063-9018da7a31fb', 5, 'Sehr unkompliziert.', '2026-10-20 12:00 Europe/Zurich'::timestamptz + interval '2 days');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('e6ee872f-7569-43d4-9c26-a7bd138ec171', 'f46caf9b-2782-439f-b6bf-e87c648fa9b2', '8212fc00-c559-4f4b-bf38-b40ad144042a', 'Hund ausführen am Wochenende', 'Labrador «Kiko», 2× täglich 45 Minuten.', 'Sonstiges', 50, false, '8006 Zürich', 47.386, 8.549, '2026-10-22 08:00 Europe/Zurich'::timestamptz, 'abgeschlossen', '2026-10-22 08:00 Europe/Zurich'::timestamptz + interval '3 hours', '2026-10-22 08:00 Europe/Zurich'::timestamptz + interval '1 day', '2026-10-22 08:00 Europe/Zurich'::timestamptz - interval '4 days', '2026-10-22 08:00 Europe/Zurich'::timestamptz, null, array['Haustiere']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('e6ee872f-7569-43d4-9c26-a7bd138ec171', 'Universitätstrasse 80', '8006', 'Zürich');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('e6ee872f-7569-43d4-9c26-a7bd138ec171', '8212fc00-c559-4f4b-bf38-b40ad144042a', 50, '2026-10-22 08:00 Europe/Zurich'::timestamptz, 'Ich liebe Labradore!', 'angenommen', '2026-10-22 08:00 Europe/Zurich'::timestamptz - interval '3 days');
insert into payments (trade_id, method, amount_chf, status, created_at) values ('e6ee872f-7569-43d4-9c26-a7bd138ec171', 'bar', 50, 'offen', '2026-10-22 08:00 Europe/Zurich'::timestamptz - interval '2 days');
insert into ratings (trade_id, author_id, subject_id, stars, comment, created_at) values
  ('e6ee872f-7569-43d4-9c26-a7bd138ec171', 'f46caf9b-2782-439f-b6bf-e87c648fa9b2', '8212fc00-c559-4f4b-bf38-b40ad144042a', 5, 'Kiko war glücklich und müde. Perfekt.', '2026-10-22 08:00 Europe/Zurich'::timestamptz + interval '1 day'),
  ('e6ee872f-7569-43d4-9c26-a7bd138ec171', '8212fc00-c559-4f4b-bf38-b40ad144042a', 'f46caf9b-2782-439f-b6bf-e87c648fa9b2', 5, 'Sehr nette Halterin, alles gut erklärt.', '2026-10-22 08:00 Europe/Zurich'::timestamptz + interval '2 days');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('01ec3af9-4832-43b1-a178-63453a917615', 'd47d4881-8e4c-4abb-bb4c-398002501770', '956e15f1-b00e-4c58-91c5-bc9f33a0ce5d', 'Fotos für meine Ferienwohnung', 'Bildbearbeitung von 20 Fotos für die Airbnb-Seite.', 'Sonstiges', 200, true, null, null, null, '2026-10-24 10:00 Europe/Zurich'::timestamptz, 'abgeschlossen', '2026-10-24 10:00 Europe/Zurich'::timestamptz + interval '3 hours', '2026-10-24 10:00 Europe/Zurich'::timestamptz + interval '1 day', '2026-10-24 10:00 Europe/Zurich'::timestamptz - interval '4 days', '2026-10-24 10:00 Europe/Zurich'::timestamptz, null, array['Fotografie']::text[], array['twint','karte','bar']::payment_method[]);

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('01ec3af9-4832-43b1-a178-63453a917615', '956e15f1-b00e-4c58-91c5-bc9f33a0ce5d', 180, '2026-10-24 10:00 Europe/Zurich'::timestamptz, 'Ich optimiere Licht und Farben, Lieferung in 2 Tagen.', 'angenommen', '2026-10-24 10:00 Europe/Zurich'::timestamptz - interval '3 days');
insert into payments (trade_id, method, amount_chf, status, created_at) values ('01ec3af9-4832-43b1-a178-63453a917615', 'bar', 180, 'offen', '2026-10-24 10:00 Europe/Zurich'::timestamptz - interval '2 days');
insert into ratings (trade_id, author_id, subject_id, stars, comment, created_at) values
  ('01ec3af9-4832-43b1-a178-63453a917615', 'd47d4881-8e4c-4abb-bb4c-398002501770', '956e15f1-b00e-4c58-91c5-bc9f33a0ce5d', 5, 'Die Fotos sehen jetzt professionell aus.', '2026-10-24 10:00 Europe/Zurich'::timestamptz + interval '1 day'),
  ('01ec3af9-4832-43b1-a178-63453a917615', '956e15f1-b00e-4c58-91c5-bc9f33a0ce5d', 'd47d4881-8e4c-4abb-bb4c-398002501770', 5, 'Klares Briefing, angenehme Zusammenarbeit.', '2026-10-24 10:00 Europe/Zurich'::timestamptz + interval '2 days');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('e41c5f4e-e1ff-4949-b75c-9db245a28816', 'a5767d0f-f89e-4497-b5d6-c7c27dc67e20', '9b0724d2-ba65-4b93-9903-377d133babff', 'Keller aufräumen und entsorgen', 'Kellerabteil 6 m², alte Möbel und Kartons.', 'Umzug', 120, false, '8032 Zürich', 47.369, 8.56, '2026-10-26 10:00 Europe/Zurich'::timestamptz, 'abgeschlossen', '2026-10-26 10:00 Europe/Zurich'::timestamptz + interval '3 hours', '2026-10-26 10:00 Europe/Zurich'::timestamptz + interval '1 day', '2026-10-26 10:00 Europe/Zurich'::timestamptz - interval '4 days', '2026-10-26 10:00 Europe/Zurich'::timestamptz, null, array['Entsorgung']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('e41c5f4e-e1ff-4949-b75c-9db245a28816', 'Hottingerstrasse 20', '8032', 'Zürich');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('e41c5f4e-e1ff-4949-b75c-9db245a28816', '9b0724d2-ba65-4b93-9903-377d133babff', 120, '2026-10-26 10:00 Europe/Zurich'::timestamptz, 'Mache ich gerne, Entsorgung inklusive.', 'angenommen', '2026-10-26 10:00 Europe/Zurich'::timestamptz - interval '3 days');
insert into payments (trade_id, method, amount_chf, status, created_at) values ('e41c5f4e-e1ff-4949-b75c-9db245a28816', 'bar', 120, 'offen', '2026-10-26 10:00 Europe/Zurich'::timestamptz - interval '2 days');
insert into ratings (trade_id, author_id, subject_id, stars, comment, created_at) values
  ('e41c5f4e-e1ff-4949-b75c-9db245a28816', 'a5767d0f-f89e-4497-b5d6-c7c27dc67e20', '9b0724d2-ba65-4b93-9903-377d133babff', 4, 'Gut gemacht, ein Karton ist versehentlich im Müll gelandet.', '2026-10-26 10:00 Europe/Zurich'::timestamptz + interval '1 day'),
  ('e41c5f4e-e1ff-4949-b75c-9db245a28816', '9b0724d2-ba65-4b93-9903-377d133babff', 'a5767d0f-f89e-4497-b5d6-c7c27dc67e20', 5, 'Sehr dankbare und freundliche Kundin.', '2026-10-26 10:00 Europe/Zurich'::timestamptz + interval '2 days');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('9aa87634-621a-4629-8950-5b60dd747c4e', 'c67fe723-4e91-446a-8b0e-e3c848512cc2', 'e22f302c-833d-4596-a50d-5ad10c3f28a9', 'Kleiderschrank abbauen', 'PAX abbauen für den Transport, Schrauben beschriften.', 'Möbelaufbau', 60, false, '8005 Zürich', 47.387, 8.52, '2026-10-28 15:00 Europe/Zurich'::timestamptz, 'abgeschlossen', '2026-10-28 15:00 Europe/Zurich'::timestamptz + interval '3 hours', '2026-10-28 15:00 Europe/Zurich'::timestamptz + interval '1 day', '2026-10-28 15:00 Europe/Zurich'::timestamptz - interval '4 days', '2026-10-28 15:00 Europe/Zurich'::timestamptz, null, array['IKEA']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('9aa87634-621a-4629-8950-5b60dd747c4e', 'Limmatstrasse 150', '8005', 'Zürich');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('9aa87634-621a-4629-8950-5b60dd747c4e', 'e22f302c-833d-4596-a50d-5ad10c3f28a9', 60, '2026-10-28 15:00 Europe/Zurich'::timestamptz, 'Ich nummeriere alle Teile.', 'angenommen', '2026-10-28 15:00 Europe/Zurich'::timestamptz - interval '3 days');
insert into payments (trade_id, method, amount_chf, status, created_at) values ('9aa87634-621a-4629-8950-5b60dd747c4e', 'bar', 60, 'offen', '2026-10-28 15:00 Europe/Zurich'::timestamptz - interval '2 days');
insert into ratings (trade_id, author_id, subject_id, stars, comment, created_at) values
  ('9aa87634-621a-4629-8950-5b60dd747c4e', 'c67fe723-4e91-446a-8b0e-e3c848512cc2', 'e22f302c-833d-4596-a50d-5ad10c3f28a9', 5, 'Alles beschriftet – der Wiederaufbau wird ein Kinderspiel.', '2026-10-28 15:00 Europe/Zurich'::timestamptz + interval '1 day'),
  ('9aa87634-621a-4629-8950-5b60dd747c4e', 'e22f302c-833d-4596-a50d-5ad10c3f28a9', 'c67fe723-4e91-446a-8b0e-e3c848512cc2', 5, 'Sehr freundlich, gerne wieder.', '2026-10-28 15:00 Europe/Zurich'::timestamptz + interval '2 days');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('9264cc34-2351-49ee-8056-6aff525689a9', '609a8672-cbcc-4e91-ba39-eaf16d5224ab', 'd88277d7-ec21-4725-ab73-c500385ee0d1', 'Logo überarbeiten', 'Bestehendes Logo für meinen Sprachkurs moderner gestalten.', 'Sonstiges', 180, true, null, null, null, '2026-10-30 10:00 Europe/Zurich'::timestamptz, 'abgeschlossen', '2026-10-30 10:00 Europe/Zurich'::timestamptz + interval '3 hours', '2026-10-30 10:00 Europe/Zurich'::timestamptz + interval '1 day', '2026-10-30 10:00 Europe/Zurich'::timestamptz - interval '4 days', '2026-10-30 10:00 Europe/Zurich'::timestamptz, null, array['Grafik','Logo']::text[], array['twint','karte','bar']::payment_method[]);

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('9264cc34-2351-49ee-8056-6aff525689a9', 'd88277d7-ec21-4725-ab73-c500385ee0d1', 170, '2026-10-30 10:00 Europe/Zurich'::timestamptz, 'Ich schicke dir zwei Varianten.', 'angenommen', '2026-10-30 10:00 Europe/Zurich'::timestamptz - interval '3 days');
insert into payments (trade_id, method, amount_chf, status, created_at) values ('9264cc34-2351-49ee-8056-6aff525689a9', 'bar', 170, 'offen', '2026-10-30 10:00 Europe/Zurich'::timestamptz - interval '2 days');
insert into ratings (trade_id, author_id, subject_id, stars, comment, created_at) values
  ('9264cc34-2351-49ee-8056-6aff525689a9', '609a8672-cbcc-4e91-ba39-eaf16d5224ab', 'd88277d7-ec21-4725-ab73-c500385ee0d1', 5, 'Kreativ und schnell, genau mein Geschmack.', '2026-10-30 10:00 Europe/Zurich'::timestamptz + interval '1 day'),
  ('9264cc34-2351-49ee-8056-6aff525689a9', 'd88277d7-ec21-4725-ab73-c500385ee0d1', '609a8672-cbcc-4e91-ba39-eaf16d5224ab', 5, 'Sehr präzises Feedback, so macht es Spass.', '2026-10-30 10:00 Europe/Zurich'::timestamptz + interval '2 days');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('e62a9743-f4d8-4ca8-a239-39f27b44820d', 'd47d4881-8e4c-4abb-bb4c-398002501770', null, 'Waschmaschine anschliessen', 'Neue Waschmaschine steht schon im Bad, Anschlüsse sind vorhanden.', 'Technikhilfe', 80, false, '8008 Zürich', 47.356, 8.556, null, 'offen', null, null, now() - interval '1 days 0 hours', '2026-12-03 10:00 Europe/Zurich'::timestamptz, null, array['Haushalt']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('e62a9743-f4d8-4ca8-a239-39f27b44820d', 'Seefeldstrasse 50', '8008', 'Zürich');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('4df9142e-ac41-44cc-a842-0f11ce7d2d68', 'a5767d0f-f89e-4497-b5d6-c7c27dc67e20', null, 'Fenster putzen (4 Zimmer)', '8 Fenster, innen und aussen. Leiter ist vorhanden.', 'Hilfe im Haushalt', 120, false, '8032 Zürich', 47.369, 8.56, null, 'offen', null, null, now() - interval '2 days 1 hours', '2026-12-02 00:00 Europe/Zurich'::timestamptz, '2026-12-09 23:59:59 Europe/Zurich'::timestamptz, array['Reinigung']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('4df9142e-ac41-44cc-a842-0f11ce7d2d68', 'Hottingerstrasse 20', '8032', 'Zürich');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('31c9509d-541f-42ed-8930-0722e3af1aa9', 'a5767d0f-f89e-4497-b5d6-c7c27dc67e20', null, 'Begleitung zum Arzttermin', 'Mit dem Tram zum Unispital und zurück, ca. 2 Stunden.', 'Sonstiges', 30, false, '8032 Zürich', 47.369, 8.56, null, 'offen', null, null, now() - interval '3 days 2 hours', '2026-12-04 13:30 Europe/Zurich'::timestamptz, null, array['Begleitung']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('31c9509d-541f-42ed-8930-0722e3af1aa9', 'Hottingerstrasse 20', '8032', 'Zürich');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('ebd0f993-9dd8-47c3-b122-866f8bfc727a', 'c67fe723-4e91-446a-8b0e-e3c848512cc2', null, 'Umzug: 15 Kisten und ein Sofa', 'Von Kreis 5 nach Kreis 3, beide Wohnungen mit Lift.', 'Umzug', 250, false, '8005 Zürich', 47.387, 8.52, null, 'offen', null, null, now() - interval '4 days 3 hours', '2026-12-05 00:00 Europe/Zurich'::timestamptz, '2026-12-06 23:59:59 Europe/Zurich'::timestamptz, array['Transport','Umzug']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('ebd0f993-9dd8-47c3-b122-866f8bfc727a', 'Limmatstrasse 150', '8005', 'Zürich');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('cc3e8b4b-4ff1-446f-82df-cbac5bcf1e26', 'e6deb078-7303-4433-91ac-41f7e654b714', null, 'Mathe-Nachhilfe für Sek-Schülerin', '2. Sek, Algebra. Einmal pro Woche 60 Minuten.', 'Sonstiges', 40, false, '8001 Zürich', 47.3717, 8.5432, null, 'offen', null, null, now() - interval '5 days 4 hours', '2026-12-01 16:00 Europe/Zurich'::timestamptz, null, array['Nachhilfe']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('cc3e8b4b-4ff1-446f-82df-cbac5bcf1e26', 'Niederdorfstrasse 10', '8001', 'Zürich');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('dcfe7fc2-0119-4d4a-9e21-7d827c5f2c80', '571cf6ed-4eb0-4fee-836e-2626d9b0918f', null, 'Laub rechen und Rasen mähen', 'Garten ca. 200 m². Rasenmäher und Rechen sind vorhanden.', 'Gartenarbeit', 70, false, '8049 Zürich', 47.404, 8.496, null, 'offen', null, null, now() - interval '6 days 5 hours', '2026-11-30 00:00 Europe/Zurich'::timestamptz, '2026-12-07 23:59:59 Europe/Zurich'::timestamptz, array['Garten']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('dcfe7fc2-0119-4d4a-9e21-7d827c5f2c80', 'Limmattalstrasse 200', '8049', 'Zürich');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('6e908f89-0b41-4d23-8a12-edeba253d5ab', '609a8672-cbcc-4e91-ba39-eaf16d5224ab', null, 'Bilderwand aufhängen (8 Rahmen)', 'Rahmen in verschiedenen Grössen, Layout habe ich vorbereitet.', 'Möbelaufbau', 60, false, '8003 Zürich', 47.372, 8.516, null, 'offen', null, null, now() - interval '1 days 6 hours', '2026-12-02 18:00 Europe/Zurich'::timestamptz, null, array['Bohren']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('6e908f89-0b41-4d23-8a12-edeba253d5ab', 'Birmensdorferstrasse 100', '8003', 'Zürich');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('d79f3794-2b7d-48bd-9a65-951dd57e7a56', '7772b2c2-5fcb-4167-9063-9018da7a31fb', null, 'Velo-Service vor dem Winter', 'Kette, Bremsen, Licht prüfen. Velo steht im Keller.', 'Technikhilfe', 50, false, '8050 Zürich', 47.412, 8.544, null, 'offen', null, null, now() - interval '2 days 7 hours', '2026-12-01 18:00 Europe/Zurich'::timestamptz, null, array['Velo']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('d79f3794-2b7d-48bd-9a65-951dd57e7a56', 'Schaffhauserstrasse 350', '8050', 'Zürich');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('12a02ce1-6f54-4341-97f4-01329e9c0a8b', 'f46caf9b-2782-439f-b6bf-e87c648fa9b2', null, 'Katze füttern während der Ferien', 'Katze Mimi, einmal täglich füttern und Katzenklo leeren.', 'Sonstiges', 100, false, '8006 Zürich', 47.386, 8.549, null, 'offen', null, null, now() - interval '3 days 8 hours', '2026-12-20 00:00 Europe/Zurich'::timestamptz, '2026-12-27 23:59:59 Europe/Zurich'::timestamptz, array['Haustiere']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('12a02ce1-6f54-4341-97f4-01329e9c0a8b', 'Universitätstrasse 80', '8006', 'Zürich');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('2c03ad04-77da-49c5-9cb9-e5fa960e64dc', 'f46caf9b-2782-439f-b6bf-e87c648fa9b2', null, 'Website für meinen Yogakurs', 'Einfache Seite mit Kursplan, Preisen und Kontaktformular.', 'Sonstiges', 400, true, null, null, null, null, 'offen', null, null, now() - interval '4 days 9 hours', '2026-12-01 00:00 Europe/Zurich'::timestamptz, '2026-12-20 23:59:59 Europe/Zurich'::timestamptz, array['Webdesign']::text[], array['twint','karte']::payment_method[]);

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('8741bdbc-0c3d-4208-af95-741e9b6b9782', 'c67fe723-4e91-446a-8b0e-e3c848512cc2', null, 'IKEA-Bett aufbauen', 'MALM 160×200 mit Bettkästen.', 'Möbelaufbau', 70, false, '8005 Zürich', 47.387, 8.52, null, 'offen', null, null, now() - interval '5 days 10 hours', '2026-12-06 10:00 Europe/Zurich'::timestamptz, null, array['IKEA']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('8741bdbc-0c3d-4208-af95-741e9b6b9782', 'Limmatstrasse 150', '8005', 'Zürich');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('3e66c9af-cf09-4692-9f77-dfd99104c03e', 'd47d4881-8e4c-4abb-bb4c-398002501770', null, 'Flyer fürs Quartierfest gestalten', 'A5-Flyer, Texte und Fotos liefere ich.', 'Sonstiges', 150, true, null, null, null, null, 'offen', null, null, now() - interval '6 days 11 hours', '2026-11-28 00:00 Europe/Zurich'::timestamptz, '2026-12-05 23:59:59 Europe/Zurich'::timestamptz, array['Grafik']::text[], array['twint','karte']::payment_method[]);

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('eefa739e-a87b-46b0-8e57-70a39fbf02d0', '609a8672-cbcc-4e91-ba39-eaf16d5224ab', null, 'Kühlschrank in den 3. Stock tragen', 'Kein Lift. Sackkarre wäre hilfreich.', 'Umzug', 90, false, '8003 Zürich', 47.372, 8.516, null, 'offen', null, null, now() - interval '1 days 12 hours', '2026-12-03 17:00 Europe/Zurich'::timestamptz, null, array['Transport']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('eefa739e-a87b-46b0-8e57-70a39fbf02d0', 'Birmensdorferstrasse 100', '8003', 'Zürich');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('192f6b53-bbd7-40f2-8bd5-be53144f861f', '571cf6ed-4eb0-4fee-836e-2626d9b0918f', null, 'Weihnachtsbeleuchtung montieren', 'Lichterketten an Dachrinne und Baum, Leiter ist da.', 'Technikhilfe', 60, false, '8049 Zürich', 47.404, 8.496, null, 'offen', null, null, now() - interval '2 days 13 hours', '2026-12-01 15:00 Europe/Zurich'::timestamptz, null, array['Elektro']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('192f6b53-bbd7-40f2-8bd5-be53144f861f', 'Limmattalstrasse 200', '8049', 'Zürich');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('03a3a22a-ace9-462b-a082-fc845836e524', 'e6deb078-7303-4433-91ac-41f7e654b714', null, 'Endreinigung mit Abnahmegarantie', '2,5-Zimmer-Wohnung, Abnahme am 17.12. um 9 Uhr.', 'Hilfe im Haushalt', 380, false, '8001 Zürich', 47.3717, 8.5432, null, 'offen', null, null, now() - interval '3 days 14 hours', '2026-12-14 00:00 Europe/Zurich'::timestamptz, '2026-12-16 23:59:59 Europe/Zurich'::timestamptz, array['Reinigung']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('03a3a22a-ace9-462b-a082-fc845836e524', 'Niederdorfstrasse 10', '8001', 'Zürich');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('e62a9743-f4d8-4ca8-a239-39f27b44820d', '4d576ca9-7c42-4b5f-88e8-30747f38c937', 75, '2026-12-03 10:00 Europe/Zurich'::timestamptz, 'Mache ich als Elektriker gerne, inkl. Funktionstest.', 'offen', now() - interval '0 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('4df9142e-ac41-44cc-a842-0f11ce7d2d68', '50211cb4-350d-4f6d-a244-3877c7fbc9cb', 110, '2026-12-03 09:00 Europe/Zurich'::timestamptz, 'Streifenfrei garantiert.', 'offen', now() - interval '1 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('4df9142e-ac41-44cc-a842-0f11ce7d2d68', '9b0724d2-ba65-4b93-9903-377d133babff', 120, '2026-12-05 10:00 Europe/Zurich'::timestamptz, 'Bin am Samstag frei.', 'offen', now() - interval '2 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('31c9509d-541f-42ed-8930-0722e3af1aa9', '04472a03-aea5-4b1b-928a-7f3fcfa2f488', 30, '2026-12-04 13:30 Europe/Zurich'::timestamptz, 'Ich begleite Sie gerne.', 'offen', now() - interval '3 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('ebd0f993-9dd8-47c3-b122-866f8bfc727a', 'c3d37af4-a3e9-431e-8da3-0da85ffc3027', 240, '2026-12-05 09:00 Europe/Zurich'::timestamptz, 'Mit Lieferwagen und einem Kollegen.', 'offen', now() - interval '4 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('ebd0f993-9dd8-47c3-b122-866f8bfc727a', '9b0724d2-ba65-4b93-9903-377d133babff', 220, '2026-12-06 10:00 Europe/Zurich'::timestamptz, 'Kann auch beim Packen helfen.', 'offen', now() - interval '5 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('cc3e8b4b-4ff1-446f-82df-cbac5bcf1e26', '04472a03-aea5-4b1b-928a-7f3fcfa2f488', 40, '2026-12-01 16:00 Europe/Zurich'::timestamptz, 'Ich studiere Pädagogik und gebe seit 3 Jahren Nachhilfe.', 'offen', now() - interval '6 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('dcfe7fc2-0119-4d4a-9e21-7d827c5f2c80', 'da9abb7f-c408-45ad-b286-a2dec932fc59', 70, '2026-12-01 09:00 Europe/Zurich'::timestamptz, 'Gerne, bringe einen Laubbläser mit.', 'offen', now() - interval '7 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('dcfe7fc2-0119-4d4a-9e21-7d827c5f2c80', '7315fa27-b241-4295-9bd9-a69b115e3a41', 60, '2026-12-02 08:00 Europe/Zurich'::timestamptz, 'Kann früh am Morgen.', 'offen', now() - interval '8 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('6e908f89-0b41-4d23-8a12-edeba253d5ab', 'e22f302c-833d-4596-a50d-5ad10c3f28a9', 55, '2026-12-02 18:00 Europe/Zurich'::timestamptz, 'Mit Laser-Wasserwaage hängt alles gerade.', 'offen', now() - interval '9 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('d79f3794-2b7d-48bd-9a65-951dd57e7a56', 'da58c77b-356c-4479-94bd-bc3d3f8feed5', 45, '2026-12-01 18:00 Europe/Zurich'::timestamptz, 'Inklusive neuer Bremsbeläge, falls nötig.', 'offen', now() - interval '10 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('12a02ce1-6f54-4341-97f4-01329e9c0a8b', '8212fc00-c559-4f4b-bf38-b40ad144042a', 90, '2026-12-20 08:00 Europe/Zurich'::timestamptz, 'Ich wohne zwei Tramstationen entfernt.', 'offen', now() - interval '11 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('2c03ad04-77da-49c5-9cb9-e5fa960e64dc', '956e15f1-b00e-4c58-91c5-bc9f33a0ce5d', 380, '2026-12-05 10:00 Europe/Zurich'::timestamptz, 'Ich zeige dir vorher zwei Beispiele.', 'offen', now() - interval '12 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('2c03ad04-77da-49c5-9cb9-e5fa960e64dc', (select id from demo_people where display_name = 'Tim Huber'), 420, '2026-12-03 10:00 Europe/Zurich'::timestamptz, 'Mit Buchungsfunktion für die Kurse.', 'offen', now() - interval '13 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('8741bdbc-0c3d-4208-af95-741e9b6b9782', 'e22f302c-833d-4596-a50d-5ad10c3f28a9', 70, '2026-12-06 10:00 Europe/Zurich'::timestamptz, 'MALM kenne ich gut.', 'offen', now() - interval '14 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('8741bdbc-0c3d-4208-af95-741e9b6b9782', (select id from demo_people where display_name = 'Lea Meier'), 65, '2026-12-06 14:00 Europe/Zurich'::timestamptz, 'Kann am Samstagnachmittag.', 'offen', now() - interval '15 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('3e66c9af-cf09-4692-9f77-dfd99104c03e', 'd88277d7-ec21-4725-ab73-c500385ee0d1', 140, '2026-11-30 10:00 Europe/Zurich'::timestamptz, 'Erster Entwurf innert 2 Tagen.', 'offen', now() - interval '16 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('eefa739e-a87b-46b0-8e57-70a39fbf02d0', 'c3d37af4-a3e9-431e-8da3-0da85ffc3027', 90, '2026-12-03 17:00 Europe/Zurich'::timestamptz, 'Mit Sackkarre und Tragegurten.', 'offen', now() - interval '17 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('192f6b53-bbd7-40f2-8bd5-be53144f861f', '4d576ca9-7c42-4b5f-88e8-30747f38c937', 60, '2026-12-01 15:00 Europe/Zurich'::timestamptz, 'Sicher montiert, auch an der Dachrinne.', 'offen', now() - interval '18 hours');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('03a3a22a-ace9-462b-a082-fc845836e524', '50211cb4-350d-4f6d-a244-3877c7fbc9cb', 360, '2026-12-15 08:00 Europe/Zurich'::timestamptz, 'Mit Abnahmegarantie.', 'offen', now() - interval '19 hours');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('7676668d-7a65-4d65-b3a5-ed4fa13a1f10', '7772b2c2-5fcb-4167-9063-9018da7a31fb', '7315fa27-b241-4295-9bd9-a69b115e3a41', 'Velo-Parkplatz von Laub befreien', 'Vor dem Haus, ca. 20 m².', 'Gartenarbeit', 40, false, '8050 Zürich', 47.412, 8.544, '2026-11-29 08:00 Europe/Zurich'::timestamptz, 'vergeben', null, null, now() - interval '3 days', '2026-11-29 08:00 Europe/Zurich'::timestamptz, null, array['Garten']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('7676668d-7a65-4d65-b3a5-ed4fa13a1f10', 'Schaffhauserstrasse 350', '8050', 'Zürich');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('7676668d-7a65-4d65-b3a5-ed4fa13a1f10', '7315fa27-b241-4295-9bd9-a69b115e3a41', 40, '2026-11-29 08:00 Europe/Zurich'::timestamptz, 'Mache ich am Samstag früh.', 'angenommen', now() - interval '2 days');
insert into payments (trade_id, method, amount_chf, status) values ('7676668d-7a65-4d65-b3a5-ed4fa13a1f10', 'bar', 40, 'offen');
insert into messages (trade_id, helper_id, sender_id, body, created_at) values ('7676668d-7a65-4d65-b3a5-ed4fa13a1f10', '7315fa27-b241-4295-9bd9-a69b115e3a41', null, 'Vereinbarung: CHF 40', now() - interval '1 day');

insert into trades (id, client_id, helper_id, title, description, category, budget_chf, is_remote, location, lat, lng, scheduled_at, status, completed_reported_at, released_at, created_at, wanted_from, wanted_until, tags, payment_methods)
values ('e383d564-41e6-444e-a862-054f2dd1d7e1', 'e6deb078-7303-4433-91ac-41f7e654b714', '50211cb4-350d-4f6d-a244-3877c7fbc9cb', 'Bad gründlich reinigen', 'Kalk an Dusche und Armaturen.', 'Hilfe im Haushalt', 60, false, '8001 Zürich', 47.3717, 8.5432, '2026-11-30 10:00 Europe/Zurich'::timestamptz, 'vergeben', null, null, now() - interval '3 days', '2026-11-30 10:00 Europe/Zurich'::timestamptz, null, array['Reinigung']::text[], array['twint','karte','bar']::payment_method[]);

insert into trade_addresses (trade_id, street, zip, city) values ('e383d564-41e6-444e-a862-054f2dd1d7e1', 'Niederdorfstrasse 10', '8001', 'Zürich');

insert into offers (trade_id, helper_id, price_chf, proposed_at, message, status, created_at) values ('e383d564-41e6-444e-a862-054f2dd1d7e1', '50211cb4-350d-4f6d-a244-3877c7fbc9cb', 55, '2026-11-30 10:00 Europe/Zurich'::timestamptz, 'Ich bringe Entkalker mit.', 'angenommen', now() - interval '2 days');
insert into payments (trade_id, method, amount_chf, status) values ('e383d564-41e6-444e-a862-054f2dd1d7e1', 'bar', 55, 'offen');
insert into messages (trade_id, helper_id, sender_id, body, created_at) values ('e383d564-41e6-444e-a862-054f2dd1d7e1', '50211cb4-350d-4f6d-a244-3877c7fbc9cb', null, 'Vereinbarung: CHF 55', now() - interval '1 day');

drop table demo_people;
