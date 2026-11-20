// Hand-written row types matching supabase/migrations.
// Once the schema settles, replace with generated types:
//   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts

export type TradeStatus = 'offen' | 'vergeben' | 'zur_bestaetigung' | 'abgeschlossen' | 'problem' | 'storniert'
export type OfferStatus = 'offen' | 'angenommen' | 'abgelehnt' | 'zurueckgezogen'
export type PaymentMethod = 'twint' | 'karte' | 'bar'
export type PaymentStatus = 'offen' | 'hinterlegt' | 'fehlgeschlagen' | 'freigegeben' | 'erstattet'

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  location: string | null
  bio: string | null
  skills: string[]
  accepted_payment_methods: PaymentMethod[]
  is_verified: boolean
  /** Coarse home location for the map (rounded to ~1 km by the database) */
  home_lat: number | null
  home_lng: number | null
  home_label: string | null
  created_at: string
}

export interface Trade {
  id: string
  client_id: string
  helper_id: string | null
  title: string
  description: string | null
  category: string | null
  budget_chf: number
  is_remote: boolean
  location: string | null
  lat: number | null
  lng: number | null
  photo_urls: string[]
  /** When the client wants it done: from this point in time … */
  wanted_from: string
  /** … until this point in time. null = «ab wanted_from» */
  wanted_until: string | null
  /** Free tags for the filter in Entdecken */
  tags: string[]
  /** Payment methods the client accepts */
  payment_methods: PaymentMethod[]
  /** Appointment agreed through the accepted offer */
  scheduled_at: string | null
  status: TradeStatus
  completed_reported_at: string | null
  released_at: string | null
  created_at: string
}

export interface Offer {
  id: string
  trade_id: string
  helper_id: string
  price_chf: number
  proposed_at: string | null
  message: string | null
  status: OfferStatus
  created_at: string
}

/** Full address of a trade. The helper can read it only after payment (or with cash). */
export interface TradeAddress {
  trade_id: string
  street: string
  zip: string
  city: string
}

export type NotificationKind =
  | 'neues_angebot'
  | 'angebot_angenommen'
  | 'angebot_abgelehnt'
  | 'trade_geloescht'
  | 'erledigt_gemeldet'
  | 'erinnerung_tag7'
  | 'freigegeben'
  | 'bewerten'
  | 'problem_gemeldet'
  | 'storniert'
  | 'nachricht'
  | 'neue_bewertung'

export interface Notification {
  id: string
  user_id: string
  trade_id: string | null
  kind: NotificationKind
  body: string
  /** App route the notification opens, e.g. '/trades/<id>' or '/chat/<tradeId>/<helperId>' */
  link: string | null
  read_at: string | null
  created_at: string
}
