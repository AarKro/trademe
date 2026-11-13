import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { PaymentMethod, Profile } from '../../lib/types'

export interface ProfileStats {
  rating_avg: number
  rating_count: number
}

export const paymentLabels: Record<PaymentMethod, string> = {
  twint: 'TWINT',
  karte: 'Karte',
  bar: 'Bar',
}

/** «Mitglied seit Nov. 2026» */
export const memberSince = (createdAt: string) =>
  `Mitglied seit ${new Date(createdAt).toLocaleDateString('de-CH', { month: 'short', year: 'numeric' })}`

/** Loads profiles + profile_stats for one user. `reload()` fetches again (e.g. after saving). */
export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<ProfileStats>({ rating_avg: 0, rating_count: 0 })
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).abortSignal(controller.signal).single<Profile>(),
      supabase
        .from('profile_stats')
        .select('rating_avg, rating_count')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .maybeSingle<ProfileStats>(),
    ]).then(([p, s]) => {
      if (controller.signal.aborted) return
      if (p.error) return setError('Profil konnte nicht geladen werden.')
      setProfile(p.data)
      if (s.data) setStats({ rating_avg: Number(s.data.rating_avg), rating_count: Number(s.data.rating_count) })
    })
    return () => controller.abort()
  }, [userId, version])

  return { profile, stats, error, reload: () => setVersion((v) => v + 1) }
}
