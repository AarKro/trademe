import { ChevronRight, Image as ImageIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppBar } from '../../components/AppBar'
import { Button } from '../../components/Button'
import { Segmented } from '../../components/Segmented'
import { StatusBadge } from '../../components/StatusBadge'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import type { Offer, Trade } from '../../lib/types'
import pip from './assets/pip.svg'
import pipShadow from './assets/pip-shadow.svg'
import pipGlint from './assets/pip-glint.svg'
import './MyTrades.css'

const selection = `
  id, client_id, helper_id, title, status, photo_urls, budget_chf,
  scheduled_at, completed_reported_at, created_at,
  client:profiles!trades_client_id_fkey(display_name),
  helper:profiles!trades_helper_id_fkey(display_name),
  offers(status)
` as const

type TradeRow = Pick<Trade,
  'id' | 'client_id' | 'helper_id' | 'title' | 'status' | 'photo_urls' |
  'budget_chf' | 'scheduled_at' | 'completed_reported_at' | 'created_at'
> & {
  client: { display_name: string } | null
  helper: { display_name: string } | null
  offers: { status: string }[]
}

const shortDate = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit' })
const appointment = new Intl.DateTimeFormat('de-CH', {
  weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
})
const francs = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 2 })

type SentOffer = Pick<Offer, 'id' | 'trade_id' | 'price_chf' | 'status'> & { trade: TradeRow | null }

async function loadTrades(userId: string, signal: AbortSignal) {
  const [own, offered] = await Promise.all([
    supabase.from('trades').select(selection).eq('client_id', userId).order('created_at', { ascending: false })
      .abortSignal(signal).overrideTypes<TradeRow[], { merge: false }>(),
    supabase.from('offers').select(`id, trade_id, price_chf, status, trade:trades(${selection})`)
      .eq('helper_id', userId).order('created_at', { ascending: false })
      .abortSignal(signal).overrideTypes<SentOffer[], { merge: false }>(),
  ])

  if (own.error) throw own.error
  if (offered.error) throw offered.error
  return { trades: own.data, offers: offered.data }
}

const offerLabels: Record<Offer['status'], string> = {
  offen: 'Offen',
  angenommen: 'Angenommen',
  abgelehnt: 'Abgelehnt',
  zurueckgezogen: 'Zurückgezogen',
}

function describeOffer(offer: SentOffer) {
  const trade = offer.trade
  const group = offer.status === 'angenommen' && trade?.status === 'vergeben' ? 'Handlung nötig'
    : offer.status === 'offen' || (offer.status === 'angenommen' && trade && !['abgeschlossen', 'storniert'].includes(trade.status))
      ? 'Laufend' : 'Abgeschlossen'
  return {
    id: offer.id,
    title: trade?.title ?? 'Auftrag nicht verfügbar',
    photo: trade?.photo_urls[0],
    // same badge look as «Meine Trades» (UX review #52): accepted offers show the trade status
    badge: offer.status === 'angenommen' && trade
      ? <StatusBadge status={trade.status} />
      : <span className={`status-badge status-badge--${offer.status === 'offen' ? 'offen' : 'storniert'} text-label`}>{offer.status === 'offen' ? 'Angebot offen' : offerLabels[offer.status]}</span>,
    group,
    meta: 'Dein Angebot CHF ' + francs.format(offer.price_chf),
    next: group === 'Handlung nötig' ? 'Auftrag ansehen' : '',
    href: '/auftraege/' + offer.trade_id,
  }
}

