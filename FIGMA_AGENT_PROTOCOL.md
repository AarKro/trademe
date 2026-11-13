> **Für Menschen – so nutzt du diese Datei (2 Minuten)**
> 1. Datei speichern, z. B. als `FIGMA_AGENT_PROTOCOL.<deinname>.md`.
> 2. Unter **Setup → Personal** bei *Your human* deinen Vornamen eintragen (Ersetze `DEIN NAME HIER`). Sonst nichts ändern – Zeitzone bleibt CET.
> 3. Deinem Agent (Claude Code, Codex, …) sagen: *„Arbeite nach FIGMA_AGENT_PROTOCOL.<deinname>.md."*
> 4. Was du als Mensch tun musst, findest du in Figma auf der Seite `🤖 Agent Log` ganz links im Frame **07 Human Inbox** (rote Einträge = offen).
>
> Neu in Version 2: Human Inbox, besser lesbare Log-Einträge (fett, farbig nach Agent und Status), Agents prüfen das Log selbst einmal pro Minute, gemeinsame Beispieldaten (FACTS).

# Shared Figma File: Agent Protocol

Protocol version: **2** (2026-11-06). If `00 Rules` in the file shows an older version, the coordinator replaces its text with a summary of this version.

## Setup (humans fill this in before handing the file to their agent)

**Shared: the same for everyone. Fill in once before sharing.**
- Figma file: https://www.figma.com/design/dETgmOrzpSrCUgGTq8XBj5/TradeMe
- Task page: `📋 Task`, the page in the Figma file that describes the task. If it has been renamed, look for a page with "Task" in its name. If you still can't tell, ask your human.
- Timezone for all timestamps: CET (Central European Time; CEST during summer time)
- A claim or check-in counts as stale after: 2 h
- Session deadline (optional): e.g. `15:35`. Agents plan reply-by times and scope around it.
- Language of log entries: the language of the task page (here: German). This protocol stays in English.

**Personal: each human fills in their own copy.**
- Your human: **DEIN NAME HIER** ← *(hier deinen Vornamen eintragen)*

## Who you are
You are an agent working for the human named under *Your human* in Setup. You share this Figma file with two other agents (three in total) and their humans. The other agents may be different AI tools, not the same model as you.

Each agent goes by a tag: A, B or C. You pick yours when you check in (see *Picking your tag*). The tag belongs to your human, so you keep it in later sessions.

The other agents can't see your conversation. They only know what you put in the Figma file, mostly on the `🤖 Agent Log` page. If it isn't in the log, the others don't know it happened.

Humans read the log too, but they skim it. Write every entry so a human can tell in two seconds who did what and whether they need to act (see *Formatting*).

Roles (who owns which page or section, and who owns the shared library) are **not** set in this file. The agents agree on them and store them in Figma in `01 Team` (see *Role setup*). Read your role from there.

---

## Three rules people broke most often
1. **Timestamps come from the clock, never from your head.** Read the system time (e.g. `date '+%Y-%m-%d %H:%M'`) right before you write any timestamp. If you can't read a clock, ask your human. Never estimate, round up or reuse an earlier time.
2. **New entries go on top.** Insert with `parent.insertChild(0, frame)`, never `appendChild`. The only exception is `01 Team`.
3. **Anything a human must do goes into `07 Human Inbox`**, not only into a thread (see *Human Inbox*).

---

## The Agent Log page

The page `🤖 Agent Log` holds eight top-level frames. If any are missing, create them with exactly these names. Place `07 Human Inbox` **leftmost**, before `00 Rules`, so humans see it first.

| Frame            | Purpose                                                              |
|------------------|----------------------------------------------------------------------|
| `07 Human Inbox` | Everything a human needs to decide, answer or do. One item per request, linked to its thread. |
| `00 Rules`       | Short summary of this protocol, with its version. Don't edit it (coordinator updates it on a version change). |
| `01 Team`        | Agreed roles (`ROLE`) and shared example data (`FACTS`). Kept across sessions. |
| `02 Check-ins`   | Who is connected right now, and how they understood the task.       |
| `03 Claims`      | What each agent is working on right now.                             |
| `04 Log`         | Record of finished work, newest on top.                              |
| `05 Threads`     | Questions, proposals, handoffs and FYIs between agents.              |
| `06 Decisions`   | Rules the humans agreed on. Everyone must follow them.               |

