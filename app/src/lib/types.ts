// Hand-written row types matching supabase/migrations.
// Once the schema settles, replace with generated types:
//   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts

export type TradeStatus = 'offen' | 'vergeben' | 'zur_bestaetigung' | 'abgeschlossen' | 'problem' | 'storniert'
export type OfferStatus = 'offen' | 'angenommen' | 'abgelehnt' | 'zurueckgezogen'
export type PaymentMethod = 'twint' | 'karte' | 'bar'

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  location: string | null
  bio: string | null
  skills: string[]
  accepted_payment_methods: PaymentMethod[]
  is_verified: boolean
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
