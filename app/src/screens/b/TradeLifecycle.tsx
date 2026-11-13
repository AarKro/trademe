import { Calendar, CircleCheck, Image as ImageIcon, Lock, MapPin, TriangleAlert, Wallet, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { StatusBadge } from '../../components/StatusBadge'
import { supabase } from '../../lib/supabase'
import type { PaymentMethod, Profile, Trade } from '../../lib/types'
import { TradeProgress } from './TradeProgress'
import './Checkout.css'
import './TradeLifecycle.css'

type Payment = { method: PaymentMethod; amount_chf: number; status: string }
type Helper = Pick<Profile, 'display_name' | 'avatar_url' | 'is_verified'>
type Agreement = { helper: Helper | null; payment: Payment | null; rated: boolean }

const labels: Record<PaymentMethod, string> = { bar: 'Barzahlung vor Ort', twint: 'TWINT', karte: 'Kreditkarte' }
const reasons = ['Nicht vollständig erledigt', 'Schaden entstanden', 'Helfende Person nicht erschienen']
const date = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Zurich' })
const dateTime = new Intl.DateTimeFormat('de-CH', {
  weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich',
})
const francs = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 2 })

function zurichDay(timestamp: number) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' }).format(timestamp)
}

function reportDeadline(timestamp: number) {
  const utcDay = Date.parse(zurichDay(timestamp) + 'T00:00:00Z')
  return utcDay + 30 * 86_400_000
}

async function loadAgreement(trade: Trade, signal: AbortSignal): Promise<Agreement> {
  const [helper, payment, rating] = await Promise.all([
    trade.helper_id
      ? supabase.from('profiles').select('display_name, avatar_url, is_verified').eq('id', trade.helper_id).abortSignal(signal).maybeSingle<Helper>()
      : Promise.resolve({ data: null, error: null }),
    supabase.from('payments').select('method, amount_chf, status').eq('trade_id', trade.id).abortSignal(signal).maybeSingle<Payment>(),
    trade.status === 'abgeschlossen'
      ? supabase.from('ratings').select('id').eq('trade_id', trade.id).eq('author_id', trade.client_id).abortSignal(signal).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])
  if (helper.error || payment.error || rating.error) throw new Error('Agreement lookup failed')
  return { helper: helper.data, payment: payment.data, rated: Boolean(rating.data) }
}

