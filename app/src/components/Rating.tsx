import { Star } from 'lucide-react'
import { formatRating } from '../lib/format'
import './Rating.css'

const STARS = [1, 2, 3, 4, 5]

// Figma: Rating 151:236 · 0–5 stars, filled = color/rating/filled, empty = outline.
// Always show the value as text too (see RatingSummary). Pass onChange to make it an input (A/12, B/09).
export function Rating({ value, onChange }: { value: number; onChange?: (stars: number) => void }) {
  const filled = Math.round(value)

  if (!onChange) {
    return (
      <span className="rating" role="img" aria-label={`${value} von 5 Sternen`}>
        {STARS.map((n) => (
          <Star key={n} className={n <= filled ? 'rating__star--filled' : 'rating__star'} aria-hidden />
        ))}
      </span>
    )
  }

  return (
    <span className="rating rating--input" role="radiogroup" aria-label="Bewertung">
      {STARS.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === filled}
          aria-label={n === 1 ? '1 Stern' : `${n} Sterne`}
          className="rating__button"
          onClick={() => onChange(n)}
        >
          <Star className={n <= filled ? 'rating__star--filled' : 'rating__star'} aria-hidden />
        </button>
      ))}
    </span>
  )
}

// The small rating line used in Summary-Card, Offer-Card and profiles: ★ 4,8 · 12 Bewertungen
export function RatingSummary({ avg, count }: { avg: number; count: number }) {
  return (
    <span className="rating-summary text-caption text-secondary">
      <Star className="rating-summary__star rating__star--filled" aria-hidden />
      {count === 0
        ? 'Noch keine Bewertungen'
        : `${formatRating(avg)} · ${count} ${count === 1 ? 'Bewertung' : 'Bewertungen'}`}
    </span>
  )
}
