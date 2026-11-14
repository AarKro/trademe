# Runde 5: Usability-Tests umsetzen

Stand 14.11.2026. Grundlage: Figma «Screens V4» (447:2790), der Code auf `main` (PRs #1–#15) und die Entscheide aus den Usability-Tests (23 × «jetzt», 5 × «später»).

**So arbeitest du mit dieser Liste:** Nimm die Aufgaben deines Buchstabens von oben nach unten. Pro Aufgabe gibt es einen Branch und einen PR (Regeln in `AGENTS.md`). Schreib die Aufgaben-ID (z.B. `B-3`) in den PR-Titel. Wenn du fertig bist, hak die Aufgabe hier im selben PR ab (`[x]`).

---

## 1. Was schon steht

Alle Routen aus `registry.ts` sind gebaut. Kein Screen zeigt mehr den Platzhalter.

| Bereich | Fertig | Lücken gegenüber Figma V4 |
|---|---|---|
| **A** Profil & Bewertung | A/10, A/10b, A/11–A/16, Zustand + Maskottchen | Erhaltene Bewertungen sieht man nur über «So sehen andere dein Profil». Bewertungen, die man selbst abgegeben hat, sieht man nirgends. |
| **B** Auftraggebende | B/01–B/03b, B/05, B/05b, B/06, B/06b, B/07–B/09, B/11, B/12, B/14–B/16 (Barzahlung durchgehend) | B/05c, B/06c und B/13 fehlen: TWINT/Karte zeigt «Kommt bald». `/api/create-payment-intent` existiert, ist aber nicht angeschlossen. |
| **C** Helfende | C/01–C/09, Chat live | Chat-Liste zeigt nur Chats, in denen ich helfe. **Auftraggebende sehen ihre Chats im Tab gar nicht.** Kein Chat-Button im Auftrag-Detail. In C/09 fehlt der Link zu «Bewertung abgeben» (A/14 ist gebaut, aber nicht erreichbar). Der Chip «Kreis 4 · 5 km» und «Nach Distanz» filtern bzw. sortieren nicht wirklich. |
| **Alle** | – | Benachrichtigungen: Die Tabelle `notifications` existiert, aber es gibt keine Anzeige in der App. |

In Figma noch offen und nicht Teil dieser Runde: Verifizierungs-Flow (ID-Scan).

> Hinweis: «Gruppe» und «Lampe installieren» kommen aus dem Figma-Prototyp, den die Testpersonen benutzt haben, und nicht aus der App. Dort einfach prüfen, dass die App klare Texte hat.

---

## 2. Datenbank zuerst (A, blockiert einige B/C-Aufgaben)

Datenbankänderungen betreffen alle. Deshalb macht **A (Aaron) eine einzige Migration** für die ganze Runde. B und C bauen inzwischen alles, was ohne Datenbank geht (in den Listen mit 🟢 markiert). Aufgaben mit 🔒 warten, bis der PR **A-1** gemerged und die Migration eingespielt ist.

**A-1 · Migration «Runde 5»** (`supabase/migrations/20261114000000_runde5.sql`)
- [ ] **Adresse privat:** neue Tabelle `trade_addresses (trade_id pk, street, zip, city)`. RLS: Die auftraggebende Person liest und schreibt immer. Die helfende Person darf erst lesen, wenn `trades.helper_id = auth.uid()` und `payments.status in ('hinterlegt','freigegeben')` gilt oder die Methode `bar` ist. `trades.location` bleibt das grobe Quartier für Karte und Liste.
- [ ] **Datum Pflicht + Zeitspanne:** `trades.wanted_from timestamptz not null` (für neue Trades), `trades.wanted_until timestamptz null`. `null` heisst «ab diesem Zeitpunkt». Bestehende Zeilen werden mit `created_at` befüllt. `scheduled_at` bleibt der vereinbarte Termin.
- [ ] **Filter:** `trades.tags text[] default '{}'` und `trades.payment_methods payment_method[] default '{twint,karte,bar}'` (welche Zahlungsarten die auftraggebende Person akzeptiert).
- [ ] **Löschen:** RPC `delete_trade(p_trade_id)`. Erlaubt nur der auftraggebenden Person, solange `status = 'offen'`. Offene Angebote werden auf `zurueckgezogen` gesetzt und die Helfenden benachrichtigt. **Bearbeiten** geht schon über die bestehende Policy «client edits open trade». Bitte prüfen, dass `status` dabei nicht änderbar ist (Trigger oder Spalten-Grant).
- [ ] **Angebot ablehnen:** RPC `decline_offer(p_offer_id)` → `offers.status = 'abgelehnt'` + Benachrichtigung an die helfende Person.
- [ ] **Benachrichtigungen:** Trigger, die `notify()` aufrufen bei neuer Chat-Nachricht (an die Gegenseite), Statuswechsel des Trades (`vergeben`, `zur_bestaetigung`, `abgeschlossen`, `problem`, `storniert`), abgelehntem Angebot und neuer Bewertung. `notifications` zur Realtime-Publication hinzufügen.
- [ ] **Standort für die Karte:** `profiles.home_lat`, `profiles.home_lng`, `profiles.home_label` (optional, nur grob).
- [ ] `app/src/lib/types.ts` und die Tabelle im README nachführen. Dry-Run zeigen, dann `npx supabase db push --remote`.
- [ ] Im PR die neuen Felder und RPCs für B und C in einfachen Worten auflisten.

---

## 3. Aufgaben pro Person

Priorität: **P1** = Lücke im Ablauf, **P2** = unklar/schlecht sichtbar, **P3** = neue Funktion.

### A · Profil, Bewertungen, Benachrichtigungen (Aaron)

- [ ] **A-1** Migration (siehe oben). *Zuerst, damit B und C weiterkommen.*
- [ ] **A-2 (P1) Benachrichtigungen in der App** 🔒
  Glocke mit Zähler in der App-Bar der Tab-Roots (oder Punkt auf dem Bottom-Nav-Tab), neuer Screen `/benachrichtigungen` (Liste: Text, Zeit, ungelesen fett, Tipp → zum Trade/Chat, alles gelesen setzen). Live über Realtime. Ungelesene Chats zusätzlich als Punkt auf dem Tab «Chat». Route in `registry.ts` als Owner A eintragen. Gemeinsame Dateien (`AppBar`, `BottomNav`, `TabLayout`) → im PR erwähnen.
- [ ] **A-3 (P1) Erhaltene Bewertungen im eigenen Profil** 🟢
  In `/profil` die erhaltenen Bewertungen direkt anzeigen (die neuesten 3 + «Alle ansehen»), nicht nur den Link aufs öffentliche Profil. Die Regel «verdeckt bis zur Gegenbewertung» (#13) gilt weiter.
- [ ] **A-4 (P2) Liste «Erhalten / Abgegeben»** 🟢
  Neuer Screen `/profil/bewertungen` mit Umschalter «Erhalten» | «Abgegeben». Abgegebene zeigen Person, Trade, Sterne und den Hinweis «noch verdeckt», solange die Gegenseite nicht bewertet hat.
- [ ] **A-5 (P2) Bewertung erreichbar für Helfende** 🟢 *(mit C absprechen, C-Datei)*
  Prüfen, dass A/14 aus C/09 und aus Benachrichtigungen erreichbar ist. Falls C es nicht in C-2 macht, gibt A dem C-Agent den Link.
- [ ] **A-6 Gesamttest am Schluss:** einen ganzen Trade mit zwei Testkonten durchspielen (erstellen → Angebot → Zahlung → erledigt → Freigabe → beide bewerten) und Fehler als Issues an B/C geben.

### B · Auftraggebende (Trade erstellen, Meine Trades, Detail, Checkout)

- [ ] **B-1 (P2) Trade erstellen klarer** 🟢
  - Button «Veröffentlichen» immer sichtbar: Sticky Action-Bar (Pattern 421:451, Komponente `ActionBar`), nicht unten im Formular versteckt.
  - Hinweistexte grösser: `text-body` statt `text-caption`, gut lesbarer Kontrast.
  - Beispieltexte konkret formulieren (Platzhalter wie «z.B. Deckenlampe im Wohnzimmer montieren»), Kategorien verständlich benennen. Ein Feld «Gruppe» darf es nicht geben bzw. es muss erklärt sein.
  - «Überall» → beschriften als «Remote / von überall möglich» und kurz erklären.
- [ ] **B-2 (P1/P2) Datum, Adresse, Filterangaben beim Erstellen** 🔒 (A-1)
  - «Wann» wird Pflicht und steht weiter oben: Auswahl «Ab Zeitpunkt» oder «Zeitspanne von–bis» (`wanted_from`, `wanted_until`).
  - Adresse (Strasse, PLZ, Ort) in `trade_addresses` speichern, mit Hinweis «Die helfende Person sieht die Adresse erst nach der Zahlung». Das grobe Quartier bleibt in `location`.
  - Tags (Chips, frei + Vorschläge) und akzeptierte Zahlungsarten erfassen.
- [ ] **B-3 (P1) Eigene Trades bearbeiten und löschen** 🟢 bearbeiten / 🔒 löschen
  Im Trade-Detail (Status `offen`): Menü in der App-Bar → «Bearbeiten» (gleiches Formular wie Erstellen, vorausgefüllt, `update` auf `trades`) und «Löschen» (Bestätigungs-Sheet → `rpc('delete_trade')`). Nach `vergeben` gibt es nur «Stornieren» (gibt es schon).
- [ ] **B-4 (P1) «Meine Trades» / «Meine Angebote»** 🟢
  Umschalter oben in `/trades`. «Meine Trades» = Trades, die ich erstellt habe. «Meine Angebote» = Angebote, die ich gesendet habe, mit Status (offen / angenommen / abgelehnt) → Tipp öffnet `/auftraege/:id`. Die Gruppierung «Handlung nötig» bleibt pro Tab.
- [ ] **B-5 (P2) Klare Buttons bei Angeboten** 🟢 Annehmen/Chatten · 🔒 Ablehnen
  Jede Angebotskarte in B/03b hat drei Aktionen: **Annehmen** (primär), **Chatten**, **Ablehnen** (Bestätigung → `rpc('decline_offer')`). Abgelehnte Angebote verschwinden aus der Liste.
- [ ] **B-6 (P1/P2) Checkout: übernehmen, zusammenfassen, erklären** 🟢
  - Preis und Termin kommen schon aus dem Angebot (`accept_offer` setzt `scheduled_at`). Das sichtbar machen: «Übernommen aus dem Angebot von …», nichts muss abgetippt werden.
  - Zusammenfassung **aller** Angaben vor der Zahlung (Summary-Card 423:537): Trade, Person, Termin, Ort/Adresse, Preis, Zahlungsart, Gebühr, Stornoregel.
  - Bezahlung in einfachen Worten erklären: «Das Geld wird bei TradeMe hinterlegt und erst nach deiner Freigabe ausgezahlt», «bar = kein Zahlungsschutz», «gratis stornieren bis 48 h vorher, danach 20 %». Link «AGB» auf ein kurzes Sheet mit den 5 wichtigsten Regeln (Text aus README «Business rules»).
- [ ] **B-7 (optional) TWINT/Karte anschliessen** (B/05c, B/06c, B/13) 🟢
  `/api/create-payment-intent` + Stripe Testmodus, Fehler-Screen B/13. Nur wenn B-1 bis B-6 fertig sind.

### C · Helfende (Entdecken, Auftrag, Chat)

- [ ] **C-1 (P1/P2) Chat-Liste reparieren und ausbauen** 🟢
  - **Bug:** Die Liste lädt nur `helper_id = ich`. Sie muss auch Chats zu meinen eigenen Trades zeigen (`trades.client_id = ich`), eine Zeile pro Trade + Gegenüber.
  - Jede Zeile zeigt **Name + Avatar der Person** und darunter den Trade-Titel.
  - Bereich «Abgeschlossen» (eingeklappt) für Chats zu Trades mit Status `abgeschlossen` / `storniert`.
  - Ungelesen-Punkt kommt mit A-2. Bis dahin reicht Sortierung nach letzter Nachricht.
- [ ] **C-2 (P2) Auftrag-Detail ergänzen** 🟢
  - Nach dem Senden eines Angebots erklären, wie es weitergeht: kleine Status-Timeline / 3 Schritte («Person prüft dein Angebot → Du wirst benachrichtigt → Bei Annahme siehst du Adresse und Termin»).
  - Button «Chatten» mit der auftraggebenden Person (ab Angebot gesendet).
  - C/09: Button «Bewertung abgeben» → `/trades/:id/bewerten` (A/14).
  - Abgelehntes Angebot freundlich anzeigen (🔒 A-1).
- [ ] **C-3 (P1) Adresse nach der Zahlung zeigen** 🔒 (A-1)
  In C/08 / C/05 die volle Adresse aus `trade_addresses` anzeigen, mit Link «In Karte öffnen». Vorher nur das Quartier und der Hinweis «Adresse siehst du nach der Zahlung».
- [ ] **C-4 (P2) Filter in Entdecken** 🟢 Preis/Remote · 🔒 Tags/Zahlungsart
  Filter-Sheet (Bottom-Sheet) mit: Tags, Zahlungsart, Preisbereich (min–max CHF), «Remote». Aktive Filter als Chips mit ×. Gilt für Karte und Liste.
- [ ] **C-5 (P3) Karte: Standort und Trades in der Nähe** 🟢 (Profil-Speicherung 🔒)
  «Meinen Standort verwenden» (Browser-Geolocation) oder Adresse eingeben (`screens/b/geocode.ts` wiederverwenden) → Karte zentriert sich, Pin für «mich», Radius-Chip (2 / 5 / 10 km) filtert wirklich, Liste «Nach Distanz» sortiert wirklich. Remote-Trades bleiben sichtbar (Abschnitt «Remote»). Gewählten Standort in `profiles.home_*` merken, sobald A-1 da ist.

---

## 4. Später (nicht in dieser Runde)

- Helfende Person bestätigt am Schluss «erledigt» (zusätzlich zur Freigabe)
- Automatischer Preisvorschlag
- Anonym über die App telefonieren (von der erstellenden Person freigeschaltet)
- Trade-Arten: einmaliges Treffen oder Projekt mit mehreren Terminen
- Icons in «Meine Trades» klickbar machen
- Verifizierungs-Flow (ID-Scan), TWINT/Karte falls B-7 nicht reicht

## 5. Nicht kaputt machen (kam gut an)

Fremde Profile ansehen, Budget, Beschreibung, Fotos, Termin vorschlagen, Bestätigung «Angebot gesendet», Profil verifizieren («Geprüft»).

## 6. Abhängigkeiten auf einen Blick

```
A-1 Migration ──┬─> A-2 Benachrichtigungen ──> (C-1 Ungelesen-Punkt)
                ├─> B-2 Datum/Adresse/Tags ──> C-3 Adresse zeigen, C-4 Tags/Zahlungsart
                ├─> B-3 Löschen, B-5 Ablehnen ──> C-2 «abgelehnt» anzeigen
                └─> C-5 Standort merken
Alles mit 🟢 kann sofort starten.
```