Every entry is its own small frame (vertical auto layout) inside its parent frame. **Insert new entries at the top** (index 0). The exception is `01 Team`: `ROLE` cards sorted A, B, C, then the `FACTS` card. **Name each entry frame in the structured format below**, so agents can scan layer names without reading every text node:

| Type     | Frame name format                                             | Example                                                  |
|----------|---------------------------------------------------------------|----------------------------------------------------------|
| Ask      | `ASK \| <from> \| <open/done> \| <subject>`                   | `ASK \| A \| open \| OK für Änderung an C/02?`           |
| Role     | `ROLE \| <tag> \| <role name>`                                | `ROLE \| A \| Design system lead`                        |
| Facts    | `FACTS \| <topic>`                                            | `FACTS \| Beispieldaten & Formate`                       |
| Check-in | `HI \| <tag> \| <online/offline> \| <YYYY-MM-DD HH:MM>`       | `HI \| A \| online \| 2026-11-06 14:00`                  |
| Claim    | `CLAIM \| <tag> \| <target> \| <YYYY-MM-DD HH:MM>`            | `CLAIM \| A \| Checkout/Payment \| 2026-11-06 14:20`     |
| Log      | `LOG \| <tag> \| <YYYY-MM-DD HH:MM> \| <title>`               | `LOG \| A \| 2026-11-06 14:55 \| Payment form rebuilt`   |
| Thread   | `T \| <from>→<to> \| <status> \| <subject>`                   | `T \| A→B \| open \| Card grid spacing`                  |
| Decision | `DEC-<nnn> \| <topic>`                                        | `DEC-004 \| Spacing scale`                               |

Thread status is one of `open`, `answered` or `resolved`. A thread addressed to several agents stays `open` until **every** addressee has replied; only then set `answered`. Decision numbers go up by one from the highest existing number.

Keep the log page plain apart from the formatting below. Don't do design work on it.

### Formatting (so humans can skim)

Every entry frame has **two text nodes**:
1. **Header**, Inter Bold 13: `<TYPE> · <tag> · <HH:MM> — <short title>`, e.g. `LOG · A · 15:28 — Übersicht ergänzt`. For threads: `THREAD · A→C · OPEN — Feed als Startscreen`.
2. **Body**, Inter Regular 12, one field per line as `Label: value`. **Each label including its colon is Inter Bold**, the value stays Regular. Keep values to one or two lines. Put node IDs in parentheses at the end: `(node 62:2)`.

The frame shows **who** with a 4 px left stroke and **what state** with its fill:

| Agent stripe (left stroke, 4 px) | Colour        |
|----------------------------------|---------------|
| A                                | `#2F6FEB` blue   |
| B                                | `#8A4FFF` purple |
| C                                | `#1F9D55` green  |

| State                                              | Frame fill  |
|----------------------------------------------------|-------------|
| `ASK` open (a human must act)                      | `#FFE4E1` light red |
| Thread `open`, claim                               | `#FFF7D6` light yellow |
| Thread `answered`                                  | `#E8F0FE` light blue |
| Check-in `online`                                  | `#E6F6EC` light green |
| Thread `resolved`, `ASK` done, check-in `offline`  | `#F2F2F2` light grey |
| Log, role, facts, decision                         | `#FFFFFF` white |

When the state changes, update the frame name, the header and the fill together.

Reusable snippet (Figma Plugin API; works for any agent that can run plugin code):

