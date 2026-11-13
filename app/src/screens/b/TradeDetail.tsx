import { Calendar, CircleCheck, Clock, Image as ImageIcon, ShieldQuestion, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppBar } from '../../components/AppBar'
import { Button } from '../../components/Button'
import { StatusBadge } from '../../components/StatusBadge'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import type { Offer, Profile, Trade } from '../../lib/types'
import loopi from './assets/loopi.svg'
import './TradeDetail.css'

type OpenOffer = Pick<Offer, 'id' | 'helper_id' | 'price_chf' | 'proposed_at' | 'message'> & {
  helper: Pick<Profile, 'display_name' | 'avatar_url' | 'is_verified'> | null
}
type Rating = { id: string; rating_avg: number; rating_count: number }
type Detail = { trade: Trade; offers: OpenOffer[]; ratings: Rating[] }

const currency = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 2 })
const date = new Intl.DateTimeFormat('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit' })
const time = new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit' })
const ratingNumber = new Intl.NumberFormat('de', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const steps = ['Angebot', 'Zahlung', 'Ausführung', 'Freigabe', 'Bewertung']

async function loadDetail(tradeId: string, userId: string, signal: AbortSignal): Promise<Detail | null> {
  const { data: trade, error } = await supabase.from('trades').select('*')
    .eq('id', tradeId).eq('client_id', userId).abortSignal(signal).maybeSingle<Trade>()
  if (error) throw error
  if (!trade) return null
  if (trade.status !== 'offen') return { trade, offers: [], ratings: [] }

  const { data: offers, error: offerError } = await supabase.from('offers')
    .select('id, helper_id, price_chf, proposed_at, message, helper:profiles!offers_helper_id_fkey(display_name, avatar_url, is_verified)')
    .eq('trade_id', trade.id).eq('status', 'offen').order('created_at').order('id')
    .abortSignal(signal).overrideTypes<OpenOffer[], { merge: false }>()
  if (offerError) throw offerError
  if (!offers.length) return { trade, offers, ratings: [] }

  const { data: ratings, error: ratingError } = await supabase.from('profile_stats')
    .select('id, rating_avg, rating_count').in('id', offers.map((offer) => offer.helper_id))
    .abortSignal(signal).overrideTypes<Rating[], { merge: false }>()
  if (ratingError) throw ratingError
  return { trade, offers, ratings }
}

function OfferCard({ offer, rating, tradeId, first }: {
  offer: OpenOffer
  rating?: Rating
  tradeId: string
  first: boolean
}) {
  const navigate = useNavigate()
  const name = offer.helper?.display_name || 'Helfende Person'
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => [...word][0]).join('').toUpperCase()
  const verified = offer.helper?.is_verified
  const proposed = offer.proposed_at ? new Date(offer.proposed_at) : null
  const checkout = '/trades/' + tradeId + '/checkout?' + new URLSearchParams({ offerId: offer.id })
  const chat = '/chat/' + tradeId + '/' + offer.helper_id
  const count = rating?.rating_count ?? 0
  const accept = <Button variant={first ? 'primary' : 'secondary'} onClick={() => navigate(checkout)}>Annehmen</Button>
  const chatButton = <Button variant="secondary" onClick={() => navigate(chat)}>Zum Chat</Button>

  return (
    <article className="trade-detail__offer">
      <div className="card trade-detail__offer-card">
        <div className="trade-detail__offer-header">
          <Link className="trade-detail__person" to={'/profil/' + offer.helper_id}>
            {offer.helper?.avatar_url
              ? <img className="trade-detail__avatar" src={offer.helper.avatar_url} alt="" />
              : <span aria-hidden="true" className="trade-detail__avatar text-label">{initials}</span>}
            <span>
              <span className="text-body-strong">{name}</span>
              <span className="trade-detail__rating text-caption text-secondary">
                <Star aria-hidden />{count && rating
                  ? ratingNumber.format(rating.rating_avg) + ' · ' + count + (count === 1 ? ' Bewertung' : ' Bewertungen')
                  : 'Neu'}
              </span>
            </span>
          </Link>
          <p className="text-numeric">CHF {currency.format(offer.price_chf)}</p>
        </div>
        <div className="trade-detail__meta text-caption text-secondary">
          <span className={'trade-detail__tag' + (verified ? ' trade-detail__tag--verified' : '')}>
            {verified ? <CircleCheck aria-hidden /> : <ShieldQuestion aria-hidden />}
            {verified ? 'Geprüft' : 'Nicht geprüft'}
          </span>
          {proposed && <span><Calendar aria-hidden />{date.format(proposed)} · {time.format(proposed)}</span>}
        </div>
        {offer.message && <p className="text-body text-secondary trade-detail__message">{offer.message}</p>}
        {!first && <div className="trade-detail__actions">{accept}{chatButton}</div>}
      </div>
      {first && <div className="trade-detail__actions">{accept}{chatButton}</div>}
    </article>
  )
}