export function TradeLifecycle({ trade, refresh }: { trade: Trade; refresh: () => void }) {
  const [now, setNow] = useState(() => Date.now())
  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [failedLoad, setFailedLoad] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [mode, setMode] = useState<'release' | 'report' | 'cancel' | null>(null)
  const [reported, setReported] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const pending = useRef(false)

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadAgreement(trade, controller.signal).then(
      (value) => { if (!controller.signal.aborted) setAgreement(value) },
      () => { if (!controller.signal.aborted) setFailedLoad(true) },
    )
    return () => controller.abort()
  }, [trade, attempt])

  function open(next: 'release' | 'report' | 'cancel') {
    setError('')
    setMode(next)
    dialog.current?.showModal()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!mode || pending.current) return
    const data = new FormData(event.currentTarget)
    const reason = String(data.get('reason') ?? '')
    const details = String(data.get('details') ?? '').trim()
    if (mode === 'report' && !reasons.includes(reason)) return

    pending.current = true
    setBusy(true)
    setError('')
    const expected = mode === 'report' ? 'problem' : mode === 'cancel' ? 'storniert' : 'abgeschlossen'
    try {
      const result = mode === 'report'
        ? await supabase.rpc('report_problem', { p_trade_id: trade.id, p_reason: reason, p_details: details || null })
        : mode === 'cancel'
          ? await supabase.rpc('cancel_trade', { p_trade_id: trade.id })
          : await supabase.rpc('release_trade', { p_trade_id: trade.id })
      if (result.error) {
        const latest = await supabase.from('trades').select('status').eq('id', trade.id).maybeSingle()
        if (latest.data?.status !== expected) {
          if (latest.data && latest.data.status !== trade.status) {
            dialog.current?.close()
            refresh()
            return
          }
          throw result.error
        }
      }
      dialog.current?.close()
      if (mode === 'report') setReported(true)
      else refresh()
    } catch {
      setError('Die Aktion konnte nicht bestätigt werden. Bitte versuche es erneut.')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  if (reported) return (
    <>
      <h2 className="text-h1">Meldung gesendet</h2>
      <p className="text-body">TradeMe prüft deinen Fall.</p>
      <Button variant="secondary" onClick={() => { setReported(false); refresh() }}>Zurück zum Auftrag</Button>
    </>
  )

  if (trade.status === 'storniert' || trade.status === 'problem') return (
    <>
      <StatusBadge status={trade.status} />
      <h2 className="text-h3">{trade.title}</h2>
      {trade.status === 'problem' && <p className="text-body">TradeMe prüft den Fall.</p>}
      <Link className="checkout__link text-label" to="/trades">Zu meinen Trades</Link>
    </>
  )

  if (failedLoad) return (
    <>
      <p className="text-body" role="alert">Die Vereinbarung konnte nicht geladen werden.</p>
      <Button variant="secondary" onClick={() => { setFailedLoad(false); setAttempt((value) => value + 1) }}>Erneut laden</Button>
    </>
  )
  if (!agreement) return <p className="text-body" role="status">Vereinbarung wird geladen …</p>

  const { helper, payment, rated } = agreement
  const name = helper?.display_name || 'Helfende Person'
  const price = payment ? 'CHF ' + francs.format(payment.amount_chf) : null
  const cash = payment?.method === 'bar'
  const held = payment?.status === 'hinterlegt'
  const reviewing = trade.status === 'zur_bestaetigung'
  const done = trade.status === 'abgeschlossen'
  const reportedAt = trade.completed_reported_at ? Date.parse(trade.completed_reported_at) : null
  const day = 86_400_000
  const releaseAt = reportedAt === null ? null : reportedAt + 10 * day
  const reminder = releaseAt !== null && reportedAt !== null && now >= reportedAt + 7 * day && now < releaseAt
  const daysLeft = releaseAt === null ? 0 : Math.ceil((releaseAt - now) / day)
  const canReport = reportedAt === null || Date.parse(zurichDay(now) + 'T00:00:00Z') <= reportDeadline(reportedAt)
  const freeUntil = trade.scheduled_at ? Date.parse(trade.scheduled_at) - 48 * 60 * 60 * 1000 : null
  const appointment = trade.scheduled_at ? dateTime.format(new Date(trade.scheduled_at)) : 'Termin noch offen'
  const location = trade.is_remote ? 'Überall' : trade.location
  const avatar = (className: string) => helper?.avatar_url
    ? <img className={className} src={helper.avatar_url} alt="" />
    : <span className={className} aria-hidden>{name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()}</span>
  const chat = trade.helper_id && `/chat/${trade.id}/${trade.helper_id}`

  return (
    <>
      {done ? (
        <div className="trade-lifecycle__done">
          {avatar('checkout__avatar trade-lifecycle__done-avatar')}
          <h2 className="text-h2">Trade abgeschlossen</h2>
          <p className="text-body text-secondary">
            {cash ? 'Die vereinbarte Zahlung erfolgt bar vor Ort.' : price && payment?.status === 'freigegeben'
              ? `${price} wurden für ${name} freigegeben.` : 'Danke fürs Vertrauen!'}
          </p>
          {rated && <p className="text-label">Bewertung abgegeben</p>}
        </div>
      ) : (
        <>
          {!reviewing && <p className="trade-detail__online text-label">
            <CircleCheck aria-hidden />{cash ? 'Buchung bestätigt · bar vor Ort'
              : held && price ? `Bezahlt – ${price} sind sicher hinterlegt` : 'Vereinbarung bestätigt'}
          </p>}
          {reviewing && reminder ? (
            <div className="trade-lifecycle__reminder">
              <TriangleAlert aria-hidden />
              <div><p className="text-body-strong">{daysLeft === 1 ? 'Noch 1 Tag' : `Noch ${daysLeft} Tage`}</p>
                <p className="text-body">Ohne Rückmeldung wird der Trade am {date.format(releaseAt)} automatisch abgeschlossen.</p></div>
            </div>
          ) : (
            <div className="checkout__summary">
              {trade.photo_urls[0] ? <img className="checkout__photo" src={trade.photo_urls[0]} alt="" />
                : <span className="checkout__photo"><ImageIcon aria-hidden /></span>}
              <div><h2 className="text-h3">{trade.title}</h2>
                {reviewing && <p className="text-caption text-secondary">{[name, appointment, price].filter(Boolean).join(' · ')}</p>}</div>
            </div>
          )}
          <TradeProgress active={reviewing ? 3 : 2} hint={reviewing
            ? releaseAt === null ? 'Abschluss prüfen' : `Freigabe bis ${date.format(releaseAt)} · sonst automatisch`
            : trade.scheduled_at ? `Termin ${appointment}` : appointment} />
          {reviewing ? (
            <section className="card" aria-label="Erledigtmeldung">
              <div className="checkout__person">{avatar('checkout__avatar')}
                <div><h2 className="text-body-strong">{name} meldet: erledigt</h2>
                  {reportedAt !== null && <p className="text-caption text-secondary">{dateTime.format(reportedAt)}</p>}
                </div>
              </div>
            </section>
          ) : (
            <section className="card" aria-label="Vereinbarung">
              <div className="checkout__person">{avatar('checkout__avatar')}
                <div><h2 className="text-body-strong">{name}</h2></div>
                {helper?.is_verified && <span className="checkout__tag checkout__tag--verified text-caption"><CircleCheck aria-hidden />Geprüft</span>}
              </div>
              <div className="checkout__facts">
                <p><Calendar aria-hidden />{appointment}</p>
                {location && <p><MapPin aria-hidden />{location}</p>}
                {payment && <p><Wallet aria-hidden />{labels[payment.method]}{held && !cash ? ' · hinterlegt' : ''}</p>}
              </div>
              {price && <div className="checkout__total"><span className="text-label text-secondary">Vereinbart</span><strong className="text-numeric">{price}</strong></div>}
            </section>
          )}
        </>
      )}
      <div className="checkout__actions">
        {!reviewing && !done && freeUntil !== null && now <= freeUntil &&
          <p className="text-caption text-secondary">Gratis stornierbar bis {dateTime.format(freeUntil)}</p>}
        {reviewing && <Button onClick={() => open('release')}>Freigeben</Button>}
        {done && !rated && <Link className="button button--primary text-body-strong trade-lifecycle__primary" to={`/trades/${trade.id}/bewerten`}>Bewertung abgeben</Link>}
        {!reviewing && !done && chat && <Link className="button button--primary text-body-strong trade-lifecycle__primary" to={chat}>Chat mit {name}</Link>}
        {!reviewing && !done && <button className="checkout__link trade-lifecycle__link-button text-label" type="button" onClick={() => open('cancel')}>Trade stornieren</button>}
        {canReport && <button className="checkout__link trade-lifecycle__link-button text-label" type="button" onClick={() => open('report')}>Problem melden</button>}
        {done && <Link className="checkout__link text-label" to="/trades">{rated ? 'Zu meinen Trades' : 'Später'}</Link>}
      </div>
      <dialog ref={dialog} className="checkout__sheet" aria-labelledby="lifecycle-title"
        onCancel={(event) => { if (pending.current) event.preventDefault() }}>
        <form className="trade-lifecycle__form" onSubmit={(event) => void submit(event)} key={mode}>
          <div className="checkout__sheet-header">
            <h2 id="lifecycle-title" className="text-h2">{mode === 'release' ? cash ? 'Abschluss bestätigen?' : 'Zahlung freigeben?' : mode === 'cancel' ? 'Trade stornieren?' : 'Problem melden'}</h2>
            <button type="button" aria-label="Schliessen" disabled={busy} onClick={() => dialog.current?.close()}><X aria-hidden /></button>
          </div>
          {mode === 'cancel' ? (
            <p className="text-body text-secondary">{freeUntil !== null && now > freeUntil
              ? 'Die kostenlose Frist ist abgelaufen. Bei einer Stornierung fallen 20 % an.'
              : 'Der Trade kann kostenlos storniert werden.'}</p>
          ) : mode === 'release' ? (
            <>
              {price && <><p className="text-label text-secondary">Vereinbart mit {name}</p><p className="text-h1">{price}</p></>}
              <p className="text-body text-secondary">{cash
                ? 'Damit bestätigst du, dass der Auftrag erledigt ist. Die Zahlung erfolgt bar vor Ort.'
                : 'Damit bestätigst du den Abschluss und gibst die hinterlegte Zahlung frei.'}</p>
            </>
          ) : (
            <>
              <fieldset disabled={busy} aria-label="Grund">
                {reasons.map((reason, index) => (
                  <label key={reason} className="checkout__method">
                    <input type="radio" name="reason" value={reason} defaultChecked={index === 0} required />
                    <span className="text-body-strong">{reason}</span>
                  </label>
                ))}
              </fieldset>
              <label className="field text-label">Was ist passiert?
                <textarea className="input text-body" name="details" rows={2} maxLength={2000} disabled={busy} placeholder="Kurz beschreiben (optional)" />
              </label>
              <p className="trade-lifecycle__privacy text-caption text-secondary"><Lock aria-hidden />
                {held ? 'Die Freigabe wird pausiert. TradeMe prüft den Fall.' : 'TradeMe prüft den Fall.'}</p>
            </>
          )}
          {error && <p className="trade-lifecycle__error text-label" role="alert">{error}</p>}
          <Button type="submit" disabled={busy}>{busy ? 'Wird gespeichert …' : mode === 'release' ? 'Jetzt freigeben' : mode === 'cancel' ? 'Stornierung bestätigen' : 'Meldung senden'}</Button>
          {mode !== 'report' && <button type="button" disabled={busy} className="checkout__link trade-lifecycle__link-button text-label" onClick={() => dialog.current?.close()}>Noch nicht</button>}
        </form>
      </dialog>
    </>
  )
}
