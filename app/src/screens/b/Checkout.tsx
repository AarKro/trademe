import { Calendar, CircleAlert, CircleCheck, Image as ImageIcon, MapPin, ShieldQuestion, Star, Wallet, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AppBar } from '../../components/AppBar'
import { Button } from '../../components/Button'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import type { Offer, Profile, Trade } from '../../lib/types'
import { TradeProgress } from './TradeProgress'
import './Checkout.css'

type CheckoutTrade = Pick<Trade, 'id' | 'title' | 'location' | 'is_remote' | 'photo_urls' | 'status' | 'helper_id'>
type CheckoutOffer = Pick<Offer, 'id' | 'helper_id' | 'price_chf' | 'proposed_at' | 'status'> & {
  helper: Pick<Profile, 'display_name' | 'avatar_url' | 'is_verified' | 'accepted_payment_methods'> | null
}
type Agreement = {
  trade: CheckoutTrade
  offer: CheckoutOffer
  rating: { rating_avg: number; rating_count: number } | null
  confirmed: boolean
}
type State = { kind: 'loading' | 'unavailable' | 'error' } | { kind: 'ready'; agreement: Agreement }

const francs = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 2 })
const ratingFormat = new Intl.NumberFormat('de', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const dateTime = new Intl.DateTimeFormat('de-CH', {
  weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich',
})
const uuid = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i

async function loadAgreement(tradeId: string, offerId: string, userId: string, signal?: AbortSignal) {
  if (!uuid.test(tradeId) || !uuid.test(offerId)) return null

  const tradeQuery = supabase.from('trades').select('id, title, location, is_remote, photo_urls, status, helper_id')
    .eq('id', tradeId).eq('client_id', userId)
  const { data: trade, error: tradeError } = await (signal ? tradeQuery.abortSignal(signal) : tradeQuery)
    .maybeSingle<CheckoutTrade>()
  if (tradeError) throw tradeError
  if (!trade) return null

  const offerQuery = supabase.from('offers')
    .select('id, helper_id, price_chf, proposed_at, status, helper:profiles!offers_helper_id_fkey(display_name, avatar_url, is_verified, accepted_payment_methods)')
    .eq('id', offerId).eq('trade_id', tradeId)
  const { data: offer, error: offerError } = await (signal ? offerQuery.abortSignal(signal) : offerQuery)
    .maybeSingle<CheckoutOffer>()
  if (offerError) throw offerError
  if (!offer) return null

  const accepted = offer.status === 'angenommen' && trade.helper_id === offer.helper_id
  if (!accepted && (trade.status !== 'offen' || offer.status !== 'offen')) return null

  let confirmed = false
  if (accepted) {
    const paymentQuery = supabase.from('payments').select('method').eq('trade_id', tradeId)
    const { data: payment, error } = await (signal ? paymentQuery.abortSignal(signal) : paymentQuery).maybeSingle()
    if (error) throw error
    if (payment?.method !== 'bar') return null
    confirmed = true
  }

  const ratingQuery = supabase.from('profile_stats').select('rating_avg, rating_count').eq('id', offer.helper_id)
  const { data: rating } = await (signal ? ratingQuery.abortSignal(signal) : ratingQuery).maybeSingle()
  return { trade, offer, rating, confirmed } satisfies Agreement
}

export function Checkout() {
  const { tradeId } = useParams()
  const [params] = useSearchParams()
  const { session } = useAuth()
  const offerId = params.get('offerId') ?? ''
  if (!tradeId || !session) return null
  return <CheckoutContent key={session.user.id + '/' + tradeId + '/' + offerId}
    tradeId={tradeId} offerId={offerId} userId={session.user.id} />
}

function CheckoutContent({ tradeId, offerId, userId }: { tradeId: string; offerId: string; userId: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const submitting = useRef(false)
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    void loadAgreement(tradeId, offerId, userId, controller.signal).then(
      (agreement) => {
        if (!controller.signal.aborted) setState(agreement ? { kind: 'ready', agreement } : { kind: 'unavailable' })
      },
      () => { if (!controller.signal.aborted) setState({ kind: 'error' }) },
    )
    return () => controller.abort()
  }, [tradeId, offerId, userId, attempt])

  const agreement = state.kind === 'ready' ? state.agreement : null
  const cashAvailable = agreement?.offer.helper?.accepted_payment_methods.includes('bar') ?? false
  const confirmed = agreement?.confirmed ?? false

  async function confirmCash() {
    if (!agreement || !cashAvailable || confirmed || submitting.current) return
    submitting.current = true
    setBusy(true)
    try {
      const { error } = await supabase.rpc('accept_offer', { p_offer_id: offerId, p_method: 'bar' })
      if (error) throw error
      setState({ kind: 'ready', agreement: { ...agreement, confirmed: true } })
      setFailed(false)
    } catch {
      // A connection can fail after the agreement has already been saved.
      try {
        const current = await loadAgreement(tradeId, offerId, userId)
        setState(current ? { kind: 'ready', agreement: current } : { kind: 'unavailable' })
        setFailed(Boolean(current && !current.confirmed))
      } catch {
        setFailed(true)
      }
    } finally {
      dialog.current?.close()
      submitting.current = false
      setBusy(false)
    }
  }

  const detail = '/trades/' + tradeId
  const name = agreement?.offer.helper?.display_name || 'Helfende Person'
  const price = agreement ? 'CHF ' + francs.format(agreement.offer.price_chf) : ''
  const proposed = agreement?.offer.proposed_at ? new Date(agreement.offer.proposed_at) : null
  const location = agreement?.trade.is_remote ? 'Überall' : agreement?.trade.location
  const count = agreement?.rating?.rating_count ?? 0
  const verified = agreement?.offer.helper?.is_verified

  return (
    <>
      <AppBar back title="Vereinbarung" />
      <main className="screen checkout">
        {state.kind === 'loading' && <p role="status">Vereinbarung wird geladen …</p>}
        {state.kind === 'unavailable' && <p role="status">Dieses Angebot ist für dich nicht mehr verfügbar.</p>}
        {state.kind === 'error' && (
          <>
            <p role="alert">Die Vereinbarung konnte nicht geladen werden.</p>
            <Button variant="secondary" onClick={() => {
              setState({ kind: 'loading' })
              setAttempt((value) => value + 1)
            }}>Erneut laden</Button>
          </>
        )}
        {agreement && (
          <>
            {failed && <div className="checkout__banner" role="alert">
              <CircleAlert aria-hidden />
              <div><p className="text-body-strong">Vereinbarung nicht bestätigt</p>
                <p className="text-body">Bitte prüfe das Angebot oder versuche es erneut.</p></div>
            </div>}
            {confirmed && <p className="checkout__confirmed text-label" role="status">
              <CircleCheck aria-hidden /> Vereinbarung bestätigt · Barzahlung vor Ort
            </p>}
            {!failed && <div className="checkout__summary">
              {agreement.trade.photo_urls[0]
                ? <img className="checkout__photo" src={agreement.trade.photo_urls[0]} alt="" />
                : <span className="checkout__photo"><ImageIcon aria-hidden /></span>}
              <h2 className="text-h3">{agreement.trade.title}</h2>
            </div>}
            <TradeProgress active={confirmed ? 2 : 1} hint={confirmed ? 'Bezahle vor Ort direkt bei der helfenden Person.' : 'Bestätige die Vereinbarung, damit der Termin eingeplant wird.'} />
            <section className="card checkout__card" aria-label="Vereinbarung">
              <div className="checkout__person">
                {agreement.offer.helper?.avatar_url
                  ? <img className="checkout__avatar" src={agreement.offer.helper.avatar_url} alt="" />
                  : <span className="checkout__avatar text-label" aria-hidden>{name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>}
                <div>
                  <p className="text-body-strong">{name}</p>
                  <p className="checkout__rating text-caption text-secondary"><Star aria-hidden />
                    {count && agreement.rating ? ratingFormat.format(agreement.rating.rating_avg) + ' · ' + count
                      + (count === 1 ? ' Bewertung' : ' Bewertungen') : 'Neu'}
                  </p>
                </div>
                <span className={`checkout__tag text-caption${verified ? ' checkout__tag--verified' : ''}`}>
                  {verified ? <CircleCheck aria-hidden /> : <ShieldQuestion aria-hidden />}
                  {verified ? 'Geprüft' : 'Nicht geprüft'}
                </span>
              </div>
              <div className="checkout__facts text-body">
                <p><Calendar aria-hidden />{proposed ? dateTime.format(proposed) : 'Termin noch offen'}</p>
                {location && <p><MapPin aria-hidden />{location}</p>}
                {confirmed && <p><Wallet aria-hidden />Bar vor Ort</p>}
              </div>
              <div className="checkout__total"><span className="text-label text-secondary">Vereinbart</span>
                <strong className="text-numeric">{price}</strong></div>
            </section>
            <div className="checkout__actions">
              {!confirmed && proposed && <p className="text-caption text-secondary">Kostenlose Stornierung bis {dateTime.format(new Date(proposed.getTime() - 48 * 60 * 60 * 1000))} · danach 20 %</p>}
              {confirmed
                ? <Link className="checkout__link text-label" to={detail}>Zum Trade</Link>
                : <Button onClick={() => dialog.current?.showModal()}>{failed ? 'Erneut versuchen' : 'Zahlungsmethode wählen'}</Button>}
              <Link className="checkout__link text-label" to={`/chat/${tradeId}/${agreement.offer.helper_id}`}>Im Chat klären</Link>
            </div>
            {!confirmed && <dialog ref={dialog} className="checkout__sheet" aria-labelledby="checkout-method"
              onCancel={(event) => { if (submitting.current) event.preventDefault() }}>
              <div className="checkout__sheet-header">
                <h2 id="checkout-method" className="text-h2">Zahlungsmethode</h2>
                <button type="button" aria-label="Schliessen" disabled={busy} onClick={() => dialog.current?.close()}><X aria-hidden /></button>
              </div>
              <fieldset disabled={busy} aria-label="Zahlungsmethoden">
                <label className="checkout__method"><input type="radio" name="payment" disabled />
                  <span><strong className="text-body-strong">TWINT</strong><span className="text-caption text-secondary">Kommt bald</span></span></label>
                <label className="checkout__method"><input type="radio" name="payment" disabled />
                  <span><strong className="text-body-strong">Kreditkarte</strong><span className="text-caption text-secondary">Kommt bald</span></span></label>
                <label className="checkout__method"><input type="radio" name="payment" checked={cashAvailable} readOnly disabled={!cashAvailable} />
                  <span><strong className="text-body-strong">Bar vor Ort</strong><span className="text-caption text-secondary">
                    {cashAvailable ? 'Ohne Zahlungsschutz von TradeMe' : 'Für dieses Angebot nicht verfügbar'}
                  </span></span></label>
              </fieldset>
              <div className="checkout__bill text-body">
                <p><span>{name} · {agreement.trade.title}</span><span>{price}</span></p>
                <p><span>Gebühr für dich</span><span>CHF 0</span></p>
              </div>
              <Button disabled={!cashAvailable || busy} onClick={() => void confirmCash()}>
                {busy ? 'Wird bestätigt …' : 'Barzahlung bestätigen'}
              </Button>
            </dialog>}
          </>
        )}
        {state.kind === 'unavailable' && <Link className="checkout__link text-label" to={detail}>Zurück zum Trade</Link>}
      </main>
    </>
  )
}