```js
// lines: [['Changed', '…'], ['Where', '…'], …]
async function addEntry(parentId, name, header, lines, { tagColor, fill = {r:1,g:1,b:1}, index = 0 } = {}) {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
  const parent = await figma.getNodeByIdAsync(parentId);
  const f = figma.createAutoLayout('VERTICAL', { name, itemSpacing: 6, paddingTop: 10, paddingBottom: 10, paddingLeft: 12, paddingRight: 12 });
  f.fills = [{ type: 'SOLID', color: fill }];
  if (tagColor) { f.strokes = [{ type: 'SOLID', color: tagColor }]; f.strokeTopWeight = f.strokeRightWeight = f.strokeBottomWeight = 0; f.strokeLeftWeight = 4; }
  parent.insertChild(index, f); f.layoutSizingHorizontal = 'FILL';
  const h = figma.createText(); h.fontName = { family: 'Inter', style: 'Bold' }; h.fontSize = 13; h.characters = header;
  f.appendChild(h); h.textAutoResize = 'HEIGHT'; h.layoutSizingHorizontal = 'FILL';
  const b = figma.createText(); b.fontName = { family: 'Inter', style: 'Regular' }; b.fontSize = 12;
  b.characters = lines.map(([k, v]) => `${k}: ${v}`).join('\n');
  let i = 0;
  for (const [k, v] of lines) { b.setRangeFontName(i, i + k.length + 1, { family: 'Inter', style: 'Bold' }); i += k.length + 2 + v.length + 1; }
  f.appendChild(b); b.textAutoResize = 'HEIGHT'; b.layoutSizingHorizontal = 'FILL';
  return f.id;
}
```

Replies in threads are extra text nodes under `— Replies —`, formatted the same way: the prefix `B · 15:22:` in Bold, the reply in Regular.

### Entry templates (header + body fields)

**Ask** (in `07 Human Inbox`, see *Human Inbox*)
```
ASK · A · 15:31 — OK für Änderung an C/02?
For: Fazli (or: any human)
Needs: decision | approval | info | action
Question: Darf A den Feed in C/02 bauen, solange C offline ist?
Options: 1) C baut ihn beim nächsten Check-in (empfohlen) · 2) A baut ihn jetzt
Blocking: yes – Feed wartet · Reply by: 15:35
Thread: T | A→C | open | Feed als Startscreen (node 62:2)
— Answer —
```

**Role**
```
ROLE · A — Design system lead
Agent: A (Aaron)
Agreed: 2026-11-06 14:30 by A, B, C
Owns: page `Library` (variables, styles, components); section `A/Profil` on page `Wireframes`
Does: builds and maintains tokens and components; checks how others use the library
Doesn't: build screens
Also: coordinator (see Role setup)
```

**Facts** (one card, owned by the coordinator, changed only via a thread to `@ALL`)
```
FACTS — Beispieldaten & Formate
Personas: Auftraggebende = Sandra K. · Helfende = Lea M.
Example: Kleiderschrank aufbauen · Zürich, Kreis 4 · Sa, 14.11. 10:00–12:00 · CHF 120
Format: Mobile 390×844 · Graustufen · Inter
Frame names: <tag>/<nn> <Name> · numbers A 10–29, B 01–09 + 30–49, C 50–69
```

**Check-in**
```
HI · A · 14:00 — online
Agent: A (Aaron) · Tool: Claude Code (Claude Opus 5.5)
Connected: 2026-11-06 14:00
Task (1 line): Redesign listing detail page, desktop + mobile, using the existing library
Can: read + write Figma, take screenshots, check every minute
Role: Design system lead (from 01 Team) | none yet
```

**Claim**
```
CLAIM · A · 14:20 — Payment Form
Target: Checkout / Payment Form (node 123:456)
Intent: Rebuild form layout using the new Input component
Expected: ~30 min
```

**Log**
```
LOG · A · 14:55 — Payment form rebuilt
Changed: Rebuilt Payment Form with Input/Default instances; 16px vertical rhythm
Where: Checkout / Payment Form (node 123:456)
Why: Old form used detached rectangles; now consistent with library
Affects others: @B Listing Card uses the same price style — unchanged, FYI only
Open: Error state still missing (next task)
```

**Thread**
```
THREAD · A→B · OPEN — Card grid spacing on mobile
Type: question | proposal | handoff | FYI
Body: Listing cards overflow at 375px (node 789:12). Reduce gutter from 24 → 16?
Reply by: 15:10
If no answer: I won't change anything in your section; will ask my human.
— Replies —
B · 16:10: Agreed, I'll change it in my section.
```

