import { ImageOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ActionBar } from '../../components/ActionBar'
import { AppBar } from '../../components/AppBar'
import { Button } from '../../components/Button'
import { Rating } from '../../components/Rating'
import { Zustand } from '../../components/Zustand'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import type { Trade } from '../../lib/types'
import './Profile.css'
import './RateTrade.css'

type Person = { id: string; display_name: string }
type Payment = { amount_chf: number; payout_chf: number }
type TradeRow = Pick<Trade, 'id' | 'title' | 'photo_urls' | 'scheduled_at' | 'client_id' | 'helper_id' | 'status'> & {
  client: Person | null
  helper: Person | null
  payment: Payment | Payment[] | null
}

type Load = { state: 'loading' } | { state: 'missing' } | { state: 'ready'; trade: TradeRow; alreadyRated: boolean }

const firstName = (name: string) => name.split(/\s+/)[0] || name
/** Swiss possessive: «Lea» → «Leas», «Hans» → «Hans’» */
const possessive = (name: string) => (/[sxzß]$/i.test(name) ? `${name}’` : `${name}s`)
const chf = (amount: number) => `CHF ${Number.isInteger(amount) ? amount : amount.toFixed(2)}`
const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
/** «Sa, 14.11.» as in Figma */
const shortDate = (iso: string) => {
  const d = new Date(iso)
  return `${weekdays[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}.`
}

// A/11–A/14 Bewertung abgeben (447:5423, 447:5438, 447:5452, 447:5458).
// Same screen for both sides: the client rates the helper (A/11, A/12), the helper rates the client (A/14).
// Only possible once the trade is «abgeschlossen» (enforced by the ratings insert policy too).
export function RateTrade() {
  const { tradeId } = useParams()
  const { session } = useAuth()
  const me = session?.user.id
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!tradeId || !me) return
    const controller = new AbortController()
    Promise.all([
      supabase
        .from('trades')
        .select(
          'id, title, photo_urls, scheduled_at, client_id, helper_id, status, ' +
            'client:profiles!trades_client_id_fkey(id, display_name), helper:profiles!trades_helper_id_fkey(id, display_name), ' +
            'payment:payments(amount_chf, payout_chf)',
        )
        .eq('id', tradeId)
        .abortSignal(controller.signal)
        .maybeSingle<TradeRow>(),
      supabase
        .from('ratings')
        .select('id')
        .eq('trade_id', tradeId)
        .eq('author_id', me)
        .abortSignal(controller.signal)
        .maybeSingle(),
    ]).then(([t, r]) => {
      if (controller.signal.aborted) return
      const trade = t.data
      if (!trade || (trade.client_id !== me && trade.helper_id !== me)) return setLoad({ state: 'missing' })
      setLoad({ state: 'ready', trade, alreadyRated: Boolean(r.data) })
    })
    return () => controller.abort()
  }, [tradeId, me])

  if (load.state === 'loading') return <AppBar title="Bewertung" back />
  if (load.state === 'missing')
    return (
      <>
        <AppBar title="Bewertung" back />
        <main className="screen profile">
          <Zustand
            mascot="plaudi"
            title="Trade nicht gefunden"
            text="Du kannst nur Trades bewerten, an denen du beteiligt warst."
          />
        </main>
      </>
    )

  const { trade } = load
  const iAmClient = trade.client_id === me
  const other = (iAmClient ? trade.helper : trade.client) ?? { id: '', display_name: 'Unbekannt' }

  if (sent || load.alreadyRated) return <RatingSent other={other} again={!sent} />

  if (trade.status !== 'abgeschlossen')
    return (
      <>
        <AppBar title="Bewertung" back />
        <main className="screen profile">
          <Zustand
            mascot="plaudi"
            title="Noch nicht bewertbar"
            text="Sobald der Trade freigegeben und abgeschlossen ist, könnt ihr euch gegenseitig bewerten."
          />
        </main>
      </>
    )

  return <RatingForm trade={trade} iAmClient={iAmClient} other={other} me={me!} onSent={() => setSent(true)} />
}

