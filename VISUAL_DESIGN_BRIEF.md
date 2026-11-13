# TradeMe – Runde 3: Visual Design

Zuletzt aktualisiert: 13.11.2026 · im Auftrag von Aaron
Gilt zusammen mit `FIGMA_AGENT_PROTOCOL` (v2). Rollen aus `01 Team` bleiben unverändert.

## Ziel

Die bestehenden Graustufen-Wireframes (30 Screens) bekommen ein finales Visual Design. Die Grundlage dafür ist ein sauberes Design System aus Variablen, Styles und Komponenten. Am Ende sieht jeder Screen aus wie ein fertiges Produkt, und **jeder Wert ist an ein Token gebunden**.

## Ausgangslage im File

- `📋 Task` – Projektauftrag (Task brief, 5:2). Inhalt, Flows und Texte gelten weiter.
- `Library` (21:9) – Wireframe-Komponenten von A (Button, Input, Status-Badge, App-Bar, Bottom-Nav, Trade-Card, Chat-Bubble, Rating, Banner).
- `Wireframes` (21:10) – Sections `A/Übersicht` (47:559), `A/Profil & Bewertung` (21:13), `B/Auftraggebende` (21:11), `C/Helfende` (21:12).

**`Library` und `Wireframes` werden ab jetzt zum Archiv und bleiben unverändert.** Gearbeitet wird nur auf den neuen Seiten.

## Struktur (legt der Koordinator A in Phase 0 an)

| Seite | Inhalt | Owner |
|---|---|---|
| `Design System` | Variablen-Doku, Text-Styles, Icons, Komponenten, Bildquellen | A |
| `Screens` | Section `A/Profil & Bewertung` | A |
| `Screens` | Section `B/Auftraggebende` | B |
| `Screens` | Section `C/Helfende` | C |

Frame-Namen und Nummern werden aus den Wireframes übernommen (z. B. `B/04 Angebote vergleichen`). Der Koordinator passt `FACTS` per Thread an `@ALL` an: `Format: Mobile 390×844 · Visual Design · Inter + Limelight · Komponenten aus page Design System`.

## Visuelle Richtung: Swiss minimal

Reduziert und typografisch, mit viel Weissraum und einem klaren Raster. Hierarchie entsteht über Schriftgrösse, Schriftgewicht, Linien und Abstand, nicht über Dekoration. Der Akzent wird sparsam eingesetzt: für primäre Aktionen, den aktiven Zustand und wichtige Hinweise.

### Feste Vorgaben (von den Menschen entschieden)

| Thema | Vorgabe |
|---|---|
| Akzentfarbe | `#B23509` |
| Textfarbe | `#0D1B28` |
| Schmuckschrift | **Limelight**: nur für die Wortmarke «TradeMe» und für Screen-Titel (Display/H1, ab 24 px) |
| Grundschrift | **Inter** für alles andere |
| Icons | **Lucide** (Line-Icons, einheitliche Strichstärke, 24-px-Raster) |
| Fotos & Avatare | Stock (z. B. Unsplash), Quelle wird dokumentiert |
| Format | Mobile 390×844, nur Light Mode |
| Formensprache | **A schlägt vor**: Radius- und Elevation-Tokens, Freigabe zusammen mit dem Pilot. Rahmen: Swiss bleibt erkennbar (zurückhaltende Radien, kaum oder keine Schatten, keine Verläufe). |

### Kontrast (WCAG AA, Pflicht)

- `#B23509` auf Weiss: **6.2 : 1**, zulässig für Text und Flächen. Weisse Schrift auf Akzent-Button ist ebenfalls zulässig.
- `#0D1B28` auf Weiss: **17.4 : 1**.
- **Verboten:** Akzent auf Textfarbe (bzw. umgekehrt), nur **2.8 : 1**.
- Alle weiteren Farbstufen (Tints, Grautöne, Status-Farben) prüft A vor der Freigabe: Fliesstext mindestens 4.5 : 1, grosser Text und UI-Elemente mindestens 3 : 1. Die Werte stehen im Design System neben dem Token.

## Grundregel: keine Magic Numbers, keine Magic Strings

Die Agents erstellen **Variablen, Tokens, Styles und Komponenten** und verwenden ausschliesslich diese.

**Keine Magic Numbers.** Jede Farbe (Fill, Stroke), jeder Abstand (Padding, Gap), jeder Radius, jede Strichstärke und jede feste Grösse ist an eine **Variable** gebunden. Jede Schrift läuft über einen **Text-Style**, jeder Schatten (falls freigegeben) über einen **Effect-Style**. Das gilt auch für die Screen-Grösse (`size/screen/width`, `size/screen/height`).