**Decision** (record one only after the humans have agreed. Agents can propose decisions but can't make them)
```
DEC-004 — Spacing scale
Agreed: 2026-11-06 by Aaron, Sam, Jo
Rule: Spacing uses the 4px scale variables only (space/4 … space/64)
Why: Three agents produced inconsistent paddings
```

---

## Human Inbox

`07 Human Inbox` is the one place a human checks to see whether they need to do something. It holds only requests a human must act on, never plain FYIs.

- **Whenever you address `@HUMANS` or a specific human** in a thread, also add an `ASK` item to `07 Human Inbox` (template above) and tell your own human in one line. The thread stays the place for discussion; the `ASK` is the extract with a link back (`Thread:` with frame name and node ID).
- Typical asks: questions about the task page, approval to edit another agent's area, a decision to record in `06 Decisions`, a stuck role setup, an owner who went offline with work open, open business rules from the end-of-session summary.
- One request per `ASK`. Say exactly what answer you need, offer options with your recommendation first, and state whether you are blocked.
- Humans answer by typing under `— Answer —`, in the thread, or by telling their agent. The agent that asked records the answer under `— Answer —` (with the human's name), sets the item to `done` (name, header, grey fill) and replies in the thread.
- Never delete `ASK` items. Only the asking agent changes its own items.

---

## Background check (every minute)

Each agent keeps watching the log on its own, so nobody has to wait for a human to nudge it.

1. **Right after you check in**, set up a recurring check **once a minute**. In Claude Code use `/loop 1m …` or a cron job `* * * * *`; in other tools use their scheduler. One minute is the shortest interval most schedulers allow, so don't promise faster checks. If your tool can't schedule at all, check after every work step and tell your human that you can't watch in the background. Write `check every minute` (or why not) under `Can:` in your check-in.
2. **Each check is cheap.** Read only the frame **names** of `02 Check-ins`, `03 Claims`, `04 Log`, `05 Threads`, `07 Human Inbox` and `01 Team`. Open the text only of entries that are new or whose name changed since your last check. Re-read the task page every ~10 minutes, or right away when a human says it changed.
3. **Something is new for you** if:
   - a thread addressed to you or `ALL` is `open` and has no reply from you yet;
   - a human answered one of your `ASK` items;
   - an agent you were waiting for checked in (e.g. for role setup) or went offline;
   - a `ROLE`, `FACTS` or `DEC` entry changed;
   - a log entry mentions you (`@A`) or the area you own;
   - the task page changed.
4. **If something is new**, handle it with the normal workflow (*Before every task* onward). **If nothing is new**, do nothing: no log entry, no thread, at most one short line to your human.
5. **Stop the check** when you set your check-in to `offline`.

---

## Workflow

### 0. Start of every session: check in
1. Read the task page in full. It may be written in any form: text, sticky notes, frames, comments or screenshots. Agents never edit the task page. Ask questions about it in a thread to `@HUMANS` plus an `ASK`.
2. Open the Figma file and go to `🤖 Agent Log`. Create any missing frames. If `00 Rules` shows an older protocol version, tell the coordinator (or, if you are the coordinator, update it).
3. **Pick your tag and post your check-in** in `02 Check-ins` (see *Picking your tag* below). First delete your own older check-in, so there is one per agent.
4. **Start your background check** (see above).
5. Read `02 Check-ins`. An agent is **present** if its check-in is `online` and less than 2 h old. Tell your human straight away, in one line: *"Connected as A. Present: A, B. Waiting for: C."*
6. Compare the other agents' one-line task summaries with yours. If they clearly contradict each other, open `T | <you>→ALL | open | Task understanding` and sort it out before role setup. If you can't agree, add an `ASK` and tell your human.
7. Read `01 Team`.
   - **Roles are there:** that's your role. Go on to *Before every task*. You may work in your own area even if another agent isn't present yet. Don't hand off work to an agent that isn't present, or wait on one.
   - **`01 Team` is empty:** go to *Role setup*. This needs all three agents present.
8. Still waiting for someone? Your background check will notice when they arrive. If nobody arrives within about 15 minutes, tell your human who is missing.

**Picking your tag**
1. **Already have one?** Look for your human's name in `01 Team` and `02 Check-ins`, including `offline` check-ins. If you find it, reuse that tag.
2. **New here?** Take the first free letter, in the order A, B, C. A letter is taken if any `ROLE` card or check-in, `online` or `offline`, already uses it.
3. **Check for a clash.** About 10 seconds after you post, re-read `02 Check-ins`. If another check-in has the same tag, the earlier `Connected` time keeps it. If both are in the same minute, the human whose name comes first alphabetically keeps it. The other agent deletes its check-in and goes back to step 2.
4. **All three taken by other humans?** Don't check in. Tell your human.

Tell your human which tag you got.

### 1. Before every task
1. Skim the task page for changes since you last read it. If something changed that affects your work or the roles, open a thread to `@ALL`. Then read `03 Claims`, the 10 newest entries in `04 Log`, all of `06 Decisions`, the `FACTS` card, your open `ASK` items, and every thread in `05 Threads` that is addressed to you or `ALL` and still `open`.
2. Answer any threads addressed to you that you can answer. If one needs a decision from your human, tell them before you start.
3. Check that nobody else has claimed your target or anything inside it. If someone has, **don't touch it**. Tell your human, and open a thread if useful.
4. Post your claim. A claim covers single frames or components, never "the whole page". One claim may list a short batch you'll do next (e.g. `B/01–B/04`, about 30 min of work), so the claims list stays readable.

### 2. While working
- **Only edit inside the area your `ROLE` card says you own**, or nodes you created yourself. Prefix your new layer names with your tag, e.g. `A/Payment Form`, and follow the frame numbering in `FACTS`.
- **Use the shared example data from `FACTS`** (names, prices, dates, formats). If you need a value that isn't there, propose it in a thread to the coordinator instead of inventing your own.
- **Read a node's current state right before you change it.** Another agent may have changed it a minute ago. Never write from an old snapshot.
- Work in small, focused steps. Don't run bulk find-and-replace or edits across several pages.
- **Never delete, move, rename, restyle or "fix" nodes owned by another agent**, even if they look obviously wrong, and even if your human asked for the change. Send the request to the owner as a `proposal` thread. If the owner is offline, add an `ASK` so the humans can decide.
- **The shared library is read-only** unless your role owns it. Use its variables, styles and components. Don't make local copies of shared tokens and don't detach instances. If you need something new, open a `proposal` thread addressed to the library owner.
- Follow `06 Decisions`. If you think a decision is wrong, propose a change in a thread and keep following the current rule until the humans change it.
- If a task runs long, update the timestamp on your claim so it doesn't look abandoned.

### 3. After every task
1. Add a log entry to `04 Log` (at index 0, with the time read from the clock).
2. **Delete your claim frame.** Never leave stale claims behind.
3. Open threads for handoffs, open questions, and anything that affects another agent's area. Add an `ASK` for anything a human must do.
4. Give your human a 1–3 line summary: what you logged, which threads are open, and whether an `ASK` waits for them.

### 4. End of session
1. **Before you leave, handle your open threads.** Answer every thread addressed to you, or reply `going offline – not handled` so the sender knows. Don't leave a question unanswered without saying so.
2. Set your check-in to `offline` (frame name, header and fill) and stop your background check.
3. The **coordinator** goes offline last if it can. It writes the end-of-session summary as a `FYI` thread to `@HUMANS` (what exists, where, what is open) and adds one `ASK` per item a human still has to act on.

---

## Role setup (the agents decide this themselves)

The humans don't hand out roles. The three agents agree on them and write them to `01 Team`, and every later session reuses them. Roles are the one thing agents agree among themselves without a human decision. Humans can change them at any time.

**When to do it:** only when `01 Team` is empty, a human asks for new roles, or the task page has changed so much that the current roles don't fit it. Otherwise skip this section.

**Steps**
1. Wait until all three agents are present (see step 0.5) and agree on what the task is (step 0.6).
2. **A drafts the proposal within 5 minutes** of all three being present. A is the first agent to arrive, and it is always A who drafts, so that three agents don't propose at once. A opens `T | A→ALL | open | Role proposal`, with one block per agent in the *Role* template format, a draft `FACTS` card, and a `Reply by` time. **B and C don't open threads asking A to propose.** They wait for it (their background check will see it) and only nudge A if nothing appears within 5 minutes.
3. **B and C each reply once** in that thread: either `agree`, or one concrete change with a one-line reason.
4. If anyone asked for changes, A posts a revised proposal as a reply, and B and C reply again. There are at most two rounds. If there's still no agreement, add an `ASK`, tell your human, and stop.
5. When A, B and C have all replied `agree` to the same version, **A** writes the three `ROLE` frames and the `FACTS` card into `01 Team` and marks the thread `resolved`.
6. **If the roles name pages or sections that don't exist yet, the coordinator creates them right away** (empty, named exactly as in the roles) and logs `Struktur angelegt` with their node IDs. Owners start building once that log entry exists. The library owner logs `Library bereit` as soon as the first usable components exist, so screen builders know when to switch to instances.
7. Every agent updates the Role line of its check-in and tells its human its role in one line.

**What makes a good split**
- Base it on the task page. Split by **area of the file** (pages, sections, flows), not by activity on the same frames. No node has two owners.
- Every page or section the task touches has exactly one owner. Name pages and top-level frames exactly.
- Exactly one agent owns the shared library.
- Match roles to what each agent wrote under "Can" in its check-in. For example, an agent that can't write to Figma gets a review role.
- One agent also acts as **coordinator**, on top of its main role. The coordinator keeps the log page tidy (it recreates missing frames but never edits other agents' entries), maintains `FACTS` and `00 Rules`, follows up on unanswered threads, keeps `07 Human Inbox` complete (it adds an `ASK` when another agent forgot one, citing that agent's thread), and writes the end-of-session summary.
- If the task doesn't suggest a better split, start from this one:

  | Role                         | Owns                                   | Does                                                         |
  |------------------------------|----------------------------------------|--------------------------------------------------------------|
  | Design system lead           | Library page (variables, styles, components) | Builds and maintains components and tokens; handles library proposals |
  | Screens builder              | First half of the task's flows/pages   | Builds screens from library components                       |
  | Screens builder + reviewer   | Second half of the flows/pages         | Builds screens; checks finished frames against the task page, `FACTS` and the library, and reports issues as threads |

**Changing roles later, or a new round of work:** open a `proposal` thread to `@ALL` (e.g. `Runde 2: Aufgaben`), listing tasks per agent inside its existing area. Change roles only when the other two agree. After the first setup, each agent edits only its own `ROLE` frame.

---

## How to communicate
- **Assume the reader has no context.** They may be another AI tool reading this hours later. Name exact nodes, with node IDs where possible.
- **Be brief.** Explain your reasoning in 1–3 sentences, not paragraphs.
- **Address people explicitly:** `@A`, `@B`, `@C`, `@ALL`, or `@HUMANS` when a person needs to decide (and then also add an `ASK`).
- **Reply inside the existing thread frame.** Add a text node under "— Replies —" and update the status in the frame name, header and fill. Only the agent who asked marks a thread `resolved`.
- **Give a reply-by time** when you need an answer, especially near a session deadline.
- **Never edit or delete another agent's entries**, apart from adding replies in threads. If you made a mistake in your own entry (e.g. a wrong timestamp), fix it in place and keep the content honest.
- **Silence is not consent.** If you get no answer, don't make the change outside your area. Do other work, or stop and tell your human.
- Write a proposal as: *what you want to change → why → effect on others → what happens if nobody answers*.

---

## Conflicts and surprises
- **Something you made has been changed by someone else:** don't revert it. Open a thread to the likely author (or `@ALL`) and tell your human.
- **Two claims overlap:** the earlier timestamp wins. The later agent removes its claim and opens a thread.
- **A claim looks abandoned** (older than 2 h with no matching log activity): don't remove it. Open a thread to its owner and tell your human.
- **The owner of an area you need went offline:** don't edit their area. Leave your request as a thread and add an `ASK` so a human can reach the owner or approve an exception.
- **Two check-ins use the same tag:** settle it with step 3 of *Picking your tag*. If it still isn't clear, both agents stop and tell their humans.
- **The log page structure is broken:** recreate any missing parent frames, but never rewrite or delete existing entries.

## Ask your human first before you
- Edit anything outside your area.
- Delete more than a handful of nodes, or any page, section or component.
- Change the shared library (unless your role owns it).
- Reverse or ignore a decision.
- Act on an assumption you'd have to explain as "I assumed that…".
