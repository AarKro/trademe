import { Calendar, ChevronRight, ExternalLink, MapPin, Tag, Wallet } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ActionBar } from '../../components/ActionBar'
import { AppBar } from '../../components/AppBar'
import { Avatar } from '../../components/Avatar'
import { BottomSheet } from '../../components/BottomSheet'
import { Button } from '../../components/Button'
import { StatusTimeline } from '../../components/StatusTimeline'
import { SummaryCard } from '../../components/SummaryCard'
import { Toast } from '../../components/Toast'
import { Zustand } from '../../components/Zustand'
import { useAuth } from '../../lib/auth'
import { formatWanted } from '../../lib/format'
import { supabase } from '../../lib/supabase'
import { timelineStep } from '../../lib/timeline'
import type { OfferStatus, PaymentMethod, PaymentStatus, Profile, Trade, TradeAddress } from '../../lib/types'
import './HelperTradeDetail.css'

// C/03–C/09 · Auftrag-Detail for helpers. One template for all states (UX review #53):
// title → timeline with deadline → agreement / facts → address → client, and a sticky
// Action-Bar with max. 1 primary + 1 secondary action. Term for helpers: «Auftrag».

const chf = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 2 })
const chfCents = new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dayTime = new Intl.DateTimeFormat('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const dayMonth = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit' })

const paymentLabel: Record<PaymentMethod, string> = { twint: 'TWINT', karte: 'Karte', bar: 'Bar vor Ort' }

interface OwnOffer {
  id: string
  price_chf: number
  proposed_at: string | null
  status: OfferStatus
}

interface Payment {
  amount_chf: number
  payout_chf: number
  method: PaymentMethod
  status: PaymentStatus
}

interface Stats {
  rating_avg: number
  rating_count: number
}

export function HelperTradeDetail() {
  const { tradeId } = useParams()
  const { session } = useAuth()
  if (!tradeId || !session) return null
  return <HelperTradeDetailContent key={`${tradeId}/${session.user.id}`} tradeId={tradeId} helperId={session.user.id} />
}