**Keine Magic Strings.** Wiederkehrende UI-Begriffe (Auftragsstatus, Navigationslabels, Rollenbezeichnungen, Buttontexte wie «Angebot abgeben», Währungsformat) liegen als **String-Variablen** in einer Collection `Content`. Texte in Komponenten laufen über **Component Properties**. Beispieldaten kommen ausschliesslich aus `FACTS`.

**Keine lokalen Kopien.** Instanzen werden nicht gedetacht, Tokens werden nicht dupliziert. Wenn etwas fehlt, geht ein `proposal`-Thread an `@A`.

### Token-Architektur (A baut, alle nutzen)

1. **Collection `Primitives`**: Rohwerte, werden in Screens **nicht direkt** verwendet.
   `color/accent/50…900` (Basis `#B23509`), `color/ink/50…900` (Basis `#0D1B28`), `color/neutral/…`, `color/white`, Status-Farben; `space/0…` (8-px-Raster mit 4-px-Halbschritten), `radius/…`, `stroke/…`, `size/…`.
2. **Collection `Semantic`**: das, was Screens und Komponenten verwenden.
   z. B. `color/text/primary`, `color/text/secondary`, `color/text/on-accent`, `color/surface/default`, `color/surface/subtle`, `color/border/default`, `color/action/primary`, `color/action/primary-pressed`, `color/status/offen…abgeschlossen`, `color/feedback/info|warnung|erfolg|fehler`, `space/inset/…`, `space/stack/…`, `radius/control`, `radius/card`.
3. **Collection `Content`**: String-Variablen für wiederkehrende Begriffe (siehe oben).
4. **Text-Styles**: `Display` und `H1` in Limelight; `H2`, `H3`, `Body`, `Body strong`, `Label`, `Caption` und `Numeric` (für Preise) in Inter. Zeilenhöhe und Zeichenabstand sind im Style definiert.
5. **Effect-Styles**: nur wenn A Elevation vorschlägt und die Menschen sie freigeben.

Naming: `kategorie/rolle/variante`, alles in Kleinbuchstaben, Englisch für Token-Namen und Deutsch für UI-Texte. Jede Semantic-Variable referenziert eine Primitive (Alias) und nie einen Hex-Wert.

## Ablauf

### Phase 0 – Setup (A, Koordinator)
1. Seiten `Design System` und `Screens` mit den drei Sections anlegen und `Struktur angelegt` loggen.
2. `FACTS` per Thread an `@ALL` aktualisieren (Format, Bildquellen-Regel, Personas mit Fotos).
3. Thread `T | A→ALL | open | Runde 3: Visual Design` mit Aufgaben pro Agent eröffnen. B und C antworten mit `agree` oder einer konkreten Änderung.

### Phase 1 – Design System (A)
1. Variablen (`Primitives`, `Semantic`, `Content`), Text-Styles und Kontrast-Doku anlegen.
2. Vorschlag für die Formensprache (Radius- und Elevation-Tokens) mit 1–2 Varianten auf `Design System` zeigen.
3. Alle 9 Wireframe-Komponenten **neu** auf `Design System` aufbauen, mit denselben Varianten und Properties und vollständig an Tokens gebunden.
4. Neue Komponenten: `Logo` (Wortmarke Limelight), `Icon` (Lucide-Set, Instance-Swap-Property), `Avatar` (Persona-Fotos Sandra K. und Lea M. sowie Fallback mit Initialen), `Image` (Foto-Platzhalter mit festem Seitenverhältnis), bei Bedarf `Verified-Hinweis` («nicht geprüft»).
5. Rahmen `Bildquellen` auf `Design System`: jedes Foto mit Quelle und Lizenz.
6. `Library bereit` loggen.

### Phase 2 – Pilot und Freigabe
1. **Pilot-Screen: `C/02 Feed – Startscreen`**, gebaut von C auf `Screens` (Startscreen, nutzt Trade-Card, App-Bar, Bottom-Nav, Fotos und Icons).
2. A stellt Design System und Pilot nebeneinander und legt ein `ASK` in `07 Human Inbox` an: *«Visual Design freigeben?»*. Optionen: 1) freigeben · 2) freigeben mit Änderungen · 3) neue Richtung.
3. **Bis zur Freigabe baut niemand weitere Screens.**
4. Nach der Freigabe hält A die Entscheidung als `DEC-001 | Visual Design` in `06 Decisions` fest (Akzent, Schriften, Formensprache, Token-Regel).

