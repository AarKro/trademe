import { Rating } from '../../components/Rating'
import { monthYear, type RatingRow } from './profileData'
import './Profile.css'

/** One rating: author, stars, trade · month, comment. Used in A/10, A/15 and the ratings list. */
export function RatingEntry({ rating }: { rating: RatingRow }) {
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
