import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { PaymentMethod, Profile } from '../../lib/types'

export interface ProfileStats {
  rating_avg: number
  rating_count: number
  trades_done: number
}

export const paymentLabels: Record<PaymentMethod, string> = {
  twint: 'TWINT',
  karte: 'Karte',
  bar: 'Bar',
}

/** «Mitglied seit Nov. 2026» */
export const memberSince = (createdAt: string) => `Mitglied seit ${monthYear(createdAt)}`

/** Loads profiles + profile_stats for one user. `reload()` fetches again (e.g. after saving). */
export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<ProfileStats>({ rating_avg: 0, rating_count: 0, trades_done: 0 })
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).abortSignal(controller.signal).single<Profile>(),
      supabase
        .from('profile_stats')
        .select('rating_avg, rating_count, trades_done')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .maybeSingle<ProfileStats>(),
    ]).then(([p, s]) => {
      if (controller.signal.aborted) return
      if (p.error) return setError('Profil konnte nicht geladen werden.')
      setProfile(p.data)
      if (s.data)
        setStats({
          rating_avg: Number(s.data.rating_avg),
          rating_count: Number(s.data.rating_count),
          trades_done: Number(s.data.trades_done),
        })
    })
    return () => controller.abort()
  }, [userId, version])

  return { profile, stats, error, reload: () => setVersion((v) => v + 1) }
}

export interface RatingRow {
  id: string
  stars: number
  comment: string | null
  created_at: string
  author: { id: string; display_name: string } | null
  trade: { title: string } | null // null when the viewer may not read that trade (RLS)
}

/** Ratings about one user, newest first. */
export function useRatings(subjectId: string | undefined) {
  const [ratings, setRatings] = useState<RatingRow[]>([])

  useEffect(() => {
    if (!subjectId) return
    const controller = new AbortController()
    supabase
      .from('ratings')
      .select(
        'id, stars, comment, created_at, author:profiles!ratings_author_id_fkey(id, display_name), trade:trades(title)',
      )
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false })
      .abortSignal(controller.signal)
      .overrideTypes<RatingRow[], { merge: false }>()
      .then(({ data }) => {
        if (!controller.signal.aborted && data) setRatings(data)
      })
    return () => controller.abort()
  }, [subjectId])

  return ratings
}

/** «Okt. 2026» */
export const monthYear = (date: string) =>
  new Date(date).toLocaleDateString('de-CH', { month: 'short', year: 'numeric' })

/** First word of a display name: «Lea M.» → «Lea» */
export const firstName = (name: string) => name.split(/\s+/)[0] || name