function describeTrade(trade: TradeRow) {
  const openOffers = trade.offers.filter(({ status }) => status === 'offen').length
  const date = trade.scheduled_at ? new Date(trade.scheduled_at) : null
  const price = 'CHF ' + francs.format(trade.budget_chf)
  const person = trade.helper?.display_name
  const review = trade.status === 'zur_bestaetigung'
  const compare = trade.status === 'offen' && openOffers > 0
  const done = trade.status === 'abgeschlossen' || trade.status === 'storniert'
  const group = review || compare ? 'Handlung nötig' : done ? 'Abgeschlossen' : 'Laufend'
  const meta = trade.status === 'offen'
    ? [openOffers === 1 ? '1 Angebot' : openOffers + ' Angebote', 'Budget ' + price]
    : [person, date && shortDate.format(date), 'Budget ' + price]
  let next = ''

  if (review) {
    next = 'Abschluss prüfen'
    if (trade.completed_reported_at) {
      const release = new Date(Date.parse(trade.completed_reported_at) + 10 * 24 * 60 * 60 * 1000)
      next += ' · bis ' + shortDate.format(release)
    }
  } else if (compare) {
    next = 'Angebote vergleichen'
  } else if (trade.status === 'vergeben' && date) {
    next = 'Termin ' + appointment.format(date)
  }

  return {
    id: trade.id, title: trade.title, photo: trade.photo_urls[0], badge: <StatusBadge status={trade.status} />,
    group, meta: meta.filter(Boolean).join(' · '), next, href: '/trades/' + trade.id,
  }
}

const sections = ['Handlung nötig', 'Laufend', 'Abgeschlossen'] as const

type LoadState = { kind: 'loading' | 'error' } | { kind: 'ready'; trades: TradeRow[]; offers: SentOffer[] }

export function MyTrades() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const userId = session?.user.id
  const [view, setView] = useState<'trades' | 'offers'>('trades')
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    loadTrades(userId, controller.signal).then(
      (result) => { if (!controller.signal.aborted) setState({ kind: 'ready', ...result }) },
      () => { if (!controller.signal.aborted) setState({ kind: 'error' }) },
    )
    return () => controller.abort()
  }, [userId, attempt])

  const entries = state.kind === 'ready'
    ? view === 'trades' ? state.trades.map(describeTrade) : state.offers.map(describeOffer)
    : []
  const isEmpty = state.kind === 'ready' && entries.length === 0

  return (
    <>
      <AppBar title="Trades" />
      <main className="screen my-trades">
        <Segmented label="Ansicht" value={view} onChange={setView}
          options={[{ value: 'trades', label: 'Meine Trades' }, { value: 'offers', label: 'Meine Angebote' }]} />
        {state.kind === 'loading' && <p role="status" className="text-body">Trades werden geladen …</p>}
        {state.kind === 'error' && (
          <>
            <p role="alert" className="text-body">Deine Trades konnten nicht geladen werden.</p>
            <Button variant="secondary" onClick={() => {
              setState({ kind: 'loading' })
              setAttempt((value) => value + 1)
            }}>Erneut versuchen</Button>
          </>
        )}
        {isEmpty && view === 'offers' && <p className="text-body">Du hast noch keine Angebote gesendet.</p>}
        {isEmpty && view === 'trades' && (
          <>
            <div className="my-trades__empty-state">
              <div className="my-trades__pip" aria-hidden="true">
                <img src={pipShadow} alt="" />
                <img src={pip} alt="" />
                <img src={pipGlint} alt="" />
                <img src={pipGlint} alt="" />
              </div>
              <h2 className="text-h2">Noch keine Trades</h2>
              <p className="text-body text-secondary">Beschreib, wobei du Hilfe brauchst – Angebote kommen meist innert 24 h.</p>
            </div>
            <Button onClick={() => navigate('/erstellen')}>Trade erstellen</Button>
          </>
        )}
        {sections.map((heading) => {
          const rows = entries.filter(({ group }) => group === heading)
          if (!rows.length) return null
          return (
            <section className="my-trades__section" key={heading}>
              <h2 className="text-h3">{heading}</h2>
              <ul>
                {rows.map(({ id, title, photo, badge, meta, next, href }) => (
                  <li key={id}>
                    <Link className="my-trades__row" to={href}>
                      {photo
                        ? <img className="my-trades__photo" src={photo} alt="" loading="lazy" />
                        : <span className="my-trades__photo"><ImageIcon aria-hidden /></span>}
                      <div className="my-trades__copy">
                        {badge}
                        <h3 className="text-body-strong">{title}</h3>
                        <p className="text-caption text-secondary">{meta}</p>
                        {next && <p className="text-label text-accent">{next}</p>}
                      </div>
                      <ChevronRight className="my-trades__chevron" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </main>
    </>
  )
}