### Phase 3 – Rollout (jeder Owner in der eigenen Section)
1. Eigene Wireframe-Frames auf `Screens` in die eigene Section **duplizieren**. Das Original bleibt unverändert.
2. Instanzen der alten `Library` per **Swap** auf die neuen `Design System`-Komponenten umstellen. Danach darf keine Instanz mehr auf die alte Library zeigen.
3. Alle übrigen Werte an Tokens und Styles binden, Icons und Fotos einsetzen und Screen-Titel auf den Text-Style `H1` (Limelight) setzen.
4. Prototyp-Links prüfen und auf die neuen Frames umhängen. Duplikate zeigen sonst noch auf die Wireframes. Links in andere Sections werden per Thread mit dem Owner abgestimmt (Frame-IDs nennen).
5. Pro Batch (z. B. `B/01–B/04`) gilt: `CLAIM` → Arbeit → Self-Check → `LOG`.

### Phase 4 – Review (C, Reviewer)
C prüft alle Screens gegen die Checkliste unten. A prüft die Screens von C. Findings gehen als Thread an den Owner, mit Frame-ID und Checklisten-Punkt. Nur der Owner ändert seine Screens.

## Checkliste (Definition of Done pro Screen)

- [ ] Keine Instanz zeigt auf die alte `Library`, keine Instanz ist gedetacht.
- [ ] Keine ungebundenen Fills, Strokes, Paddings, Gaps oder Radien (Prüfung per Plugin-Script, siehe unten).
- [ ] Jeder Text nutzt einen Text-Style. Limelight kommt nur in Logo, `Display` oder `H1` vor.
- [ ] Wiederkehrende Begriffe kommen aus `Content`, Beispieldaten aus `FACTS`.
- [ ] Kontrast AA eingehalten, keine Kombination Akzent auf Textfarbe.
- [ ] Icons stammen ausschliesslich aus `Icon` (Lucide). Fotos haben einen Eintrag in `Bildquellen`.
- [ ] Optionale Angaben, Fehler-, Leer- und Erfolgszustände sind visuell klar unterscheidbar (siehe Task-Seite).
- [ ] «Nicht geprüft»-Angaben sehen nicht verifiziert aus.
- [ ] Version-2-Funktionen sind weiterhin als «bald verfügbar» gekennzeichnet.
- [ ] Prototyp-Links führen auf `Screens`-Frames.
- [ ] Screenshot visuell geprüft: nichts überlappt, nichts wird abgeschnitten, Abstände folgen dem Raster.

**Token-Check (Plugin API, vor jedem LOG auf den eigenen Frames ausführen):**

```js
// Listet Nodes mit nicht an Variablen/Styles gebundenen Werten.
const FIELDS = ['paddingTop','paddingBottom','paddingLeft','paddingRight','itemSpacing',
  'topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius','strokeWeight'];
const pageOf = n => { while (n && n.type !== 'PAGE') n = n.parent; return n; };
async function check(frame) {
  const issues = [];
  for (const n of [frame, ...frame.findAll(() => true)]) {
    if (n.type === 'INSTANCE' && pageOf(await n.getMainComponentAsync())?.name === 'Library') issues.push([n.id, n.name, 'alte Library']);
    const bv = n.boundVariables || {};
    for (const f of FIELDS) if (f in n && typeof n[f] === 'number' && n[f] !== 0 && !bv[f]) issues.push([n.id, n.name, f]);
    for (const k of ['fills', 'strokes']) {
      const paints = n[k];
      if (Array.isArray(paints) && paints.some(p => p.type === 'SOLID' && !p.boundVariables?.color) && !n[k === 'fills' ? 'fillStyleId' : 'strokeStyleId']) issues.push([n.id, n.name, k]);
    }
    if (n.type === 'TEXT' && !n.textStyleId) issues.push([n.id, n.name, 'kein Text-Style']);
  }
  return issues;
}
```

## Nicht im Umfang

Dark Mode, Desktop- und Tablet-Breakpoints, neue Screens oder Flows sowie Änderungen an Inhalten und Abläufen der Wireframes. Fachliche Regeln (Storno, Gebühren usw.) bleiben offen und weiterhin als offen gekennzeichnet.

## Offene Fragen an die Menschen

- Formensprache (Radius/Elevation): wird mit dem Pilot entschieden (`ASK`).
- Soll die Wortmarke ein Bildzeichen bekommen, oder bleibt sie reine Typografie?
