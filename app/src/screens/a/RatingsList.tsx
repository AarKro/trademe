import { EyeOff } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { BottomSheet } from '../../components/BottomSheet'
import { AppBar } from '../../components/AppBar'
import { Rating, RatingSummary } from '../../components/Rating'
import { Segmented } from '../../components/Segmented'
import { Zustand } from '../../components/Zustand'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { firstName, monthYear, useGivenRatings, useRatings, type GivenRatingRow } from './profileData'
import { RatingEntry } from './RatingEntry'
import './Profile.css'

const HIDDEN_DAYS = 14 // same rule as rating_is_public() in the database (#13)

type Tab = 'erhalten' | 'abgegeben'

// A-4 · /profil/bewertungen – received and given ratings. ?tab=abgegeben opens the second tab.
export function RatingsList() {
  const { session } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'abgegeben' ? 'abgegeben' : 'erhalten'
  const received = useRatings(session?.user.id)
  const [revision, setRevision] = useState(0)
  const given = useGivenRatings(session?.user.id, revision)
  const pending = useRef(false)
  const [mode, setMode] = useState<{ action: 'edit' | 'delete'; rating: GivenRatingRow } | null>(null)
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  function open(action: 'edit' | 'delete', rating: GivenRatingRow) {
    setStars(rating.stars)
    setComment(rating.comment ?? '')
    setFailed(false)
    setMode({ action, rating })
  }

  async function save() {
    if (!mode || pending.current) return
    pending.current = true
    setBusy(true)
    setFailed(false)
    try {
      const { error } = mode.action === 'edit'
        ? await supabase.rpc('edit_own_rating', { p_rating_id: mode.rating.id, p_stars: stars, p_comment: comment })
        : await supabase.rpc('delete_own_rating', { p_rating_id: mode.rating.id })
      if (error) throw error
      setMode(null)
      setRevision((value) => value + 1)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
      pending.current = false
    }
  }

  // The other side rated me for this trade → my rating about them is visible too.
  const ratedBack = new Set(received.map((r) => r.trade_id))
  const avg = received.length ? received.reduce((sum, r) => sum + r.stars, 0) / received.length : 0

  return (
    <>
      <AppBar title="Bewertungen" back />
      <main className="screen profile">
        <Segmented
          label="Bewertungen"
          options={[
            { value: 'erhalten', label: 'Erhalten' },
            { value: 'abgegeben', label: 'Abgegeben' },
          ]}
          value={tab}
          onChange={(t) => setParams(t === 'erhalten' ? {} : { tab: t }, { replace: true })}
        />

        {given === null ? null : tab === 'erhalten' ? (
          received.length === 0 ? (
            <Zustand
              mascot="plaudi"
              title="Noch keine Bewertungen"
              text="Nach einem abgeschlossenen Trade bewertet ihr euch gegenseitig. Du siehst die Bewertung, sobald du selbst bewertet hast."
            />
          ) : (
            <>
              <RatingSummary avg={avg} count={received.length} />
              <ul className="profile-rating-list">
                {received.map((r) => (
                  <li key={r.id}>
                    <RatingEntry rating={r} />
                  </li>
                ))}
              </ul>
            </>
          )
        ) : given.length === 0 ? (
          <Zustand
            mascot="plaudi"
            title="Noch nichts bewertet"
            text="Nach einem abgeschlossenen Trade kannst du die andere Person bewerten."
          />
        ) : (
          <ul className="profile-rating-list">
            {given.map((r) => (
              <li key={r.id}>
                <GivenEntry rating={r} hidden={!ratedBack.has(r.trade_id) && !olderThan(r.created_at, HIDDEN_DAYS)} />
                <div className="profile-rating-card__actions">
                  <Button variant="text" onClick={() => open('edit', r)}>Bearbeiten</Button>
                  <Button variant="text" onClick={() => open('delete', r)}>Löschen</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomSheet open={mode !== null} title={mode?.action === 'edit' ? 'Bewertung bearbeiten' : 'Bewertung löschen?'}
        onClose={() => { if (!busy) setMode(null) }}>
        {mode?.action === 'edit' ? (
          <fieldset className="profile-rating-edit" disabled={busy}>
            <Rating value={stars} onChange={setStars} />
            <label className="field text-label">Kommentar (optional)
              <textarea value={comment} maxLength={1000} onChange={(event) => setComment(event.target.value)} />
            </label>
          </fieldset>
        ) : <p className="text-body">Deine Bewertung für diesen Trade wird gelöscht.</p>}
        {failed && <p className="text-body" role="alert">Die Änderung konnte nicht gespeichert werden. Versuche es erneut.</p>}
        <Button disabled={busy} onClick={() => void save()}>{mode?.action === 'edit' ? 'Änderungen speichern' : 'Bewertung löschen'}</Button>
        <Button disabled={busy} variant="text" onClick={() => setMode(null)}>Abbrechen</Button>
      </BottomSheet>
    </>
  )
}

function GivenEntry({ rating, hidden }: { rating: GivenRatingRow; hidden: boolean }) {
  const name = rating.subject?.display_name ?? 'Jemand'
  return (
    <>
      <span className="profile-rating-card__author">
        {rating.subject ? (
          <Link to={`/profil/${rating.subject.id}`} className="text-label text-accent">
            {name}
          </Link>
        ) : (
          <span className="text-label">{name}</span>
        )}
        <Rating value={rating.stars} />
        <span className="text-caption text-secondary">
          {[rating.trade?.title, monthYear(rating.created_at)].filter(Boolean).join(' · ')}
        </span>
      </span>
      {rating.comment && <span className="text-body">{rating.comment}</span>}
      {hidden && (
        <span className="profile-rating-hidden text-caption">
          <EyeOff aria-hidden />
          Noch verdeckt · sichtbar, sobald {firstName(name)} dich auch bewertet hat, spätestens am{' '}
          {visibleFrom(rating.created_at)}
        </span>
      )}
    </>
  )
}

const olderThan = (date: string, days: number) => Date.now() - Date.parse(date) > days * 24 * 60 * 60 * 1000

/** «04.12.2026» – the day a hidden rating becomes public at the latest */
const visibleFrom = (date: string) =>
  new Date(Date.parse(date) + HIDDEN_DAYS * 24 * 60 * 60 * 1000).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