function HelperTradeDetailContent({ tradeId, helperId }: { tradeId: string; helperId: string }) {
  const navigate = useNavigate()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [client, setClient] = useState<Profile | null>(null)
  const [clientStats, setClientStats] = useState<Stats>({ rating_avg: 0, rating_count: 0 })
  const [ownOffer, setOwnOffer] = useState<OwnOffer | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [address, setAddress] = useState<TradeAddress | null>(null)
  const [rated, setRated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [price, setPrice] = useState('')
  const [message, setMessage] = useState('')
  const [proposedAt, setProposedAt] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      const { data } = await supabase.from('trades').select('*').eq('id', tradeId).maybeSingle<Trade>()
      if (!active) return
      if (!data) return setLoading(false)
      const [offer, profile, stats, tradeAddress, pay, rating] = await Promise.all([
        supabase.from('offers').select('id, price_chf, proposed_at, status').eq('trade_id', data.id).eq('helper_id', helperId).maybeSingle<OwnOffer>(),
        supabase.from('profiles').select('*').eq('id', data.client_id).maybeSingle<Profile>(),
        supabase.from('profile_stats').select('rating_avg, rating_count').eq('id', data.client_id).maybeSingle<Stats>(),
        supabase.from('trade_addresses').select('trade_id, street, zip, city').eq('trade_id', data.id).maybeSingle<TradeAddress>(),
        supabase.from('payments').select('amount_chf, payout_chf, method, status').eq('trade_id', data.id).maybeSingle<Payment>(),
        supabase.from('ratings').select('id').eq('trade_id', data.id).eq('author_id', helperId).maybeSingle(),
      ])
      if (!active) return
      setTrade(data)
      setOwnOffer(offer.data)
      setClient(profile.data)
      if (stats.data) setClientStats({ rating_avg: Number(stats.data.rating_avg), rating_count: Number(stats.data.rating_count) })
      setAddress(tradeAddress.data)
      setPayment(pay.data)
      setRated(Boolean(rating.data))
      setLoading(false)
    }
    void load()
    return () => {
      active = false
    }
  }, [helperId, tradeId])

  async function submitOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!trade || !price || busy) return
    setBusy(true)
    setError(null)
    const proposed = proposedAt ? new Date(proposedAt).toISOString() : null
    const { data, error: offerError } = await supabase
      .from('offers')
      .insert({ trade_id: trade.id, helper_id: helperId, price_chf: Number(price), proposed_at: proposed, message: message.trim() || null })
      .select('id, price_chf, proposed_at, status')
      .single<OwnOffer>()
    setBusy(false)
    if (offerError) {
      setError(offerError.code === '23505' ? 'Du hast für diesen Auftrag schon ein Angebot gemacht.' : 'Das Angebot konnte nicht gesendet werden.')
      return
    }
    setOwnOffer(data)
    setSheetOpen(false)
    setToast('Angebot gesendet')
  }

  async function withdrawOffer() {
    if (!ownOffer || busy) return
    setBusy(true)
    const { error: withdrawError } = await supabase.from('offers').update({ status: 'zurueckgezogen' }).eq('id', ownOffer.id)
    setBusy(false)
    if (withdrawError) return setError('Das Angebot konnte nicht zurückgezogen werden.')
    setOwnOffer({ ...ownOffer, status: 'zurueckgezogen' })
    setToast('Angebot zurückgezogen')
  }

  async function reportDone() {
    if (!trade || busy) return
    setBusy(true)
    const { error: reportError } = await supabase.rpc('report_done', { p_trade_id: trade.id })
    setBusy(false)
    if (reportError) return setError('Der Abschluss konnte nicht gemeldet werden.')
    setTrade({ ...trade, status: 'zur_bestaetigung', completed_reported_at: new Date().toISOString() })
    setToast('Abschluss gemeldet')
  }

  if (loading) return <AppBar back title="Auftrag" />

  if (!trade)
    return (
      <>
        <AppBar back title="Auftrag" />
        <main className="screen helper-detail">
          <Zustand
            mascot="loopi"
            title="Auftrag nicht verfügbar"
            text="Dieser Auftrag wurde gelöscht oder an jemand anderen vergeben."
          >
            <Button onClick={() => navigate('/entdecken')}>Zu Entdecken</Button>
          </Zustand>
        </main>
      </>
    )

  const clientName = client?.display_name || 'Auftraggebende Person'
  const firstName = clientName.split(/\s+/)[0]
  const chat = () => navigate(`/chat/${trade.id}/${helperId}`)
  const iAmHelper = trade.helper_id === helperId
  const offerOpen = trade.status === 'offen' && ownOffer?.status === 'offen'
  const offerEnded = ownOffer && (ownOffer.status === 'abgelehnt' || ownOffer.status === 'zurueckgezogen')
  const canOffer = trade.status === 'offen' && !ownOffer
  const lostToSomeoneElse = !iAmHelper && trade.status !== 'offen'
  const isCash = payment?.method === 'bar'

  // Completed: success moment with Loopi (Peak-End), like A/13
  if (iAmHelper && trade.status === 'abgeschlossen')
    return (
      <>
        <AppBar back title="Auftrag" />
        <main className="screen helper-detail">
          <Zustand
            mascot="loopi"
            title="Auftrag abgeschlossen"
            text={
              isCash
                ? `${trade.title} · bar vor Ort bezahlt (CHF ${chf.format(payment?.amount_chf ?? 0)})`
                : `${trade.title} · CHF ${chfCents.format(payment?.payout_chf ?? 0)} werden dir ausgezahlt`
            }
          >
            {rated ? (
              <p className="text-label text-secondary">Bewertung abgegeben · danke!</p>
            ) : (
              <Button onClick={() => navigate(`/trades/${trade.id}/bewerten`)}>{firstName} bewerten</Button>
            )}
            <Button variant="text" onClick={chat}>
              Chat öffnen
            </Button>
          </Zustand>
        </main>
      </>
    )

  const deadline = (() => {
    if (offerOpen) return `Wartet auf Antwort von ${firstName}`
    if (trade.status === 'vergeben' && trade.scheduled_at) return `Termin ${dayTime.format(new Date(trade.scheduled_at))}`
    if (trade.status === 'zur_bestaetigung' && trade.completed_reported_at) {
      const until = new Date(Date.parse(trade.completed_reported_at) + 10 * 24 * 60 * 60 * 1000)
      return `Freigabe bis ${dayMonth.format(until)} · sonst automatisch`
    }
    if (trade.status === 'problem') return 'Problem gemeldet · die Auszahlung ist pausiert'
    return undefined
  })()

  const showTimeline = (offerOpen || iAmHelper) && !offerEnded
  const place = trade.is_remote ? 'Remote / von überall' : address ? `${address.street}, ${address.zip} ${address.city}` : trade.location ?? 'Ort offen'

  return (
    <>
      <AppBar back title="Auftrag" />
      <main className="screen screen--with-action-bar helper-detail">
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        {error && (
          <p className="helper-detail__error text-caption" role="alert">
            {error}
          </p>
        )}

        {trade.photo_urls[0] && <img className="helper-detail__hero" src={trade.photo_urls[0]} alt="" />}
        <h2 className="text-h2">{trade.title}</h2>

        {offerEnded && (
          <div className="helper-detail__notice">
            <strong className="text-label">
              {ownOffer.status === 'abgelehnt' ? 'Dein Angebot wurde abgelehnt' : 'Du hast dein Angebot zurückgezogen'}
            </strong>
            <span className="text-caption">Danke für dein Interesse. In Entdecken warten andere Aufträge.</span>
          </div>
        )}
        {lostToSomeoneElse && !offerEnded && (
          <div className="helper-detail__notice">
            <strong className="text-label">An jemand anderen vergeben</strong>
            <span className="text-caption">Danke für dein Angebot. In Entdecken warten andere Aufträge.</span>
          </div>
        )}

        {showTimeline && <StatusTimeline step={timelineStep(trade.status, payment, rated)} deadline={deadline} />}

        {iAmHelper ? (
          <SummaryCard
            person={{
              name: clientName,
              avatarUrl: client?.avatar_url,
              ratingAvg: clientStats.rating_avg,
              ratingCount: clientStats.rating_count,
              isVerified: Boolean(client?.is_verified),
            }}
            date={trade.scheduled_at ? dayTime.format(new Date(trade.scheduled_at)) : formatWanted(trade.wanted_from, trade.wanted_until)}
            place={place}
            payment={payment ? paymentLabel[payment.method] : undefined}
            amount={
              isCash || !payment
                ? `CHF ${chf.format(payment?.amount_chf ?? ownOffer?.price_chf ?? trade.budget_chf)}`
                : `CHF ${chfCents.format(payment.payout_chf)}`
            }
            amountLabel={isCash || !payment ? 'Vereinbart' : 'Auszahlung nach 4 % Gebühr'}
          />
        ) : (
          <div className="helper-detail__facts text-body">
            <p>
              <Calendar aria-hidden />
              <span>Gewünscht: {formatWanted(trade.wanted_from, trade.wanted_until)}</span>
            </p>
            <p>
              <MapPin aria-hidden />
              <span>{trade.is_remote ? 'Remote / von überall' : trade.location ?? 'Ort offen'}</span>
            </p>
            <p>
              <Wallet aria-hidden />
              <span>
                {ownOffer ? `Dein Angebot CHF ${chf.format(ownOffer.price_chf)} · Budget CHF ${chf.format(trade.budget_chf)}` : `Budget CHF ${chf.format(trade.budget_chf)}`}
              </span>
            </p>
            {trade.tags.length > 0 && (
              <p>
                <Tag aria-hidden />
                <span className="helper-detail__tags">
                  {trade.tags.map((tag) => (
                    <span key={tag} className="text-caption">
                      {tag}
                    </span>
                  ))}
                </span>
              </p>
            )}
          </div>
        )}

        {iAmHelper && !trade.is_remote && address && (
          <a
            className="helper-detail__map-link text-label"
            href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(`${address.street}, ${address.zip} ${address.city}`)}`}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink aria-hidden /> Adresse in Karte öffnen
          </a>
        )}
        {iAmHelper && !trade.is_remote && !address && (
          <p className="helper-detail__notice text-caption">
            {isCash ? 'Die genaue Adresse wurde noch nicht erfasst. Frag im Chat nach.' : 'Die genaue Adresse siehst du, sobald die Zahlung hinterlegt ist.'}
          </p>
        )}

        {trade.description && <p className="text-body text-secondary">{trade.description}</p>}

        {!iAmHelper && (
          <Link className="helper-detail__client" to={`/profil/${trade.client_id}`}>
            <Avatar name={clientName} src={client?.avatar_url} size="md" />
            <span className="helper-detail__client-copy">
              <strong className="text-body-strong">{clientName}</strong>
              <span className="text-caption text-secondary">Auftraggebende Person</span>
            </span>
            <ChevronRight aria-hidden />
          </Link>
        )}
      </main>

      {canOffer && (
        <ActionBar>
          <Button onClick={() => setSheetOpen(true)}>Angebot machen</Button>
          <Button variant="text" onClick={chat}>
            Frage stellen
          </Button>
        </ActionBar>
      )}
      {offerOpen && (
        <ActionBar>
          <Button onClick={chat}>Chatten</Button>
          <Button variant="text" onClick={() => void withdrawOffer()} disabled={busy}>
            Angebot zurückziehen
          </Button>
        </ActionBar>
      )}
      {(offerEnded || lostToSomeoneElse) && (
        <ActionBar>
          <Button onClick={() => navigate('/entdecken')}>Andere Aufträge</Button>
        </ActionBar>
      )}
      {iAmHelper && trade.status === 'vergeben' && (
        <ActionBar hint="Melde den Abschluss, wenn alles erledigt ist.">
          <Button onClick={() => void reportDone()} disabled={busy}>
            Erledigt melden
          </Button>
          <Button variant="text" onClick={chat}>
            Chatten
          </Button>
        </ActionBar>
      )}
      {iAmHelper && (trade.status === 'zur_bestaetigung' || trade.status === 'problem') && (
        <ActionBar>
          <Button onClick={chat}>Chatten</Button>
        </ActionBar>
      )}

      <BottomSheet open={sheetOpen} title="Dein Angebot" onClose={() => setSheetOpen(false)}>
        <p className="text-body text-secondary">Schlage einen fairen Preis und einen passenden Termin vor.</p>
        <form onSubmit={submitOffer} className="helper-detail__form">
          <label className="field">
            <span className="text-label">Preis in CHF *</span>
            <input
              className="input"
              type="number"
              min="1"
              step="0.50"
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder={String(trade.budget_chf)}
              required
            />
          </label>
          <label className="field">
            <span className="text-label">Termin vorschlagen</span>
            <input className="input" type="datetime-local" value={proposedAt} onChange={(event) => setProposedAt(event.target.value)} />
          </label>
          <label className="field">
            <span className="text-label">
              Nachricht <span className="text-secondary">(optional)</span>
            </span>
            <textarea
              className="helper-detail__textarea"
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Z. B. «Habe Werkzeug und Erfahrung mit IKEA-Möbeln»"
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? 'Wird gesendet …' : 'Angebot senden'}
          </Button>
        </form>
      </BottomSheet>
    </>
  )
}