function WaitingForOffers({ trade }: { trade: Trade }) {
  const [shareMessage, setShareMessage] = useState('')
  const details = [
    trade.scheduled_at && date.format(new Date(trade.scheduled_at)),
    trade.is_remote ? 'Überall' : trade.location,
    'Budget CHF ' + currency.format(trade.budget_chf),
  ].filter(Boolean).join(' · ')

  async function share() {
    const url = new URL('/auftraege/' + trade.id, window.location.origin).href
    try {
      if (navigator.share) {
        await navigator.share({ title: trade.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareMessage('Link kopiert.')
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setShareMessage(url)
    }
  }

  return (
    <>
      <p className="trade-detail__online text-label"><CircleCheck aria-hidden />Dein Trade ist online</p>
      <div className="trade-detail__summary">
        {trade.photo_urls[0]
          ? <img className="trade-detail__thumbnail" src={trade.photo_urls[0]} alt="" />
          : <span className="trade-detail__thumbnail"><ImageIcon aria-hidden /></span>}
        <div>
          <h2 className="text-h3">{trade.title}</h2>
          <p className="text-caption text-secondary">{details}</p>
        </div>
      </div>
      <div className="trade-detail__timeline">
        <ol aria-label="Fortschritt">
          {steps.map((step, index) => (
            <li key={step} className="text-caption" aria-current={index === 0 ? 'step' : undefined}>
              <span aria-hidden />{step}
            </li>
          ))}
        </ol>
        <p className="text-label"><Clock aria-hidden />Angebote kommen meist innert 24 h</p>
      </div>
      <div className="trade-detail__waiting">
        <img src={loopi} alt="" width="160" height="160" />
        <h2 className="text-h2">Noch keine Angebote</h2>
        <p className="text-body text-secondary">Wir benachrichtigen dich, sobald jemand helfen möchte.</p>
        <button className="text-label" type="button" onClick={share}>Trade teilen</button>
        {shareMessage && <p className="text-caption" role="status">{shareMessage}</p>}
      </div>
    </>
  )
}

export function TradeDetail() {
  const { tradeId } = useParams()
  const { session } = useAuth()
  if (!tradeId || !session) return null
  return <TradeDetailContent key={session.user.id + '/' + tradeId} tradeId={tradeId} userId={session.user.id} />
}

function TradeDetailContent({ tradeId, userId }: { tradeId: string; userId: string }) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<Detail | null | 'loading' | 'error'>('loading')

  useEffect(() => {
    const controller = new AbortController()
    void loadDetail(tradeId, userId, controller.signal).then(
      (detail) => { if (!controller.signal.aborted) setState(detail) },
      () => { if (!controller.signal.aborted) setState('error') },
    )
    return () => controller.abort()
  }, [tradeId, userId, attempt])

  const detail = typeof state === 'object' ? state : null
  const waiting = detail?.trade.status === 'offen' && detail.offers.length === 0
  return (
    <>
      <AppBar back title={waiting ? 'Mein Trade' : detail?.trade.title ?? 'Mein Trade'} />
      <main className="screen trade-detail">
        {state === 'loading' && <p className="text-body" role="status">Trade wird geladen …</p>}
        {state === 'error' && (
          <>
            <p className="text-body" role="alert">Der Trade konnte nicht geladen werden.</p>
            <Button variant="secondary" onClick={() => {
              setState('loading')
              setAttempt((previous) => previous + 1)
            }}>Erneut versuchen</Button>
          </>
        )}
        {state === null && <p className="text-body">Dieser Trade ist für dich nicht verfügbar.</p>}
        {waiting && <WaitingForOffers trade={detail.trade} />}
        {detail && detail.trade.status !== 'offen' && (
          <StatusBadge status={detail.trade.status} />
        )}
        {detail && detail.offers.length > 0 && (
          <section className="trade-detail__offers" aria-label="Angebote">
            <p className="text-caption text-secondary">{detail.trade.title} · Budget CHF {currency.format(detail.trade.budget_chf)}</p>
            {detail.offers.map((offer, index) => (
              <OfferCard key={offer.id} offer={offer} rating={detail.ratings.find(({ id }) => id === offer.helper_id)}
                first={index === 0} tradeId={detail.trade.id} />
            ))}
          </section>
        )}
      </main>
    </>
  )
}