function RatingForm({
  trade,
  iAmClient,
  other,
  me,
  onSent,
}: {
  trade: TradeRow
  iAmClient: boolean
  other: Person
  me: string
  onSent: () => void
}) {
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const first = firstName(other.display_name)
  const payment = Array.isArray(trade.payment) ? trade.payment[0] : trade.payment

  const subtitle = [
    other.display_name,
    trade.scheduled_at && shortDate(trade.scheduled_at),
    payment &&
      (iAmClient ? `${chf(Number(payment.amount_chf))} freigegeben` : `${chf(Number(payment.payout_chf))} ausgezahlt`),
  ]
    .filter(Boolean)
    .join(' · ')

  async function send() {
    if (!stars || busy) return
    setBusy(true)
    setError(null)
    const { error } = await supabase.from('ratings').insert({
      trade_id: trade.id,
      author_id: me,
      subject_id: other.id,
      stars,
      comment: comment.trim() || null,
    })
    setBusy(false)
    // 23505 = unique (trade, author): rated already, e.g. in another tab
    if (error && error.code !== '23505') return setError('Senden hat nicht geklappt. Bitte versuche es nochmals.')
    onSent()
  }

  return (
    <>
      <AppBar title="Bewertung" back />
      <main className="screen profile screen--with-action-bar">
        <div className="rate__hero">
          {trade.photo_urls[0] ? (
            <img className="rate__image" src={trade.photo_urls[0]} alt="" />
          ) : (
            <span className="rate__image rate__image--empty" aria-hidden>
              <ImageOff />
            </span>
          )}
          <div className="rate__hero-text">
            <h2 className="text-h3">{trade.title}</h2>
            <p className="text-caption text-secondary">{subtitle}</p>
          </div>
        </div>

        <section className="rate__stars">
          <h2 className="text-h2">Gib {first} ein Feedback</h2>
          <Rating value={stars} onChange={setStars} />
          {!iAmClient ? (
            <p className="text-caption text-secondary">{possessive(first)} Bewertung siehst du nach dem Senden.</p>
          ) : (
            !stars && <p className="text-caption text-secondary">Tippe auf einen Stern</p>
          )}
        </section>

        <div className="field">
          <label className="text-label" htmlFor="comment">
            Kommentar (optional)
          </label>
          <textarea
            id="comment"
            className="input text-body profile-edit__textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Was lief gut, was weniger?"
            maxLength={300}
          />
          <p className="text-caption text-secondary">Öffentlich in {possessive(first)} Profil · max. 300 Zeichen</p>
        </div>
        {error && (
          <p className="profile-edit__error text-caption" role="alert">
            {error}
          </p>
        )}
      </main>
      <ActionBar>
        <Button onClick={send} disabled={!stars || busy}>
          {busy ? 'Wird gesendet …' : 'Bewertung senden'}
        </Button>
      </ActionBar>
    </>
  )
}

/** A/13 Bewertung gesendet – Erfolg */
function RatingSent({ other, again }: { other: Person; again: boolean }) {
  const navigate = useNavigate()
  const first = firstName(other.display_name)
  return (
    <>
      <AppBar title="Bewertung" back />
      <main className="screen profile screen--with-action-bar rate__done">
        <Zustand
          mascot="plaudi"
          title={again ? 'Schon bewertet' : 'Danke für deine Bewertung!'}
          text={`Sie erscheint in ${possessive(first)} Profil, sobald ${first} dich auch bewertet hat – spätestens in 14 Tagen.`}
        />
      </main>
      <ActionBar>
        <Button onClick={() => navigate('/trades')}>Zu meinen Trades</Button>
        {other.id && (
          <Button variant="text" onClick={() => navigate(`/profil/${other.id}`)}>
            {possessive(first)} Profil ansehen
          </Button>
        )}
      </ActionBar>
    </>
  )
}
