// POST /api/create-payment-intent  { tradeId }
// Header: Authorization: Bearer <supabase access token>
//
// Called after rpc accept_offer() for TWINT/Karte. Returns the Stripe client secret
// for the Payment Element (B/05c). Stripe runs in TEST MODE – use card 4242 4242 4242 4242.
import { admin, json, stripe } from './_lib.js'

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const { data: auth } = await admin.auth.getUser(token)
  if (!auth.user) return json({ error: 'Nicht angemeldet' }, 401)

  const { tradeId } = (await request.json()) as { tradeId?: string }
  if (!tradeId) return json({ error: 'tradeId fehlt' }, 400)

  const { data: trade } = await admin.from('trades').select('id, client_id, title').eq('id', tradeId).single()
  if (!trade || trade.client_id !== auth.user.id) return json({ error: 'Trade nicht gefunden' }, 404)

  const { data: payment } = await admin.from('payments').select('*').eq('trade_id', tradeId).single()
  if (!payment || payment.method === 'bar') return json({ error: 'Keine digitale Zahlung offen' }, 400)
  if (!['offen', 'fehlgeschlagen'].includes(payment.status)) return json({ error: 'Bereits bezahlt' }, 409)

  // Reuse the existing intent when the user retries (B/13 Zahlung fehlgeschlagen)
  if (payment.stripe_payment_intent_id) {
    const existing = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id)
    if (existing.status !== 'canceled' && existing.status !== 'succeeded') {
      return json({ clientSecret: existing.client_secret })
    }
  }

  // Simplification for the school project: the amount is charged right away and
  // "held" only in our database (payments.status = 'hinterlegt') until release.
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(Number(payment.amount_chf) * 100),
    currency: 'chf',
    allowed_payment_method_types: [payment.method === 'twint' ? 'twint' : 'card'],
    description: trade.title,
    metadata: { trade_id: trade.id },
  })

  await admin.from('payments').update({ stripe_payment_intent_id: intent.id }).eq('id', payment.id)
  return json({ clientSecret: intent.client_secret })
}
