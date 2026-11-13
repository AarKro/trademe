import { Check, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppBar } from '../../components/AppBar'
import { Avatar } from '../../components/Avatar'
import { BottomSheet } from '../../components/BottomSheet'
import { HinweisTag } from '../../components/HinweisTag'
import { Rating } from '../../components/Rating'
import { formatRating } from '../../lib/format'
import type { Profile } from '../../lib/types'
import {
  firstName,
  memberSince,
  monthYear,
  paymentLabels,
  useProfile,
  useRatings,
  type ProfileStats,
  type RatingRow,
} from './profileData'
import './Profile.css'

// A/10 Profil – Helfende Person (447:5378) + A/10b «Geprüft» erklärt (453:4148).
export function PublicProfile() {
  const { userId } = useParams()
  const { profile, stats, error } = useProfile(userId)
  const ratings = useRatings(userId)

  return (
    <>
      <AppBar title="Profil" back />
      <main className="screen profile">
        {error && <p className="text-body">Dieses Profil gibt es nicht (mehr).</p>}
        {profile && (
          <>
            <div className="profile__head">
              <Avatar name={profile.display_name} src={profile.avatar_url} size="lg" />
              <div className="profile__head-text">
                <h2 className="text-h2">{profile.display_name}</h2>
                {stats.rating_count > 0 ? (
                  <span className="profile__rating">
                    <Rating value={stats.rating_avg} />
                    <span className="text-caption text-secondary">
                      {formatRating(stats.rating_avg)} · {stats.rating_count}
                    </span>
                  </span>
                ) : (
                  <span className="text-caption text-secondary">Noch keine Bewertungen</span>
                )}
                <p className="text-caption text-secondary">
                  {[
                    profile.location,
                    stats.trades_done > 0
                      ? `${stats.trades_done} ${stats.trades_done === 1 ? 'Trade' : 'Trades'} erledigt`
                      : memberSince(profile.created_at),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </div>

            <Verification profile={profile} stats={stats} />

            {profile.skills.length > 0 && (
              <section className="profile__section">
                <div className="profile__section-head">
                  <h2 className="text-h3">Fähigkeiten</h2>
                  <span className="text-caption text-tertiary">Angaben von {firstName(profile.display_name)}</span>
                </div>
                <ul className="chips">
                  {profile.skills.map((skill) => (
                    <li key={skill} className="chip text-label">
                      {skill}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {profile.bio && (
              <section className="profile__section">
                <h2 className="text-h3">Über {firstName(profile.display_name)}</h2>
                <p className="text-body">{profile.bio}</p>
              </section>
            )}

            <section className="profile__section">
              <h2 className="text-h3">Akzeptiert</h2>
              <p className="text-body">
                {profile.accepted_payment_methods.map((m) => paymentLabels[m]).join(' · ') || '–'}
              </p>
            </section>

            <Ratings ratings={ratings} />
          </>
        )}
      </main>
    </>
  )
}

/** Green box for «Geprüft», neutral box for «Nicht geprüft»; «Was heisst das?» opens the criteria (A/10b). */
function Verification({ profile, stats }: { profile: Profile; stats: ProfileStats }) {
  const [open, setOpen] = useState(false)
  const verified = profile.is_verified
  const reliability =
    stats.rating_count > 0
      ? `Zuverlässig: ${stats.trades_done} Trades, Ø ${formatRating(stats.rating_avg)}, kein Streitfall`
      : 'Zuverlässig: kein Streitfall'

  return (
    <section className={`profile-check ${verified ? 'profile-check--verified' : ''}`}>
      <button className="profile-check__head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <HinweisTag typ={verified ? 'geprueft' : 'nicht-geprueft'} />
        <span className="text-label text-accent">{open ? 'Schliessen ▴' : 'Was heisst das? ▾'}</span>
      </button>
      {open &&
        (verified ? (
          <ul className="profile-check__list">
            {['Identität per ID-Scan bestätigt', 'Zahlungsmittel verifiziert', reliability].map((text) => (
              <li key={text} className="text-caption">
                <Check aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-caption">
            Die Angaben stammen von {firstName(profile.display_name)} selbst und wurden von TradeMe nicht geprüft.
            Bezahlst du mit TWINT oder Karte, hält TradeMe das Geld bis zur Freigabe zurück.
          </p>
        ))}
    </section>
  )
}

function Ratings({ ratings }: { ratings: RatingRow[] }) {
  const [all, setAll] = useState(false)

  if (ratings.length === 0) {
    return (
      <section className="profile__section">
        <h2 className="text-h3">Bewertungen</h2>
        <p className="text-caption text-secondary">Noch keine Bewertungen.</p>
      </section>
    )
  }

  return (
    <>
      <button className="profile-rating-card" onClick={() => setAll(true)}>
        <span className="profile-rating-card__text">
          <RatingEntry rating={ratings[0]} />
          <span className="text-label text-accent">
            {ratings.length === 1 ? 'Alle Bewertungen' : `Alle ${ratings.length} Bewertungen`}
          </span>
        </span>
        <ChevronRight className="profile-progress__chevron" aria-hidden />
      </button>
      <BottomSheet
        open={all}
        title={`${ratings.length} ${ratings.length === 1 ? 'Bewertung' : 'Bewertungen'}`}
        onClose={() => setAll(false)}
      >
        <ul className="profile-rating-list">
          {ratings.map((r) => (
            <li key={r.id}>
              <RatingEntry rating={r} />
            </li>
          ))}
        </ul>
      </BottomSheet>
    </>
  )
}

function RatingEntry({ rating }: { rating: RatingRow }) {
  return (
    <>
      <span className="profile-rating-card__author">
        <span className="text-label">{rating.author?.display_name ?? 'Jemand'}</span>
        <Rating value={rating.stars} />
        <span className="text-caption text-secondary">
          {[rating.trade?.title, monthYear(rating.created_at)].filter(Boolean).join(' · ')}
        </span>
      </span>
      {rating.comment && <span className="text-body">{rating.comment}</span>}
    </>
  )
}
