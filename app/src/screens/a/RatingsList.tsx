import { EyeOff } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { AppBar } from '../../components/AppBar'
import { Rating, RatingSummary } from '../../components/Rating'
import { Zustand } from '../../components/Zustand'
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
  const given = useGivenRatings(session?.user.id)

  // The other side rated me for this trade → my rating about them is visible too.
  const ratedBack = new Set(received.map((r) => r.trade_id))
  const avg = received.length ? received.reduce((sum, r) => sum + r.stars, 0) / received.length : 0

  return (
    <>
      <AppBar title="Bewertungen" back />
      <main className="screen profile">
        <div className="segmented" role="tablist" aria-label="Bewertungen">
          {(['erhalten', 'abgegeben'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className="segmented__option text-label"
              onClick={() => setParams(t === 'erhalten' ? {} : { tab: t }, { replace: true })}
            >
              {t === 'erhalten' ? 'Erhalten' : 'Abgegeben'}
            </button>
          ))}
        </div>

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
              </li>
            ))}
          </ul>
        )}
      </main>
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
