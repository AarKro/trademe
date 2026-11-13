// Every route of the app, mapped to the Figma frames on page «Screens V4» (447:2790).
// Several frames are *states* of one route (e.g. the trade detail changes with the trade status),
// and sheets (Bottom-Sheet pattern) live inside their parent route.
//
// Owners follow the Figma split: A = Profil & Bewertung, B = Auftraggebende, C = Helfende.
// When you build a screen, register its component in routes.tsx – the stub disappears.

export const FIGMA_FILE = 'dETgmOrzpSrCUgGTq8XBj5'
export const figmaUrl = (nodeId: string) =>
  `https://www.figma.com/design/${FIGMA_FILE}/TradeMe?node-id=${nodeId.replace(':', '-')}`

export interface ScreenDef {
  path: string
  title: string
  owner: 'A' | 'B' | 'C' | 'alle'
  tabRoot?: boolean
  frames: { id: string; name: string }[]
  note?: string
}

export const screens: ScreenDef[] = [
  // --- Tab roots ----------------------------------------------------------
  {
    path: '/entdecken',
    title: 'Entdecken',
    owner: 'C',
    tabRoot: true,
    frames: [
      { id: '447:4513', name: 'C/02 Entdecken – Karte' },
      { id: '447:4498', name: 'C/01 Entdecken – leer' },
    ],
    note: 'Karte: Leaflet + OpenStreetMap. Filter «Überall» = is_remote.',
  },
  {
    path: '/trades',
    title: 'Meine Trades',
    owner: 'B',
    tabRoot: true,
    frames: [
      { id: '447:2964', name: 'B/11 Meine Trades' },
      { id: '447:2976', name: 'B/12 Meine Trades – leer' },
    ],
    note: 'Flache Liste mit «Handlung nötig» oben. Zeigt auch Aufträge, bei denen ich helfe (helper_id).',
  },
  {
    path: '/erstellen',
    title: 'Trade erstellen',
    owner: 'B',
    tabRoot: true,
    frames: [
      { id: '447:2792', name: 'B/01 Trade erstellen' },
      { id: '447:2821', name: 'B/02 Pflichtfeldfehler' },
    ],
  },
  {
    path: '/chat',
    title: 'Chat',
    owner: 'C',
    tabRoot: true,
    frames: [],
    note: 'Chat-Liste ist in Figma noch offen (siehe Übersicht V4). Eine Zeile pro Trade + Gegenüber.',
  },
  {
    path: '/profil',
    title: 'Profil',
    owner: 'A',
    tabRoot: true,
    frames: [{ id: '447:5473', name: 'A/15 Eigenes Profil – Leer-Zustand' }],
  },

  // --- Trade (client view = B, helper view = C) -----------------------------
  {
    path: '/trades/:tradeId',
    title: 'Trade-Detail',
    owner: 'B',
    frames: [
      { id: '447:2832', name: 'B/03 Warten auf Angebote' },
      { id: '447:2848', name: 'B/03b Angebote eingegangen' },
      { id: '447:2901', name: 'B/06 Termin steht' },
      { id: '447:3033', name: 'B/06b Termin steht · Barzahlung (Toast)' },
      { id: '454:2961', name: 'B/06c Termin steht · Kreditkarte' },
      { id: '447:2915', name: 'B/07 Abschluss prüfen' },
      { id: '447:2990', name: 'B/14 Abschluss prüfen – Erinnerung Tag 7' },
      { id: '447:2934', name: 'B/08 Freigabe (Sheet)' },
      { id: '447:2954', name: 'B/09 Abgeschlossen – Bewertung inline' },
      { id: '447:3004', name: 'B/15 Problem melden (Sheet)' },
      { id: '447:3044', name: 'B/16 Meldung gesendet' },
    ],
    note: 'Client-Sicht. Zustand = trades.status. Freigabe: rpc release_trade · Problem: rpc report_problem.',
  },
  {
    path: '/auftraege/:tradeId',
    title: 'Auftrag',
    owner: 'C',
    frames: [
      { id: '447:4439', name: 'C/03 Trade-Detail' },
      { id: '447:4465', name: 'C/03b Angebot machen (Sheet)' },
      { id: '465:3174', name: 'C/03c Angebot · Termin wählen' },
      { id: '447:4548', name: 'C/07 Angebot gesendet' },
      { id: '447:4561', name: 'C/08 Auftrag erhalten' },
      { id: '447:4568', name: 'C/05 Termin steht' },
      { id: '447:4580', name: 'C/06 Wartet auf Freigabe' },
      { id: '447:4603', name: 'C/09 Abgeschlossen – Auszahlung' },
    ],
    note: 'Helfenden-Sicht. Angebot: insert into offers · Erledigt: rpc report_done.',
  },
  {
    path: '/trades/:tradeId/checkout',
    title: 'Vereinbarung & Zahlung',
    owner: 'B',
    frames: [
      { id: '447:2858', name: 'B/05 Vereinbarung & Zahlung' },
      { id: '447:2870', name: 'B/05b Zahlungsmethode (Sheet)' },
      { id: '454:2861', name: 'B/05c Checkout · Kreditkarte' },
      { id: '447:2982', name: 'B/13 Zahlung fehlgeschlagen' },
    ],
    note: 'rpc accept_offer(offer, method) → bei twint/karte POST /api/create-payment-intent (Stripe Testmodus).',
  },
  {
    path: '/trades/:tradeId/bewerten',
    title: 'Bewertung abgeben',
    owner: 'A',
    frames: [
      { id: '447:5423', name: 'A/11 Bewertung abgeben – Ausgang' },
      { id: '447:5438', name: 'A/12 Bewertung abgeben – Eingabe' },
      { id: '447:5452', name: 'A/13 Bewertung gesendet – Erfolg' },
      { id: '447:5458', name: 'A/14 Bewertung durch Helfende – Eingabe' },
    ],
  },
  {
    path: '/chat/:tradeId/:helperId',
    title: 'Chat',
    owner: 'C',
    frames: [{ id: '447:4528', name: 'C/04 Chat – Vereinbarung' }],
    note: 'Live über Supabase Realtime (Tabelle messages). sender_id = null → Systemnachricht.',
  },

  // --- Profile ----------------------------------------------------------------
  {
    path: '/profil/bearbeiten',
    title: 'Profil bearbeiten',
    owner: 'A',
    frames: [{ id: '447:5509', name: 'A/16 Eigenes Profil bearbeiten' }],
  },
  {
    path: '/profil/:userId',
    title: 'Profil',
    owner: 'A',
    frames: [
      { id: '447:5378', name: 'A/10 Profil – Helfende Person' },
      { id: '453:4148', name: 'A/10b Profil – Geprüft erklärt' },
    ],
  },
]
