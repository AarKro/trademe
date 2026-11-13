import { useEffect, useState, type FormEvent } from 'react'
import { Calendar, ChevronRight, Image as ImageIcon, MapPin, Wallet } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { AppBar } from '../../components/AppBar'
import { Button } from '../../components/Button'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import type { Profile, Trade } from '../../lib/types'
import './HelperTradeDetail.css'

const currency = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 2 })
const date = new Intl.DateTimeFormat('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit' })
const time = new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit' })

function formatDate(value: string | null) {
  return value ? `${date.format(new Date(value))} · ${time.format(new Date(value))}` : 'Termin flexibel'
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => [...part][0]).join('').toUpperCase()
}

export function HelperTradeDetail() {
  const { tradeId } = useParams()
  const { session } = useAuth()
  if (!tradeId || !session) return null
  return <HelperTradeDetailContent key={`${tradeId}/${session.user.id}`} tradeId={tradeId} helperId={session.user.id} />
}

function HelperTradeDetailContent({ tradeId, helperId }: { tradeId: string; helperId: string }) {
  const [trade, setTrade] = useState<Trade | null>(null)
  const [client, setClient] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [price, setPrice] = useState('')
  const [message, setMessage] = useState('')
  const [proposedAt, setProposedAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [ownOffer, setOwnOffer] = useState<{ id: string; price_chf: number; proposed_at: string | null } | null>(null)
  const [payout, setPayout] = useState<number | null>(null)
  const [reportingDone, setReportingDone] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const { data, error: tradeError } = await supabase.from('trades').select('*').eq('id', tradeId).maybeSingle<Trade>()
      if (!active) return
      if (tradeError || !data) {
        setError('Dieser Trade konnte nicht geladen werden.')
        setLoading(false)
        return
      }
      setTrade(data)
      const { data: offer } = await supabase.from('offers').select('id, price_chf, proposed_at').eq('trade_id', data.id).eq('helper_id', helperId).maybeSingle<{ id: string; price_chf: number; proposed_at: string | null }>()
      if (active) setOwnOffer(offer)
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.client_id).maybeSingle<Profile>()
      if (data.status === 'abgeschlossen') {
        const { data: payment } = await supabase.from('payments').select('payout_chf').eq('trade_id', data.id).maybeSingle<{ payout_chf: number }>()
        if (active) setPayout(payment?.payout_chf ?? null)
      }
      if (active) {
        setClient(profile)
        setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [helperId, tradeId])

  async function submitOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!trade || !price || submitting) return
    setSubmitting(true)
    setError(null)
    const { error: offerError } = await supabase.from('offers').insert({
      trade_id: trade.id,
      helper_id: helperId,
      price_chf: Number(price),
      proposed_at: proposedAt ? new Date(proposedAt).toISOString() : null,
      message: message.trim() || null,
    })
    if (offerError) setError(offerError.code === '23505' ? 'Du hast für diesen Trade bereits ein Angebot gemacht.' : 'Das Angebot konnte nicht gesendet werden.')
    else {
      setSuccess(true)
      setSheetOpen(false)
    }
    setSubmitting(false)
  }

  async function reportDone() {
    if (!trade || reportingDone) return
    setReportingDone(true)
    const { error: reportError } = await supabase.rpc('report_done', { p_trade_id: trade.id })
    if (reportError) setError('Der Abschluss konnte nicht gemeldet werden.')
    else setTrade((current) => current ? { ...current, status: 'zur_bestaetigung', completed_reported_at: new Date().toISOString() } : current)
    setReportingDone(false)
  }

  if (loading) return <><AppBar back title="Trade" /><main className="screen helper-detail"><p className="text-body" role="status">Trade wird geladen …</p></main></>
  if (!trade) return <><AppBar back title="Trade" /><main className="screen helper-detail"><p className="text-body" role="alert">{error}</p></main></>

  const clientName = client?.display_name ?? 'Auftraggebende Person'
  const canOffer = trade.status === 'offen' && !ownOffer && !success
  const offerSent = trade.status === 'offen' && (ownOffer || success)

  return (
    <>
      <AppBar back title="Trade" />
      <main className="screen helper-detail">
        {error && <p className="helper-detail__error text-caption" role="alert">{error}</p>}
        {success && <p className="helper-detail__success text-label" role="status">Dein Angebot wurde gesendet.</p>}
        {offerSent && <div className="helper-detail__state helper-detail__state--accent"><strong className="text-label">Angebot gesendet</strong><span className="text-caption">CHF {currency.format(ownOffer?.price_chf ?? Number(price))}{(ownOffer?.proposed_at || proposedAt) ? ` · ${formatDate(ownOffer?.proposed_at ?? proposedAt)}` : ''}</span></div>}
        {trade.photo_urls[0] ? <img className="helper-detail__hero" src={trade.photo_urls[0]} alt="" /> : <div className="helper-detail__hero helper-detail__hero--empty"><ImageIcon size={32} /></div>}
        <h2 className="helper-detail__title">{trade.title}</h2>
        <div className="helper-detail__facts">
          <p><Calendar size={20} aria-hidden /><span>{formatDate(trade.scheduled_at)}</span></p>
          <p><MapPin size={20} aria-hidden /><span>{trade.is_remote ? 'Überall · Remote' : trade.location ?? 'Ort offen'}</span></p>
          <p><Wallet size={20} aria-hidden /><span>Budget CHF {currency.format(trade.budget_chf)}</span></p>
        </div>
        {trade.description && <p className="text-body text-secondary">{trade.description}</p>}
        <Link className="helper-detail__client" to={`/profil/${trade.client_id}`}>
          <span className="helper-detail__avatar text-label">{initials(clientName)}</span>
          <span className="helper-detail__client-copy"><strong className="text-body-strong">{clientName}</strong><span className="text-caption text-secondary">Auftraggebende Person</span></span>
          <ChevronRight size={20} aria-hidden />
        </Link>
        {trade.status === 'vergeben' && <div className="helper-detail__state"><strong className="text-label">Auftrag erhalten</strong><span className="text-caption text-secondary">Wenn du fertig bist, kannst du den Abschluss melden.</span><Button onClick={() => void reportDone()} disabled={reportingDone}>{reportingDone ? 'Wird gemeldet …' : 'Als erledigt melden'}</Button></div>}
        {trade.status === 'zur_bestaetigung' && <div className="helper-detail__state helper-detail__state--success"><strong className="text-label">Wartet auf Freigabe</strong><span className="text-caption">Die auftraggebende Person prüft den Abschluss. Die Auszahlung wird danach freigegeben.</span></div>}
        {trade.status === 'abgeschlossen' && <div className="helper-detail__state helper-detail__state--success"><strong className="text-label">Abgeschlossen</strong><span className="text-caption">Auszahlung{payout !== null ? ` · CHF ${currency.format(payout)}` : ' wird angezeigt, sobald sie verfügbar ist.'}</span></div>}
      </main>
      {canOffer && <div className="helper-detail__action-bar"><Button onClick={() => setSheetOpen(true)}>Angebot machen</Button><button className="text-label helper-detail__question" type="button">Frage stellen</button></div>}
      {sheetOpen && (
        <div className="helper-detail__scrim" role="presentation" onClick={() => setSheetOpen(false)}>
          <section className="helper-detail__sheet" role="dialog" aria-modal="true" aria-labelledby="offer-title" onClick={(event) => event.stopPropagation()}>
            <div className="helper-detail__handle" />
            <h2 id="offer-title" className="text-h3">Dein Angebot</h2>
            <p className="text-caption text-secondary">Schlage einen fairen Preis und einen passenden Termin vor.</p>
            <form onSubmit={submitOffer} className="helper-detail__form">
              <label className="field"><span className="text-label">Preis in CHF</span><input className="input" type="number" min="1" step="0.50" value={price} onChange={(event) => setPrice(event.target.value)} placeholder={String(trade.budget_chf)} required /></label>
              <label className="field"><span className="text-label">Termin vorschlagen</span><input className="input" type="datetime-local" value={proposedAt} onChange={(event) => setProposedAt(event.target.value)} /></label>
              <label className="field"><span className="text-label">Nachricht <span className="text-secondary">(optional)</span></span><textarea className="helper-detail__textarea" rows={3} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Kurz etwas zu deiner Erfahrung schreiben …" /></label>
              <Button type="submit" disabled={submitting}>{submitting ? 'Wird gesendet …' : 'Angebot senden'}</Button>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
