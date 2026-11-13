import { Calendar, MapPin, Wallet } from 'lucide-react'
import { Avatar } from './Avatar'
import { VerifiedTag } from './HinweisTag'
import { RatingSummary } from './Rating'
import './SummaryCard.css'

// Figma: Summary-Card «Vereinbarung» 423:537 · identical everywhere: person, date, place, payment, amount.
// Helpers see the net amount after the 4 % fee (pass amountLabel="Auszahlung" + the net amount).
export interface SummaryPerson {
  name: string
  avatarUrl?: string | null
  ratingAvg: number
  ratingCount: number
  isVerified: boolean
}

export function SummaryCard({
  person,
  date,
  place,
  payment,
  amount,
  amountLabel = 'Vereinbart',
}: {
  person: SummaryPerson
  date: string
  place: string
  payment?: string
  amount: string
  amountLabel?: string
}) {
  return (
    <section className="summary-card">
      <div className="summary-card__person">
        <Avatar name={person.name} src={person.avatarUrl} size="md" />
        <div className="summary-card__name">
          <p className="text-body-strong">{person.name}</p>
          <RatingSummary avg={person.ratingAvg} count={person.ratingCount} />
        </div>
        <VerifiedTag verified={person.isVerified} />
      </div>
      <hr className="summary-card__divider" />
      <p className="summary-card__row text-body">
        <Calendar aria-hidden />
        {date}
      </p>
      <p className="summary-card__row text-body">
        <MapPin aria-hidden />
        {place}
      </p>
      {payment && (
        <p className="summary-card__row text-body">
          <Wallet aria-hidden />
          {payment}
        </p>
      )}
      <hr className="summary-card__divider" />
      <div className="summary-card__amount">
        <span className="text-label text-secondary">{amountLabel}</span>
        <span className="text-numeric">{amount}</span>
      </div>
    </section>
  )
}
