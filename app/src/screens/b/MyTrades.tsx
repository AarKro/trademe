import { ChevronRight, Image as ImageIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppBar } from '../../components/AppBar'
import { Button } from '../../components/Button'
import { StatusBadge } from '../../components/StatusBadge'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import type { Trade } from '../../lib/types'
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

async function loadTrades(userId: string, signal: AbortSignal): Promise<TradeRow[]> {
  const [own, offered] = await Promise.all([
    supabase.from('trades').select(selection).or(`client_id.eq.${userId},helper_id.eq.${userId}`).abortSignal(signal),
    supabase.from('offers').select(`trade:trades!inner(${selection})`)
      .eq('helper_id', userId).eq('status', 'offen').eq('trade.status', 'offen').abortSignal(signal),
  ])

  if (own.error) throw own.error
  if (offered.error) throw offered.error

  const trades = new Map<string, TradeRow>()
  for (const trade of own.data as unknown as TradeRow[]) trades.set(trade.id, trade)
  for (const { trade } of offered.data as unknown as { trade: TradeRow }[]) trades.set(trade.id, trade)
  return [...trades.values()].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
}

function describeTrade(trade: TradeRow, userId: string) {
  const isClient = trade.client_id === userId
  const openOffers = trade.offers.filter(({ status }) => status === 'offen').length
  const date = trade.scheduled_at ? new Date(trade.scheduled_at) : null
  const price = 'CHF ' + francs.format(trade.budget_chf)
  const person = isClient ? trade.helper?.display_name : trade.client?.display_name
  const review = isClient && trade.status === 'zur_bestaetigung'
  const compare = isClient && trade.status === 'offen' && openOffers > 0
  const done = trade.status === 'abgeschlossen' || trade.status === 'storniert'
  const group = review || compare ? 'Handlung nötig' : done ? 'Abgeschlossen' : 'Laufend'
  const meta = trade.status === 'offen'
    ? [isClient ? (openOffers === 1 ? '1 Angebot' : openOffers + ' Angebote') : 'Angebot gesendet', 'Budget ' + price]
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

  return { group, meta: meta.filter(Boolean).join(' · '), next, href: (isClient ? '/trades/' : '/auftraege/') + trade.id }
}

const sections = ['Handlung nötig', 'Laufend', 'Abgeschlossen'] as const

type LoadState = { kind: 'loading' | 'error' } | { kind: 'ready'; trades: TradeRow[] }

export function MyTrades() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const userId = session?.user.id
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    loadTrades(userId, controller.signal).then(
      (trades) => { if (!controller.signal.aborted) setState({ kind: 'ready', trades }) },
      () => { if (!controller.signal.aborted) setState({ kind: 'error' }) },
    )
    return () => controller.abort()
  }, [userId, attempt])

  const entries = state.kind === 'ready' && userId
    ? state.trades.map((trade) => ({ trade, ...describeTrade(trade, userId) }))
    : []
  const isEmpty = state.kind === 'ready' && entries.length === 0

  return (
    <>
      <AppBar title={entries.length ? 'Trades' : 'Meine Trades'} />
      <main className={`screen my-trades${isEmpty ? ' my-trades--empty' : ''}`}>
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
        {isEmpty && (
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
                {rows.map(({ trade, meta, next, href }) => (
                  <li key={trade.id}>
                    <Link className="my-trades__row" to={href}>
                      {trade.photo_urls[0]
                        ? <img className="my-trades__photo" src={trade.photo_urls[0]} alt="" loading="lazy" />
                        : <span className="my-trades__photo"><ImageIcon aria-hidden /></span>}
                      <div className="my-trades__copy">
                        <StatusBadge status={trade.status} />
                        <h3 className="text-body-strong">{trade.title}</h3>
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
